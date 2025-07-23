// convex/machines.ts
import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { machineCategory } from "./shared"; 
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Helper function to check for admin privileges
const ensureAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }
  
  const user = await ctx.db.get(userId);
  if (!user || !user.isAdmin) {
    throw new Error("You do not have permission to perform this action.");
  }
  return user;
};


// --- CREATE a new machine ---
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: machineCategory,
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx); // <-- Security Check

    const machineId = await ctx.db.insert("machines", {
      name: args.name,
      description: args.description,
      category: args.category,
    });
    return machineId;
  },
});

// --- GET all machines ---
export const getAll = query({
  handler: async (ctx) => {
    // This query is public, anyone can see the list of machines.
    return await ctx.db.query("machines").order("desc").collect();
  },
});

// --- NEW QUERY: Get machines for select/dropdown options ---
/**
 * Retrieves a list of all machines for use in a select dropdown.
 * Only returns the ID and name for efficiency.
 * Ordered by name alphabetically.
 */
export const getMachineOptions = query({
  handler: async (ctx) => {
    // This query is for authenticated users populating forms.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        // Or return empty array if you want to allow unauthenticated access to the form page
        throw new Error("You must be logged in to see machine options.");
    }
    
    const machines = await ctx.db.query("machines").withIndex("by_name").order("asc").collect();
    return machines.map((machine) => ({
      _id: machine._id,
      name: machine.name,
    }));
  },
});


// --- Search for machines by name for autocomplete ---
export const searchByName = query({
  args: {
    searchText: v.string(),
  },
  handler: async (ctx, args) => {
    // This query is also public.
    if (!args.searchText) {
      return [];
    }
    return await ctx.db
      .query("machines")
      .withSearchIndex("by_name_search", (q) =>
        q.search("name", args.searchText)
      )
      .take(10);
  },
});


// --- UPDATE a machine ---
export const update = mutation({
  args: {
    id: v.id("machines"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(machineCategory),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx); // <-- Security Check

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

// --- DELETE a machine ---
export const remove = mutation({
  args: { id: v.id("machines") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx); // <-- Security Check
    
    await ctx.db.delete(args.id);
  },
});