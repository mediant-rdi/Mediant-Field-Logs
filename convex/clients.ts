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
 * Converts to lowercase, removes punctuation, removes the word "bank",
 * and trims extra whitespace.
 * e.g., "J.P. Morgan & Co." -> "jp morgan co"
 * e.g., "NCBA Bank Town" -> "ncba town"
 */
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
    .replace(/\bbank\b/g, "") // Remove the whole word "bank"
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with a single one
    .trim();
};

// --- UPDATED SEARCH QUERY ---
/**
 * Searches for client locations by their full name OR branch name.
 *
 * This query implements a two-tiered search:
 * 1. It first prioritizes matches on the full name (e.g., "KCB - Gikomba").
 * 2. It then includes matches on just the branch name (e.g., "Gikomba").
 *
 * The search is case-insensitive, ignores punctuation, and the word "bank".
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

    // If the query is empty after normalization (e.g., user only typed "bank"), return no results.
    if (normalizedQuery.length === 0) {
      return [];
    }

    // Run searches for full name and branch name in parallel for efficiency
    const [fullNameResults, nameResults] = await Promise.all([
      // Primary search: by the prefix of the full search name
      ctx.db
        .query("clientLocations")
        .withIndex("by_full_search_name", (q) =>
          q.gte("searchFullName", normalizedQuery).lt("searchFullName", normalizedQuery + "\uffff")
        )
        .take(10),

      // Secondary search: by the prefix of the branch search name
      // This allows searching for "gikomba" to find "KCB - Gikomba", "Co-op - Gikomba", etc.
      ctx.db
        .query("clientLocations")
        .withIndex("by_search_name", (q) =>
          q.gte("searchName", normalizedQuery).lt("searchName", normalizedQuery + "\uffff")
        )
        .take(10),
    ]);

    // Combine results, with full name matches appearing first to give them priority
    const combinedResults = [...fullNameResults, ...nameResults];

    // De-duplicate the results using a Map, which preserves insertion order (and thus priority)
    const uniqueResults = new Map<Id<"clientLocations">, Doc<"clientLocations">>();
    for (const doc of combinedResults) {
      if (!uniqueResults.has(doc._id)) {
        uniqueResults.set(doc._id, doc);
      }
    }

    // Convert map back to an array, limit to 10 total results, and format for the frontend
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
 * Automatically generates the normalized `searchName` for autocomplete.
 */
export const createClient = mutation({
  args: {
    name: v.string(),
    agreementType: agreementType,
  },
  handler: async (ctx, args) => {
    // Prevent creating clients with empty names
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
 * Requires a parent client and automatically generates all search fields.
 */
export const createLocation = mutation({
  args: {
    clientId: v.id("clients"),
    // This is the "Branch Name" from the form
    name: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.name.trim().length === 0) {
      throw new Error("Location name cannot be empty.");
    }

    // 1. Get the parent client to construct the full name
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found. Cannot create location.");
    }

    // 2. Generate all required name variations
    const fullName = `${client.name} - ${args.name}`;
    const searchName = normalizeName(args.name);
    const searchFullName = normalizeName(fullName);

    // 3. Insert the new location into the database
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
 * Gets a list of all clients for populating dropdowns, like in AddClientLocationForm.
 */
export const listClients = query({
  handler: async (ctx): Promise<Doc<"clients">[]> => {
    // Using .collect() to get all clients. For very large lists, you might add pagination.
    const clients = await ctx.db.query("clients").order("asc").collect();
    return clients;
  },
});