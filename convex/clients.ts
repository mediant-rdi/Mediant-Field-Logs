// convex/clients.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Reusable agreement type for function arguments
const agreementType = v.union(
  v.literal('LEASE'),
  v.literal('COMPREHENSIVE'),
  v.literal('CONTRACT')
);

/**
 * Normalizes a string for searching.
 * Converts to lowercase, removes the word "bank", then removes punctuation,
 * and trims extra whitespace. The order of operations is important.
 * e.g., "NCBA Bank - Town" -> "ncba town"
 */
export const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\bbank\b/g, "") // 1. Remove the whole word "bank" first
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // 2. Then, remove punctuation
    .replace(/\s{2,}/g, " ") // 3. Replace multiple spaces with a single one
    .trim();
};

// --- THIS QUERY IS CORRECTED ---
/**
 * Searches for client locations by name, filtering out locations already assigned to other users.
 */
export const searchLocations = query({
  args: {
    searchText: v.string(),
    // ADDED: Pass the ID of the user being edited to provide context for filtering.
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
    
    // --- ADDED FILTERING LOGIC ---
    // If no user context is provided, return the unfiltered results.
    if (!args.userIdForContext) {
        return uniqueResultsList
            .slice(0, 10)
            .map(doc => ({ ...doc, displayText: doc.fullName }));
    }

    // 1. Get all users *except* the one being edited.
    const otherUsers = await ctx.db
        .query("users")
        .filter(q => q.neq(q.field("_id"), args.userIdForContext!))
        .collect();

    // 2. Create a Set of all location IDs assigned to those other users for efficient lookup.
    const assignedToOthers = new Set<Id<"clientLocations">>();
    for (const user of otherUsers) {
        user.serviceLocationIds?.forEach(id => assignedToOthers.add(id));
    }

    // 3. Filter the search results, removing any location that is already assigned to someone else.
    const availableResults = uniqueResultsList.filter(location => !assignedToOthers.has(location._id));

    return availableResults
      .slice(0, 10)
      .map(doc => ({
        ...doc,
        displayText: doc.fullName,
      }));
  },
});


// --- MUTATIONS (Unchanged) ---

export const createClient = mutation({
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

// --- QUERIES (Unchanged) ---

export const listClients = query({
  handler: async (ctx): Promise<Doc<"clients">[]> => {
    const clients = await ctx.db.query("clients").order("asc").collect();
    return clients;
  },
});

export const getLocationsForClient = query({
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