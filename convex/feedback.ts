// convex/feedback.ts

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

// --- MODIFIED: The mutation now accepts and stores the text names ---
export const submitFeedback = mutation({
  args: {
    // Store IDs for robust data linking
    clientId: v.id('clients'),
    machineId: v.id('machines'),
    
    // --- ADDED: Also store the text names for easy display ---
    clientName: v.string(),
    machineName: v.string(),
    
    feedbackDetails: v.string(),
    
    // Array of image IDs, up to 4
    imageIds: v.array(v.id('_storage')),
  },
  
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("User must be logged in to submit feedback.");
    }

    if (args.imageIds.length > 4) {
      throw new Error("Cannot submit more than 4 images.");
    }
    
    // Create the new feedback document, associating it with the user via `submittedBy`.
    const feedbackId = await ctx.db.insert('feedback', {
      clientId: args.clientId,
      machineId: args.machineId,
      // --- ADDED: Save the names to the document ---
      clientName: args.clientName,
      machineName: args.machineName,
      feedbackDetails: args.feedbackDetails,
      imageIds: args.imageIds,
      submittedBy: userId,
    });

    return feedbackId;
  },
});