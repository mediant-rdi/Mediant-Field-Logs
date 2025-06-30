// convex/feedback.ts

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';

// Mutation to submit new customer feedback
export const submitFeedback = mutation({
  args: {
    branchLocation: v.string(),
    modelType: v.string(),
    feedbackDetails: v.string(),
    
    // Optional image ID
    imageId: v.optional(v.id('_storage')),
  },
  
  handler: async (ctx, args) => {
    // This now works because the schema has been updated.
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("User must be logged in to submit feedback.");
    }
    
    // Create the new feedback document, associating it with the user via `submittedBy`.
    const feedbackId = await ctx.db.insert('feedback', {
      ...args,
      submittedBy: userId,
    });

    return feedbackId;
  },
});