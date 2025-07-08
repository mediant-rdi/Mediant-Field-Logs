import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';

// This mutation is correct and needs no changes.
export const submitServiceReport = mutation({
  args: {
    modelTypes: v.string(),
    branchLocation: v.string(),
    complaintText: v.string(),
    solution: v.string(),
    problemType: v.union(
      v.literal('electrical'),
      v.literal('mechanical'),
      v.literal('software'),
      v.literal('service-delay'),
      v.literal('other')
    ),
    backofficeAccess: v.boolean(),
    spareDelay: v.boolean(),
    delayedReporting: v.boolean(),
    communicationBarrier: v.boolean(),
    otherText: v.optional(v.string()),
    imageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("You must be logged in to submit a report.");
    }

    const reportId = await ctx.db.insert('serviceReports', {
      ...args,
      submittedBy: userId,
      status: 'pending',
    });
    
    return reportId;
  },
});


// --- THIS FUNCTION IS NOW UPDATED FOR NOTIFICATIONS ---
export const updateServiceReportStatus = mutation({
  args: {
    serviceReportId: v.id("serviceReports"),
    status: v.union(v.literal('approved'), v.literal('rejected')),
  },
  handler: async (ctx, { serviceReportId, status }) => {
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

    await ctx.db.patch(serviceReportId, updatePayload);

    console.log(`Service Report ${serviceReportId} has been ${status}.`);
  },
});