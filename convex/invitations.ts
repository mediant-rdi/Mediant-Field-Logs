// convex/invitations.ts

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    const inviteUrl = `${process.env.SITE_URL}/invitelink/${inviteToken}`;

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
    const inviteUrl = `${process.env.SITE_URL}/invitelink/${inviteToken}`;

    console.log(inviteUrl); // Log the invitation URL for debugging
    return { userId, inviteToken, inviteUrl };
  },
});

// 2. VERIFY INVITATION
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

// 3. COMPLETE INVITATION
export const completeInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").filter((q) => q.eq(q.field("invitationToken"), args.token)).first();
    if (!user) { throw new Error("Invalid token"); }
    if (user.accountActivated) { throw new Error("Invitation already used"); }
    if (user.invitationExpiresAt && user.invitationExpiresAt < Date.now()) { throw new Error("Invitation expired"); }
    await ctx.db.patch(user._id, {
      accountActivated: true,
      invitationToken: undefined,
      invitationExpiresAt: undefined,
    });
    return user._id;
  },
});


// 4. GET PENDING INVITATIONS
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