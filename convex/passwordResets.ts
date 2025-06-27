// convex/passwordResets.ts

import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "./auth";
import { Id } from "./_generated/dataModel";

// Helper function to generate a secure random token for the URL.
function generateUrlToken(): string {
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

// 1. ADMIN-ONLY MUTATION: Creates a one-time reset link.
export const admin_generatePasswordResetLink = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    
    const currentUser = await ctx.db.get(adminId);
    if (!currentUser?.isAdmin) {
      throw new Error("Admin access required.");
    }

    const oldTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const token of oldTokens) {
      await ctx.db.delete(token._id);
    }

    const token = generateUrlToken();
    await ctx.db.insert("passwordResetTokens", {
      userId: args.userId,
      token: token,
      expiresAt: Date.now() + 1 * 60 * 60 * 1000, // 1 hour expiry
    });

    return { resetUrl: `${process.env.SITE_URL}/reset-password/${token}` };
  },
});

// 2. PUBLIC QUERY: The reset page uses this to verify the URL token.
export const verifyPasswordResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return { valid: false, error: "Token is required." };

    const tokenDoc = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc || tokenDoc.expiresAt < Date.now()) {
      return { valid: false, error: "This link is invalid or has expired." };
    }

    const user = await ctx.db.get(tokenDoc.userId);
    if (!user) return { valid: false, error: "User account not found." };
    
    return { valid: true, user: { email: user.email }, userId: user._id };
  },
});

// 3. PUBLIC ACTION: This securely updates the password and deletes the token.
export const resetPasswordWithToken = action({
  args: { token: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const verificationResult = await ctx.runQuery(api.passwordResets.verifyPasswordResetToken, { token: args.token });
    
    if (!verificationResult.valid || !verificationResult.userId) {
      throw new Error(verificationResult.error || "Invalid token.");
    }
    
    await ctx.runMutation(internal.passwordResets._updateUserPassword, {
      userId: verificationResult.userId,
      password: args.newPassword,
    });

    await ctx.runMutation(internal.passwordResets._deleteResetToken, { token: args.token });
    return { success: true };
  },
});


// --- INTERNAL HELPERS ---

// THIS IS THE CORRECTED FUNCTION
export const _updateUserPassword = internalMutation({
  args: { userId: v.id("users"), password: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!account) {
      throw new Error("Could not find auth account for this user.");
    }
    if (account.provider !== "password") {
      throw new Error("This account does not use password-based authentication.");
    }

    //
    await ctx.runMutation(internal.auth.store, {
      args: {
        type: "modifyAccount",
        provider: account.provider,
        account: {
          id: account.providerAccountId,
          secret: args.password,
        },
      },
    });
  },
});

export const _deleteResetToken = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (tokenDoc) await ctx.db.delete(tokenDoc._id);
  },
});