// convex/users.ts

import { getAuthUserId } from '@convex-dev/auth/server'; // CORRECTED IMPORT
import { internalQuery, internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

// Helper function to normalize names for searching
const normalizeNameForSearch = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
};

/**
 * Searches for active users (engineers) by name using a prefix search.
 */
export const searchEngineers = query({
    args: { searchText: v.string() },
    handler: async (ctx, args) => {
        if (args.searchText.length < 1) {
            return [];
        }
        const normalizedQuery = normalizeNameForSearch(args.searchText);

        return await ctx.db
            .query('users')
            .withIndex('by_search_name', q => 
                q.gte('searchName', normalizedQuery)
                 .lt('searchName', normalizedQuery + '\uffff')
            )
            .filter(q => q.eq(q.field('accountActivated'), true))
            .take(10); // Limit results for performance
    },
});

/**
 * Lists all non-anonymous, activated users. Useful for cases where a full list is needed.
 */
export const listAll = query({
    handler: async (ctx) => {
        return await ctx.db
            .query('users')
            .filter(q => q.eq(q.field('isAnonymous'), undefined))
            .filter(q => q.eq(q.field('accountActivated'), true))
            .order('asc')
            .collect();
    },
});

export const adminCreateUser = mutation({
  args: { name: v.string(), email: v.string(), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.query('users').withIndex('by_email', (q) => q.eq('email', args.email)).first();
    if (existingUser) throw new Error('User with this email already exists.');
    
    await ctx.db.insert('users', { 
        name: args.name, 
        email: args.email, 
        isAdmin: args.isAdmin, 
        accountActivated: true,
        searchName: normalizeNameForSearch(args.name),
    });
  },
});

export const updateUser = mutation({
    args: { userId: v.id("users"), name: v.string(), isAdmin: v.boolean() },
    handler: async (ctx, args) => { 
        await ctx.db.patch(args.userId, { 
            name: args.name, 
            isAdmin: args.isAdmin,
            searchName: normalizeNameForSearch(args.name),
        });
    },
});

export const deleteUser = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const authAccounts = await ctx.db
            .query('authAccounts')
            .withIndex('by_userId', q => q.eq('userId', args.userId))
            .collect();

        const deletePromises = authAccounts.map(account => ctx.db.delete(account._id));
        await Promise.all(deletePromises);

        await ctx.db.patch(args.userId, {
            image: undefined,
            phone: undefined,
            phoneVerificationTime: undefined,
            emailVerificationTime: undefined,
            isAnonymous: undefined,
            isAdmin: false,
            accountActivated: false,
            searchName: undefined, // Clear the search name
        });
    },
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