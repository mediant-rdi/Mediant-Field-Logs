// convex/complaints.ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';

// --- MODIFIED: This mutation now accepts and stores IDs and an array of image IDs ---
export const submitComplaint = mutation({
  args: {
    // Relational IDs
    clientId: v.id('clients'),
    locationId: v.id('clientLocations'),
    machineId: v.id('machines'),
    // Denormalized names for display
    branchLocation: v.string(),
    modelType: v.string(),
    
    // Other complaint fields
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
    
    // Array of image IDs, up to 4 (enforced on client)
    imageIds: v.array(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to submit a complaint.");
    }
    
    if (args.imageIds.length > 4) {
      throw new Error("Cannot submit more than 4 images.");
    }
    
    const complaintId = await ctx.db.insert('complaints', {
      ...args,
      submittedBy: userId,
      status: 'pending',
    });
    return complaintId;
  },
});

// --- UPDATED: Mutation to update complaint status ---
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

    // Prepare the update payload
    const updatePayload: {
      status: "approved" | "rejected";
      approvedBy: Id<"users">;
      approvedAt: number;
      viewedBySubmitter?: false; // This property is optional
    } = {
      status: status,
      approvedBy: user._id, 
      approvedAt: Date.now(),
    };

    // If the submission is approved, mark it as unread for the submitter
    if (status === 'approved') {
      updatePayload.viewedBySubmitter = false;
    }

    await ctx.db.patch(complaintId, updatePayload);

    console.log(`Complaint ${complaintId} has been ${status}.`);
  },
});

// --- NEW: Mutation to edit a submission's solution ---
export const editSubmissionSolution = mutation({
  args: {
    // Use v.string() to accept IDs from either 'complaints' or 'serviceReports' tables
    submissionId: v.string(),
    submissionType: v.union(v.literal("complaint"), v.literal("serviceReport")),
    newSolution: v.string(),
  },
  handler: async (ctx, { submissionId, submissionType, newSolution }) => {
    // 1. Verify user is an admin
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to perform this action.");
    }
    const user = await ctx.db.get(userId);
    if (!user || !user.isAdmin) {
      throw new Error("You are not authorized to perform this action.");
    }

    // 2. Patch the correct table based on the submission type
    if (submissionType === "complaint") {
      await ctx.db.patch(submissionId as Id<"complaints">, { solution: newSolution });
    } else if (submissionType === "serviceReport") {
      await ctx.db.patch(submissionId as Id<"serviceReports">, { solution: newSolution });
    } else {
      throw new Error("Invalid submission type provided.");
    }
    
    console.log(`Solution for ${submissionType} ${submissionId} has been updated.`);
  },
});