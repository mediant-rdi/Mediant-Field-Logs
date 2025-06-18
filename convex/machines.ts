// convex/machines.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// --- CREATE a new machine ---
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // You can add logic here to check if the user is an admin
    // For example:
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) { throw new Error("Not authenticated"); }
    
    const machineId = await ctx.db.insert("machines", {
      name: args.name,
      description: args.description,
    });
    return machineId;
  },
});

// --- GET all machines ---
export const getAll = query({
  handler: async (ctx) => {
    // It's good practice to order the results
    return await ctx.db.query("machines").order("desc").collect();
  },
});

// --- UPDATE a machine ---
export const update = mutation({
  args: {
    id: v.id("machines"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

// --- DELETE a machine ---
export const remove = mutation({
  args: { id: v.id("machines") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});