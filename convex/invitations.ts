// convex/invitations.ts

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// --- PRIVATE HELPER FUNCTION ---
function generateInviteToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// --- PUBLIC MUTATIONS AND QUERIES ---

// 1. CREATE INVITATION
export const createUserInvitation = mutation({
  args: { name: v.string(), email: v.string(), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser?.isAdmin) {
      throw new Error("Admin access required to create invitations");
    }
    const existingUser = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    const inviteToken = generateInviteToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      isAdmin: args.isAdmin,
      invitationToken: inviteToken,
      invitationExpiresAt: expiresAt,
      invitationSent: true,
      accountActivated: false,
    });
    // FIXED: Changed "/invitelink/" to "/invite/" to match the frontend route
    const inviteUrl = `${process.env.SITE_URL}/invite/${inviteToken}`;

    console.log(inviteUrl); // Log the invitation URL for debugging
    return { userId, inviteToken, inviteUrl };
  },
});

export const createFirstUserInvitation = internalMutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    const inviteToken = generateInviteToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      isAdmin: true,
      invitationToken: inviteToken,
      invitationExpiresAt: expiresAt,
      invitationSent: true,
      accountActivated: false,
    });
    const inviteUrl = `${process.env.SITE_URL}/invite/${inviteToken}`;

    console.log(inviteUrl); // Log the invitation URL for debugging
    return { userId, inviteToken, inviteUrl };
  },
});

// 2. VERIFY INVITATION (Unchanged)
export const verifyInvitation = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) {
        return { valid: false, error: "Token is required" };
    }
    const user = await ctx.db.query("users").filter((q) => q.eq(q.field("invitationToken"), args.token)).first();
    if (!user) {
      return { valid: false, error: "Invalid invitation token." };
    }
    if (user.accountActivated) {
      return { valid: false, error: "This invitation has already been used." };
    }
    if (user.invitationExpiresAt && user.invitationExpiresAt < Date.now()) {
      return { valid: false, error: "This invitation has expired." };
    }
    return {
      valid: true,
      user: { name: user.name, email: user.email, isAdmin: user.isAdmin },
    };
  },
});

// 3. COMPLETE INVITATION (UPDATED LOGIC TO PREVENT DUPLICATES)
export const completeInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<Id<"users">> => {
    // 1. Get the newly authenticated user created by the auth provider.
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("You must be logged in to complete an invitation.");
    }
    const authUser = await ctx.db.get(authUserId);
    if (!authUser) {
      throw new Error("Authenticated user not found in the database.");
    }

    // 2. Find the original placeholder user record using the invitation token.
    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_invitation_token", (q) => q.eq("invitationToken", args.token))
      .first();

    // 3. Validate the invitation record.
    if (!invitedUser) {
      throw new Error("Invalid invitation token.");
    }
    if (invitedUser.accountActivated) {
      throw new Error("This invitation has already been used.");
    }
    if (invitedUser.invitationExpiresAt && invitedUser.invitationExpiresAt < Date.now()) {
      throw new Error("This invitation has expired.");
    }

    // 4. Security Check: Ensure the email of the person who signed up matches the invitation.
    if (invitedUser.email !== authUser.email) {
      await ctx.db.delete(authUser._id); 
      throw new Error(
        "Authentication failed. The email you signed in with does not match the email on the invitation."
      );
    }
    
    // 5. Merge data: Copy details from the invitation to the authenticated user record.
    await ctx.db.patch(authUser._id, {
      name: invitedUser.name,       // Use the name from the invitation
      isAdmin: invitedUser.isAdmin, // Apply the admin role from the invitation
      accountActivated: true,       // Mark the account as fully activated
    });

    // 6. Clean up by deleting the original, now-redundant, placeholder record.
    await ctx.db.delete(invitedUser._id);

    // 7. Return the ID of the final, merged user account.
    return authUser._id;
  },
});


// 4. GET PENDING INVITATIONS (Unchanged)
export const getPendingInvitations = query({
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser?.isAdmin) {
      throw new Error("Admin access required");
    }
    return await ctx.db.query("users").filter((q) => q.and(q.eq(q.field("invitationSent"), true), q.eq(q.field("accountActivated"), false))).collect();
  },
});