// convex/users.ts

import { getAuthUserId } from '@convex-dev/auth/server';
import { internalQuery, internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

export const adminCreateUser = mutation({
  args: { name: v.string(), email: v.string(), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.query('users').withIndex('by_email', (q) => q.eq('email', args.email)).first();
    if (existingUser) throw new Error('User with this email already exists.');
    await ctx.db.insert('users', { name: args.name, email: args.email, isAdmin: args.isAdmin, accountActivated: true });
  },
});
export const updateUser = mutation({
    args: { userId: v.id("users"), name: v.string(), isAdmin: v.boolean() },
    handler: async (ctx, args) => { await ctx.db.patch(args.userId, { name: args.name, isAdmin: args.isAdmin }) },
});
export const deleteUser = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => { await ctx.db.delete(args.userId) },
});
export const current = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => { return await ctx.db.get(args.id) },
});
export const getUsers = query({
  args: { paginationOpts: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db.query('users').order("desc").paginate(args.paginationOpts);
  },
});
export const _getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();
  },
});
export const _getAllUsers = internalQuery({
  handler: async (ctx) => { return await ctx.db.query("users").collect() },
});