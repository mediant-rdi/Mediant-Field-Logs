// convex/complaints.ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

// This is the submission logic from the previous step.
export const submitComplaint = mutation({
  // ... (args from previous step, no changes needed here)
  args: {
    modelType: v.string(),
    branchLocation: v.string(),
    problemType: v.union(v.literal('equipment-fault'), v.literal('poor-experience'), v.literal('other')),
    fault_oldAge: v.boolean(),
    fault_frequentBreakdowns: v.boolean(),
    fault_undoneRepairs: v.boolean(),
    experience_paperJamming: v.boolean(),
    experience_noise: v.boolean(),
    experience_freezing: v.boolean(),
    experience_dust: v.boolean(),
    experience_buttonsSticking: v.boolean(),
    otherProblemDetails: v.string(),
    complaintText: v.string(),
    solution: v.string(),
    imageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to submit a complaint.");
    }
    const complaintId = await ctx.db.insert('complaints', {
      ...args,
      submittedBy: userId,
      status: 'pending',
    });
    return complaintId;
  },
});

// --- NEW: Mutation to update complaint status ---
export const updateComplaintStatus = mutation({
  args: {
    complaintId: v.id("complaints"),
    status: v.union(v.literal('approved'), v.literal('rejected')),
  },
  handler: async (ctx, { complaintId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to perform this action.");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || !user.isAdmin) {
      throw new Error("You are not authorized to perform this action.");
    }

    await ctx.db.patch(complaintId, {
      status: status,
      approvedBy: user._id, 
      approvedAt: Date.now(),
    });

    console.log(`Complaint ${complaintId} has been ${status}.`);
  },
});