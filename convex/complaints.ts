// convex/complaints.ts

import { mutation } from './_generated/server';
import { v } from 'convex/values';

// Mutation to submit a new complaint
export const submitComplaint = mutation({
  args: {
    // --- ALL FIELDS FROM THE SCHEMA ---
    modelType: v.string(),
    branchLocation: v.string(),
    complaintText: v.string(),
    solution: v.string(),
    problemType: v.union(
      v.literal('equipment-fault'),
      v.literal('poor-experience'),
      v.literal('other')
    ),
    fault_oldAge: v.boolean(),
    fault_frequentBreakdowns: v.boolean(),
    fault_undoneRepairs: v.boolean(),
    experience_paperJamming: v.boolean(),
    experience_noise: v.boolean(),
    experience_freezing: v.boolean(),
    experience_dust: v.boolean(),
    experience_buttonsSticking: v.boolean(),
    otherProblemDetails: v.optional(v.string()),
    imageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const complaintId = await ctx.db.insert('complaints', {
      ...args,
      status: 'pending',
    });
    return complaintId;
  },
});

// This mutation allows an admin to approve or reject a specific complaint.
export const updateComplaintStatus = mutation({
  args: {
    complaintId: v.id("complaints"),
    status: v.union(v.literal('approved'), v.literal('rejected')),
  },
  handler: async (ctx, { complaintId, status }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be logged in to perform this action.");
    }
    
    const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", identity.email!)).first();
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