// convex/users.ts

import { getAuthUserId } from '@convex-dev/auth/server';
import { internalQuery, internalMutation, mutation, query, DatabaseReader } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { asyncMap } from 'convex-helpers'; // Make sure convex-helpers is installed

// Helper function to normalize names for searching
const normalizeNameForSearch = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
};

// Helper function to find a user's team leader. The leader defines the team.
const findTeamLeader = async (db: DatabaseReader, userId: Id<"users">, allUsers: Doc<"users">[]): Promise<Doc<"users"> | null> => {
    const currentUser = allUsers.find(u => u._id === userId);
    if (!currentUser) return null;

    // A user's leader is either the person who tagged them, or themselves if they are not tagged.
    const leader = allUsers.find(u => u.taggedTeamMemberIds?.includes(userId)) ?? currentUser;
    return leader;
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
 * Get the current user's assigned service locations,
 * INCLUDING locations from team leaders who have tagged this user.
 * This query is independent of any service period.
 */
export const getMyAssignedLocations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // 1. Get the current user's directly assigned locations
    const user = await ctx.db.get(userId);
    const directLocationIds = user?.serviceLocationIds ?? [];

    // 2. Find all other users who have tagged the current user
    const allUsers = await ctx.db.query("users").collect();
    const teamLeaders = allUsers.filter(
        leader => leader.taggedTeamMemberIds?.includes(userId)
    );

    // 3. Get the location IDs from those team leaders
    const taggedLocationIds = teamLeaders.flatMap(leader => leader.serviceLocationIds ?? []);

    // 4. Combine and deduplicate all location IDs
    const allLocationIds = [...new Set([...directLocationIds, ...taggedLocationIds])];
    
    if (allLocationIds.length === 0) {
        return [];
    }

    // 5. Fetch the actual location documents
    const locations = await asyncMap(allLocationIds, (id) =>
      ctx.db.get(id)
    );

    // 6. Return the formatted data
    return locations.filter(Boolean).map(loc => ({
        _id: loc!._id,
        fullName: loc!.fullName,
    }));
  },
});

export const adminCreateUser = mutation({
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
    canAccessManagementDashboard: v.boolean(),
  },
  handler: async (ctx, { userId, name, isAdmin, canAccessCallLogs, canAccessManagementDashboard }) => {
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
 * [MODIFIED] Adds a service location to a user.
 * Prevents assigning a location to multiple users unless they are on the same team.
 */
export const addServiceLocationToUser = mutation({
    args: {
        userId: v.id("users"),
        locationId: v.id("clientLocations"),
    },
    handler: async (ctx, { userId, locationId }) => {
        const allUsers = await ctx.db.query('users').collect();
        const existingOwner = allUsers.find(user =>
            user.serviceLocationIds?.includes(locationId)
        );

        const userToAssign = await ctx.db.get(userId);
        if (!userToAssign) throw new Error("User not found");
        
        const alreadyHasLocation = userToAssign.serviceLocationIds?.includes(locationId);
        if (alreadyHasLocation) return; // Already assigned to this user, do nothing.

        // If the location is unassigned, it's safe to add.
        if (!existingOwner) {
            await ctx.db.patch(userId, {
                serviceLocationIds: [...(userToAssign.serviceLocationIds || []), locationId]
            });
            return;
        }

        // If it IS assigned, check if the existing owner and the target user are on the same team.
        const targetUserLeader = await findTeamLeader(ctx.db, userId, allUsers);
        const existingOwnerLeader = await findTeamLeader(ctx.db, existingOwner._id, allUsers);

        if (!targetUserLeader || !existingOwnerLeader) {
            throw new Error("Could not determine team information for one or both users.");
        }

        // If their leaders are the same, they are on the same team. Assignment is allowed.
        if (targetUserLeader._id === existingOwnerLeader._id) {
            await ctx.db.patch(userId, {
                serviceLocationIds: [...(userToAssign.serviceLocationIds || []), locationId]
            });
        } else {
            // Leaders are different, they are on different teams. Throw a conflict error.
            const location = await ctx.db.get(locationId);
            throw new Error(`Location "${location?.fullName ?? locationId}" is already assigned to a different team (member: ${existingOwner.name}).`);
        }
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

// --- NEW TEAM TAGGING FUNCTIONS ---

/**
 * [NEW] Searches for active users (engineers) to be tagged,
 * excluding the primary user and those already tagged.
 */
export const searchTaggableEngineers = query({
    args: {
        searchText: v.string(),
        primaryUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        if (args.searchText.length < 1) {
            return [];
        }
        
        const primaryUser = await ctx.db.get(args.primaryUserId);
        const alreadyTaggedIds = primaryUser?.taggedTeamMemberIds ?? [];

        const normalizedQuery = normalizeNameForSearch(args.searchText);

        const potentialMatches = await ctx.db
            .query('users')
            .withIndex('by_search_name', q =>
                q.gte('searchName', normalizedQuery)
                 .lt('searchName', normalizedQuery + '\uffff')
            )
            .filter(q => q.eq(q.field('accountActivated'), true))
            .take(20); // Take a few more to filter from

        // Filter out the primary user and already tagged members
        return potentialMatches.filter(user =>
            user._id !== args.primaryUserId && !alreadyTaggedIds.includes(user._id)
        ).slice(0, 10); // Return final 10
    },
});

/**
 * [NEW] Gets a user's tagged team members. For the assignments page.
 */
export const getTaggedTeamMembersForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.taggedTeamMemberIds || user.taggedTeamMemberIds.length === 0) {
            return [];
        }
        const teamMembers = await Promise.all(
            user.taggedTeamMemberIds.map(id => ctx.db.get(id))
        );
        return teamMembers.filter(Boolean).map(member => ({
            _id: member!._id,
            name: member!.name ?? "Unnamed User"
        }));
    }
});

/**
 * [NEW] Adds a team member tag to a user.
 */
export const addTeamMemberToUser = mutation({
    args: {
        userId: v.id("users"),      // The user being edited (e.g., userA)
        teamMemberId: v.id("users"), // The user to tag (e.g., userB)
    },
    handler: async (ctx, { userId, teamMemberId }) => {
        if (userId === teamMemberId) {
            throw new Error("Cannot tag a user to themselves.");
        }
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const existingIds = user.taggedTeamMemberIds || [];
        if (existingIds.includes(teamMemberId)) return; // Already tagged, do nothing.

        await ctx.db.patch(userId, {
            taggedTeamMemberIds: [...existingIds, teamMemberId]
        });
    }
});

/**
 * [NEW] Removes a team member tag from a user.
 */
export const removeTeamMemberFromUser = mutation({
    args: {
        userId: v.id("users"),
        teamMemberId: v.id("users"),
    },
    handler: async (ctx, { userId, teamMemberId }) => {
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const existingIds = user.taggedTeamMemberIds || [];
        await ctx.db.patch(userId, {
            taggedTeamMemberIds: existingIds.filter(id => id !== teamMemberId)
        });
    }
});

// --- NEW TEAM INFO QUERIES ---

/**
 * [NEW] Gets the current user's team information (leader and members).
 * A team is defined by a "leader" user who tags other members.
 */
export const getMyTeamInfo = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const allUsers = await ctx.db.query("users").collect();
        const currentUser = allUsers.find(u => u._id === userId);
        if (!currentUser) return null;

        // Find the user who defines the team (the "leader").
        // This is either someone who tagged the current user, or the current user themselves.
        const leader = allUsers.find(u => u.taggedTeamMemberIds?.includes(userId)) ?? currentUser;

        const teamMemberIds = new Set([leader._id, ...(leader.taggedTeamMemberIds ?? [])]);
        
        const members = await asyncMap(
            Array.from(teamMemberIds),
            async (id) => {
                const user = await ctx.db.get(id);
                return user ? { _id: user._id, name: user.name ?? "Unnamed" } : null;
            }
        );

        return {
            leader: { _id: leader._id, name: leader.name ?? "Unnamed Leader" },
            members: members.filter(Boolean) as { _id: Id<"users">, name: string }[],
        };
    }
});


/**
 * [NEW] Gets a specific user's team information for display on admin pages.
 */
export const getTeamInfoForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const allUsers = await ctx.db.query("users").collect();
        const userToView = allUsers.find(u => u._id === args.userId);
        if (!userToView) return null;
        
        const leader = allUsers.find(u => u.taggedTeamMemberIds?.includes(args.userId));

        if (leader) {
            // The user is a member of another's team
            const memberIds = leader.taggedTeamMemberIds ?? [];
            const otherMembers = await asyncMap(
                memberIds.filter(id => id !== args.userId), 
                async (id) => {
                    const user = await ctx.db.get(id);
                    return user ? { _id: user._id, name: user.name ?? "Unnamed" } : null;
                }
            );

            return {
                isMember: true,
                leader: { _id: leader._id, name: leader.name ?? "Unnamed Leader" },
                teamMates: otherMembers.filter(Boolean) as { _id: Id<"users">, name: string }[],
            };
        } else {
            // The user is a leader of their own team
            const memberIds = userToView.taggedTeamMemberIds ?? [];
             const taggedMembers = await asyncMap(memberIds, async (id) => {
                const user = await ctx.db.get(id);
                return user ? { _id: user._id, name: user.name ?? "Unnamed" } : null;
            });
            return {
                isMember: false,
                leader: null,
                teamMates: taggedMembers.filter(Boolean) as { _id: Id<"users">, name: string }[],
            };
        }
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
            canAccessManagementDashboard: undefined,
            accountActivated: false,
            searchName: undefined,
            serviceLocationIds: [],
            taggedTeamMemberIds: [], // Clear on delete
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