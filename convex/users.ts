// convex/users.ts

import { getAuthUserId } from '@convex-dev/auth/server';
import { internalQuery, internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { asyncMap } from 'convex-helpers'; // Make sure convex-helpers is installed

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

/**
 * Get the current user's assigned service locations.
 * This query is independent of any service period.
 */
export const getMyAssignedLocations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || !user.serviceLocationIds) {
      return []; // Return empty array if user or locations are not found
    }

    const locations = await asyncMap(user.serviceLocationIds, (id) =>
      ctx.db.get(id)
    );

    return locations.filter(Boolean).map(loc => ({
        _id: loc!._id,
        fullName: loc!.fullName,
    }));
  },
});

export const adminCreateUser = mutation({
  // MODIFICATION: Add canAccessCallLogs and canAccessManagementDashboard
  args: { 
    name: v.string(), 
    email: v.string(), 
    isAdmin: v.boolean(),
    canAccessCallLogs: v.optional(v.boolean()),
    canAccessManagementDashboard: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.query('users').withIndex('by_email', (q) => q.eq('email', args.email)).first();
    if (existingUser) throw new Error('User with this email already exists.');
    
    await ctx.db.insert('users', { 
        name: args.name, 
        email: args.email, 
        isAdmin: args.isAdmin,
        canAccessCallLogs: args.canAccessCallLogs ?? false, 
        canAccessManagementDashboard: args.canAccessManagementDashboard ?? false,
        accountActivated: true,
        searchName: normalizeNameForSearch(args.name),
    });
  },
});

// --- NEW/REFACTORED FUNCTIONS FOR THE NEW UI ---

/**
 * [REFACTORED] Updates a user's basic details (name, admin status).
 * This is used by the simplified EditUserForm.
 */
export const updateUserDetails = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    isAdmin: v.boolean(),
    canAccessCallLogs: v.boolean(),
    // MODIFICATION: Add canAccessManagementDashboard
    canAccessManagementDashboard: v.boolean(),
  },
  handler: async (ctx, { userId, name, isAdmin, canAccessCallLogs, canAccessManagementDashboard }) => {
    // TODO: Add admin-level protection check if needed
    await ctx.db.patch(userId, { 
        name, 
        isAdmin,
        canAccessCallLogs,
        canAccessManagementDashboard,
        searchName: normalizeNameForSearch(name),
    });
  },
});

/**
 * [NEW] Gets a user's assigned service locations. For the assignments page.
 */
export const getAssignedLocationsForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.serviceLocationIds || user.serviceLocationIds.length === 0) {
            return [];
        }
        const locations = await Promise.all(
            user.serviceLocationIds.map(id => ctx.db.get(id))
        );
        return locations.filter(Boolean).map(loc => ({
            _id: loc!._id,
            fullName: loc!.fullName
        }));
    }
});

/**
 * [NEW] Adds a service location to a user.
 * Contains the critical logic to prevent assigning a location to multiple users.
 */
export const addServiceLocationToUser = mutation({
    args: {
        userId: v.id("users"),
        locationId: v.id("clientLocations"),
    },
    handler: async (ctx, { userId, locationId }) => {
        const allUsers = await ctx.db.query('users').collect();
        const conflictingUser = allUsers.find(user =>
            user._id !== userId &&
            user.serviceLocationIds?.includes(locationId)
        );

        if (conflictingUser) {
            const location = await ctx.db.get(locationId);
            throw new Error(`Location "${location?.fullName ?? locationId}" is already assigned to ${conflictingUser.name}.`);
        }

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const existingIds = user.serviceLocationIds || [];
        if (existingIds.includes(locationId)) return; // Already assigned, do nothing.

        await ctx.db.patch(userId, {
            serviceLocationIds: [...existingIds, locationId]
        });
    }
});

/**
 * [NEW] Removes a service location from a user.
 */
export const removeServiceLocationFromUser = mutation({
    args: {
        userId: v.id("users"),
        locationId: v.id("clientLocations"),
    },
    handler: async (ctx, { userId, locationId }) => {
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const existingIds = user.serviceLocationIds || [];
        await ctx.db.patch(userId, {
            serviceLocationIds: existingIds.filter(id => id !== locationId)
        });
    }
});


// --- EXISTING & UNCHANGED FUNCTIONS ---

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
            canAccessCallLogs: undefined,
            // MODIFICATION: Clear the new permission on delete
            canAccessManagementDashboard: undefined,
            accountActivated: false,
            searchName: undefined,
            serviceLocationIds: [],
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

// Renamed from 'get' to be more descriptive and avoid conflict with new functions.
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => { return await ctx.db.get(args.userId) },
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