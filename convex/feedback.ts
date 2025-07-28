// convex/feedback.ts

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { MutationCtx } from './_generated/server';

export const feedbackStatus = v.union(
  v.literal("pending"),
  v.literal("can_be_implemented"),
  v.literal("cannot_be_implemented"),
  v.literal("waiting"),
  v.literal("in_progress"),
  v.literal("resolved")
);

export const submitFeedback = mutation({
  args: {
    clientId: v.optional(v.id('clients')),
    clientName: v.optional(v.string()),
    machineId: v.id('machines'),
    machineName: v.string(),
    feedbackDetails: v.string(),
    imageIds: v.array(v.id('_storage')),
    feedbackSource: v.union(v.literal('customer'), v.literal('engineer')),
  },
  
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("User must be logged in to submit feedback.");
    }

    if (args.imageIds.length > 4) {
      throw new Error("Cannot submit more than 4 images.");
    }
    
    const feedbackId = await ctx.db.insert('feedback', {
      clientId: args.clientId,
      machineId: args.machineId,
      clientName: args.clientName,
      machineName: args.machineName,
      feedbackDetails: args.feedbackDetails,
      imageIds: args.imageIds,
      submittedBy: userId,
      status: 'pending', 
      feedbackSource: args.feedbackSource,
    });

    return feedbackId;
  },
});

// --- MODIFIED: Mutation now accepts actionTaken text ---
export const updateFeedbackStatus = mutation({
  args: {
    feedbackId: v.id('feedback'),
    status: feedbackStatus,
    actionTaken: v.optional(v.string()), // New optional argument
  },
  handler: async (ctx: MutationCtx, { feedbackId, status, actionTaken }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in.");
    }

    const user = await ctx.db.get(userId);

    if (!user || !user.isAdmin) {
      throw new Error("You must be an admin to perform this action.");
    }
    
    // --- ADDED: Server-side validation ---
    if (status === 'resolved' && (!actionTaken || actionTaken.trim() === '')) {
      throw new Error("Action Taken details must be provided to resolve feedback.");
    }

    // --- MODIFIED: Patch the new field along with the status ---
    await ctx.db.patch(feedbackId, { status, actionTaken });

    return { success: true };
  }
});