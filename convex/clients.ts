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
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\bbank\b/g, "") // 1. Remove the whole word "bank" first
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // 2. Then, remove punctuation
    .replace(/\s{2,}/g, " ") // 3. Replace multiple spaces with a single one
    .trim();
};

// --- SEARCH QUERY (for locations autocomplete) ---
/**
 * Searches for client locations by their full name OR branch name.
 */
export const searchLocations = query({
  args: {
    searchText: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchText.length < 2) {
      return [];
    }

    const normalizedQuery = normalizeName(args.searchText);

    if (normalizedQuery.length === 0) {
      return [];
    }

    const [fullNameResults, nameResults] = await Promise.all([
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
    ]);

    const combinedResults = [...fullNameResults, ...nameResults];

    const uniqueResults = new Map<Id<"clientLocations">, Doc<"clientLocations">>();
    for (const doc of combinedResults) {
      if (!uniqueResults.has(doc._id)) {
        uniqueResults.set(doc._id, doc);
      }
    }

    return Array.from(uniqueResults.values())
      .slice(0, 10)
      .map(doc => ({
        _id: doc._id,
        displayText: doc.fullName,
      }));
  },
});


// --- MUTATIONS ---

/**
 * Creates a new client.
 */
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

/**
 * Creates a new client location (branch).
 */
export const createLocation = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.name.trim().length === 0) {
      throw new Error("Location name cannot be empty.");
    }

    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found. Cannot create location.");
    }

    const fullName = `${client.name} - ${args.name}`;
    const searchName = normalizeName(args.name);
    const searchFullName = normalizeName(fullName);

    const locationId = await ctx.db.insert("clientLocations", {
      clientId: args.clientId,
      name: args.name,
      fullName: fullName,
      searchName: searchName,
      searchFullName: searchFullName,
    });

    return locationId;
  },
});

// --- QUERIES ---

/**
 * Gets a list of all clients for populating dropdowns.
 */
export const listClients = query({
  handler: async (ctx): Promise<Doc<"clients">[]> => {
    const clients = await ctx.db.query("clients").order("asc").collect();
    return clients;
  },
});

/**
 * Gets a specific client and all of their associated locations (branches).
 */
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

/**
 * Searches for clients by name for the main client list page.
 */
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