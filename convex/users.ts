// convex/users.ts

import { getAuthUserId } from '@convex-dev/auth/server';
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

// --- NEW QUERY ADDED ---
// This is the query your sidebar component is looking for.
// It uses the auth context to get the currently logged-in user.
export const current = query({
  handler: async (ctx) => {
    // Get the user ID from the authentication context.
    const userId = await getAuthUserId(ctx);

    // If userId is null, it means the user is not logged in.
    if (userId === null) {
      return null;
    }

    // Fetch the full user document from the 'users' table using the ID.
    const user = await ctx.db.get(userId);

    return user;
  },
});
// --- END OF NEW QUERY ---


// --- YOUR EXISTING FUNCTIONS ---

// Query to get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
    
    return user;
  },
});

// Query to get user by ID (for authentication middleware)
export const getUserById = query({
  args: { userid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.userid))
      .first();
    
    if (user) {
      // Don't return password in queriesa
      // Note: your schema does not have a 'password' field, so this line might error
      // if the user object doesn't have it. It's safer to remove it if unused.
      // const { password, ...userWithoutPassword } = user; 
      return user;
    }
    
    return null;
  },
});

// Paginated query to get all users (example of proper cursor handling)
export const getUsers = query({
  args: { 
    cursor: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Only apply cursor if it's provided
    let result;
    if (args.cursor) {
      result = await ctx.db.query('users').paginate({
        cursor: args.cursor,
        numItems: args.limit || 10
      });
    } else {
      result = await ctx.db.query('users').paginate({
        cursor: null,
        numItems: args.limit || 10
      });
    }
    
    // Remove passwords from all users
    // Note: your schema does not have a 'password' field, so this is safe but might be unnecessary.
    const usersWithoutPasswords = result.page.map(user => {
      // const { password, ...userWithoutPassword } = user;
      return user;
    });
    
    return {
      users: usersWithoutPasswords,
      isDone: result.isDone,
      continueCursor: result.continueCursor
    };
  },
});

// Alternative approach: Handle cursor more explicitly
export const getUsersPaginated = query({
  args: { 
    cursor: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const paginationArgs: { numItems: number; cursor: string | null } = {
      numItems: args.limit || 10,
      cursor: args.cursor !== undefined ? args.cursor : null
    };
    
    const result = await ctx.db
      .query('users')
      .paginate(paginationArgs);
    
    // Remove passwords from all users
    const usersWithoutPasswords = result.page.map(user => {
      // const { password, ...userWithoutPassword } = user;
      return user;
    });
    
    return {
      users: usersWithoutPasswords,
      isDone: result.isDone,
      continueCursor: result.continueCursor
    };
  },
});

// Mutation to update last login timestamp
export const updateLastLogin = mutation({
  args: { userid: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)

    if (!userId) return; // Not logged in

    const user = await ctx.db.get(userId as Id<"users">);
    if (user) {
      // Note: your schema does not have a 'lastLogin' field.
      // You would need to add `lastLogin: v.optional(v.number())` to schema.ts to use this.
      // await ctx.db.patch(user._id, {
      //   lastLogin: Date.now(),
      // });
    }
  },
});

// Mutation to create a new user (for registration)
// Note: This is likely not needed when using @convex-dev/auth, as it handles user creation.
export const createUser = mutation({
  args: {
    userid: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.string(), // Should be hashed before calling this
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const userId = await ctx.db.insert('users', {
      name: args.username, // mapping to your schema's 'name' field
      email: args.email,
      // Note: Your schema does not have userid, password, role, createdAt, or lastLogin fields.
    });

    return userId;
  },
});

// Mutation to change password
// Note: This is also likely not needed with @convex-dev/auth.
export const changePassword = mutation({
  args: {
    userid: v.string(),
    newPassword: v.string(), // Should be hashed before calling this
  },
  handler: async (ctx, args) => {
    // Your schema does not have a 'by_userid' index.
    // const user = await ctx.db
    //   .query('users')
    //   .withIndex('by_userid', (q) => q.eq('userid', args.userid))
    //   .first();
    
    // if (!user) {
    //   throw new Error('User not found');
    // }

    // await ctx.db.patch(user._id, {
    //   password: args.newPassword,
    //   passwordChangedAt: Date.now(),
    // });
  },
});