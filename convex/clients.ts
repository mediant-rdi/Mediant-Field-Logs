// convex/clients.ts
import { v } from "convex/values";
import { mutation, query, DatabaseReader } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server"; // <-- IMPORT for helper

// --- NEW: Reusable helper function to check for admin privileges ---
// This pattern matches the one used in `machines.ts` for consistency and security.
const ensureAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }
  
  const user = await ctx.db.get(userId);
  if (!user || !user.isAdmin) {
    throw new Error("Permission denied: You do not have permission to perform this action.");
  }
  return user;
};


// (Omitting other functions for brevity as they are unchanged)
// ... normalizeName, searchLocations, createClient, createLocation ...

const agreementType = v.union(
  v.literal('LEASE'),
  v.literal('COMPREHENSIVE'),
  v.literal('CONTRACT')
);

export const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\bbank\b/g, "") 
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

export const searchLocations = query({
  // ... (implementation unchanged)
  args: {
    searchText: v.string(),
    userIdForContext: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.searchText.length < 2) {
      return [];
    }
    const rawQuery = args.searchText;
    const normalizedQuery = normalizeName(args.searchText);
    if (normalizedQuery.length === 0 && rawQuery.length < 2) {
      return [];
    }
    const [fullNameResults, nameResults, textSearchResults] = await Promise.all([
      ctx.db
        .query("clientLocations")
        .withIndex("by_full_search_name", (q) =>
          q.gte("searchFullName", normalizedQuery).lt("searchFullName", normalizedQuery + "\uffff")
        )
        .take(10),
      ctx.db
        .query("clientLocations")
        .withIndex("by_search_name", (q) =>
          q.gte("searchName", normalizedQuery).lt("searchName", normalizedQuery + "\uffff")
        )
        .take(10),
      ctx.db
        .query("clientLocations")
        .withSearchIndex("by_full_name_text", (q) => 
          q.search("fullName", rawQuery)
        )
        .take(10)
    ]);
    const combinedResults = [...textSearchResults, ...fullNameResults, ...nameResults];
    const uniqueResults = new Map<Id<"clientLocations">, Doc<"clientLocations">>();
    for (const doc of combinedResults) {
      if (!uniqueResults.has(doc._id)) {
        uniqueResults.set(doc._id, doc);
      }
    }
    const uniqueResultsList = Array.from(uniqueResults.values());
    if (!args.userIdForContext) {
        const allUsers = await ctx.db.query("users").collect();
        const allAssignedLocations = new Set<Id<"clientLocations">>();
        allUsers.forEach(u => u.serviceLocationIds?.forEach(id => allAssignedLocations.add(id)));
        return uniqueResultsList
            .filter(loc => !allAssignedLocations.has(loc._id))
            .slice(0, 10)
            .map(doc => ({ ...doc, displayText: doc.fullName }));
    }
    const allUsers = await ctx.db.query("users").collect();
    const userInContext = allUsers.find(u => u._id === args.userIdForContext);
    if (!userInContext) return [];
    const userInContextLeader = allUsers.find(u => u.taggedTeamMemberIds?.includes(userInContext._id)) ?? userInContext;
    const locationOwnerLeaderMap = new Map<Id<"clientLocations">, Id<"users">>();
    for (const user of allUsers) {
        if (user.serviceLocationIds) {
            const userLeader = allUsers.find(u => u.taggedTeamMemberIds?.includes(user._id)) ?? user;
            for (const locationId of user.serviceLocationIds) {
                locationOwnerLeaderMap.set(locationId, userLeader._id);
            }
        }
    }
    const availableResults = uniqueResultsList.filter(location => {
        const ownerLeaderId = locationOwnerLeaderMap.get(location._id);
        if (!ownerLeaderId) {
            return true;
        }
        return ownerLeaderId === userInContextLeader._id;
    });
    return availableResults
      .slice(0, 10)
      .map(doc => ({
        ...doc,
        displayText: doc.fullName,
      }));
  },
});

export const createClient = mutation({
  // ... (implementation unchanged)
  args: {
    name: v.string(),
    agreementType: agreementType,
  },
  handler: async (ctx, args) => {
    if (args.name.trim().length === 0) {
      throw new Error("Client name cannot be empty.");
    }
    const searchName = normalizeName(args.name);
    const clientId = await ctx.db.insert("clients", {
      name: args.name,
      searchName: searchName,
      agreementType: args.agreementType,
    });
    return clientId;
  },
});

export const createLocation = mutation({
  // ... (implementation unchanged)
  args: {
    clientId: v.id("clients"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();
    if (trimmedName.length === 0) {
      throw new Error("Location name cannot be empty.");
    }
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found. Cannot create location.");
    }
    const searchName = normalizeName(trimmedName);
    const existingLocation = await ctx.db
      .query("clientLocations")
      .withIndex("by_client_and_search", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("searchName"), searchName))
      .first();
    if (existingLocation) {
      throw new Error(
        "This location/branch name already exists for this client."
      );
    }
    const fullName = `${client.name} - ${trimmedName}`;
    const searchFullName = normalizeName(fullName);
    const locationId = await ctx.db.insert("clientLocations", {
      clientId: args.clientId,
      name: trimmedName,
      fullName: fullName,
      searchName: searchName,
      searchFullName: searchFullName,
    });
    return locationId;
  },
});

/**
 * Deletes a client location. Only available to admins.
 * This also removes the location from any user's `serviceLocationIds`.
 */
export const deleteLocation = mutation({
  args: {
    locationId: v.id("clientLocations"),
  },
  handler: async (ctx, args) => {
    // --- CORRECTED: Use the ensureAdmin helper for a clean, secure check ---
    await ensureAdmin(ctx);

    // Check if the location exists before proceeding
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      // If location is already gone, the job is done. Exit gracefully.
      console.warn(`Attempted to delete a location that doesn't exist: ${args.locationId}`);
      return;
    }

    // Delete the client location document itself
    await ctx.db.delete(args.locationId);

    // Clean up references from all users who were assigned this location
    const allUsers = await ctx.db.query("users").collect();
    const updatePromises = allUsers
      .filter(u => u.serviceLocationIds?.includes(args.locationId))
      .map(u => ctx.db.patch(u._id, {
        serviceLocationIds: u.serviceLocationIds!.filter(id => id !== args.locationId)
      }));
    
    // Run all patch operations in parallel for efficiency
    await Promise.all(updatePromises);
  },
});


// ... (remaining unchanged queries: listClients, getLocationsForClient, etc.) ...

export const listClients = query({
  // ... (implementation unchanged)
  handler: async (ctx): Promise<Doc<"clients">[]> => {
    const clients = await ctx.db.query("clients").order("asc").collect();
    return clients;
  },
});

export const getLocationsForClient = query({
  // ... (implementation unchanged)
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      return null;
    }
    const locations = await ctx.db
      .query("clientLocations")
      .withIndex("by_client_and_search", q => q.eq("clientId", args.clientId))
      .order("asc")
      .collect();
    return { client, locations };
  },
});

export const searchClients = query({
  // ... (implementation unchanged)
  args: {
    searchText: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchText.trim() === "") {
      return ctx.db.query("clients").order("asc").collect();
    }
    const normalizedQuery = normalizeName(args.searchText);
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_search_name", (q) =>
        q.gte("searchName", normalizedQuery).lt("searchName", normalizedQuery + "\uffff")
      )
      .collect();
    return clients;
  },
});

export const getLocationsByIds = query({
  // ... (implementation unchanged)
  args: {
    ids: v.array(v.id("clientLocations")),
  },
  handler: async (ctx, args) => {
    const locations = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );
    return locations.filter((loc): loc is Doc<"clientLocations"> => loc !== null);
  },
});