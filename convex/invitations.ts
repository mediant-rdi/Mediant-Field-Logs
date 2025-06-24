// convex/invitations.ts

import { v } from "convex/values";
import { mutation, query, internalMutation, action } from "./_generated/server";
import { getAuthUserId } from "./auth";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

function generateInviteToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// 1. CREATE INVITATION (NOW USES `invitations` TABLE)
export const createUserInvitation = mutation({
  args: { name: v.string(), email: v.string(), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser?.isAdmin) {
      throw new Error("Admin access required to create invitations");
    }

    // Check if an active user already exists
    const existingUser = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }
    
    // Clean up any old, pending invitations for this email
    const oldInvitation = await ctx.db.query("invitations").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (oldInvitation) {
        await ctx.db.delete(oldInvitation._id);
    }

    const inviteToken = generateInviteToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    
    await ctx.db.insert("invitations", {
      token: inviteToken,
      email: args.email.toLowerCase(),
      name: args.name,
      isAdmin: args.isAdmin,
      expiresAt: expiresAt,
      createdBy: currentUserId
    });

    const inviteUrl = `${process.env.SITE_URL}/invite/${inviteToken}`;
    return { inviteUrl };
  },
});

// 2. VERIFY INVITATION (NOW QUERIES `invitations` TABLE)
export const verifyInvitation = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return { valid: false, error: "Token is required" };

    const invitation = await ctx.db.query("invitations").withIndex("by_token", (q) => q.eq("token", args.token)).first();
    
    if (!invitation) return { valid: false, error: "Invalid invitation token." };
    if (invitation.expiresAt < Date.now()) return { valid: false, error: "This invitation has expired." };
    
    // Return the invitation data, not a user object
    const user = { name: invitation.name, email: invitation.email, isAdmin: invitation.isAdmin };
    return { valid: true, user };
  },
});

// 3. FULFILL INVITATION (NEW INTERNAL MUTATION)
export const _fulfillInvitation = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const invitation = await ctx.db.query("invitations").withIndex("by_email", q => q.eq("email", email)).first();
        if (!invitation) throw new Error("Could not find invitation to fulfill.");

        const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
        if (!user) throw new Error("User not found after creation");
        
        // Patch the user with the details from the invitation
        await ctx.db.patch(user._id, {
            name: invitation.name,
            isAdmin: invitation.isAdmin,
            accountActivated: true,
        });

        // Delete the fulfilled invitation
        await ctx.db.delete(invitation._id);
    }
})

// 4. SET PASSWORD AND COMPLETE (THE MAIN ACTION, REWRITTEN)
export const setPasswordAndCompleteInvitation = action({
  args: { token: v.string(), password: v.string() },
  handler: async (ctx, { token, password }): Promise<{ success: boolean }> => {
    
    // Step 1: Verify the invitation token in the `invitations` table.
    const result = await ctx.runQuery(api.invitations.verifyInvitation, { token });

    if (!result.valid || !result.user) {
      throw new Error(result.error || "Invitation is invalid.");
    }
    const { user: invitation } = result;
    
    // Step 2: Sign up the user. This will now succeed cleanly because no user exists yet.
    try {
      await ctx.runAction(api.auth.signIn, {
        provider: "password",
        params: {
          email: invitation.email,
          password,
          flow: "signUp",
        }
      });
    } catch (error: any) {
      // This can still happen in a race condition, which is a valid failure.
      if (error.message?.includes("Account already exists")) {
        throw new Error("A user with this email has already been registered.");
      }
      throw error;
    }

    // Step 3: Fulfill the invitation by patching the new user and deleting the invitation record.
    await ctx.runMutation(internal.invitations._fulfillInvitation, {
        email: invitation.email
    });
    
    return { success: true };
  },
});