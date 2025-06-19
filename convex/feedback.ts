import { mutation } from './_generated/server';
import { v } from 'convex/values';

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
    // This is a direct insertion, as no approval is needed.
    const feedbackId = await ctx.db.insert('feedback', {
      ...args,
    });

    return feedbackId;
  },
});