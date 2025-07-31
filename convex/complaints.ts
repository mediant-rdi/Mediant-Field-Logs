// convex/complaints.ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';

// ... submitComplaint and other mutations are unchanged ...
export const submitComplaint = mutation({
  args: {
    // Relational IDs
    clientId: v.id('clients'),
    locationId: v.id('clientLocations'),
    machineId: v.id('machines'),
    // Denormalized names for display
    branchLocation: v.string(),
    modelType: v.string(),
    // --- NEW: Optional serial number field ---
    machineSerialNumber: v.optional(v.string()),
    
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

    // --- MODIFIED: Removed the explicit type annotation. TypeScript will infer it. ---
    const updatePayload = {
      status: status,
      approvedBy: user._id, 
      approvedAt: Date.now(),
      resolutionStatus: undefined as 'waiting' | null | undefined, // Add temp type to help construct object
      viewedBySubmitter: undefined as boolean | undefined,
    };

    // This makes the object structure explicit before conditional logic
    delete updatePayload.resolutionStatus;
    delete updatePayload.viewedBySubmitter;


    // If the submission is approved, mark it as unread and set initial resolution status
    if (status === 'approved') {
      updatePayload.viewedBySubmitter = false;
      updatePayload.resolutionStatus = 'waiting';
    } else {
      // On rejection, explicitly clear any resolution status.
      updatePayload.resolutionStatus = null;
    }

    await ctx.db.patch(complaintId, updatePayload);

    console.log(`Complaint ${complaintId} has been ${status}.`);
  },
});

// ... other mutations ...

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

export const updateResolutionStatus = mutation({
  args: {
    submissionId: v.string(), 
    submissionType: v.union(v.literal("complaint"), v.literal("serviceReport")),
    newStatus: v.union(v.literal('waiting'), v.literal('in_progress'), v.literal('resolved')),
  },
  handler: async (ctx, { submissionId, submissionType, newStatus }) => {
    // 1. Verify user is an admin
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to perform this action.");
    }
    const user = await ctx.db.get(userId);
    if (!user || !user.isAdmin) {
      throw new Error("You are not authorized to perform this action.");
    }

    // 2. Ensure the submission is 'approved'
    let submission;
    if (submissionType === "complaint") {
        submission = await ctx.db.get(submissionId as Id<"complaints">);
    } else {
        submission = await ctx.db.get(submissionId as Id<"serviceReports">);
    }

    if (!submission) throw new Error("Submission not found.");
    if (submission.status !== 'approved') {
        throw new Error("Cannot update resolution status for a non-approved submission.");
    }

    // 3. Patch the correct table
    if (submissionType === "complaint") {
      await ctx.db.patch(submissionId as Id<"complaints">, { resolutionStatus: newStatus });
    } else if (submissionType === "serviceReport") {
      await ctx.db.patch(submissionId as Id<"serviceReports">, { resolutionStatus: newStatus });
    }
    
    console.log(`Resolution status for ${submissionType} ${submissionId} updated to ${newStatus}.`);
  },
});

export const updateOtherActionsProvided = mutation({
  args: {
    submissionId: v.string(),
    submissionType: v.union(v.literal("complaint"), v.literal("serviceReport")),
    otherActions: v.string(),
  },
  handler: async (ctx, { submissionId, submissionType, otherActions }) => {
    // 1. Verify user is an admin
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to perform this action.");
    }
    const user = await ctx.db.get(userId);
    if (!user || !user.isAdmin) {
      throw new Error("You are not authorized to perform this action.");
    }

    // 2. Ensure the submission is 'in_progress'
    let submission;
    if (submissionType === "complaint") {
      submission = await ctx.db.get(submissionId as Id<"complaints">);
    } else if (submissionType === "serviceReport") {
      submission = await ctx.db.get(submissionId as Id<"serviceReports">);
    } else {
        throw new Error("Invalid submission type provided.");
    }

    if (!submission) throw new Error("Submission not found.");
    if (submission.resolutionStatus !== 'in_progress') {
      throw new Error("Cannot add actions for a submission that is not 'in progress'.");
    }

    // 3. Patch the correct table
    if (submissionType === "complaint") {
      await ctx.db.patch(submissionId as Id<"complaints">, { otherActionsProvided: otherActions });
    } else if (submissionType === "serviceReport") {
      await ctx.db.patch(submissionId as Id<"serviceReports">, { otherActionsProvided: otherActions });
    }

    console.log(`Other actions for ${submissionType} ${submissionId} have been updated.`);
  },
});