// convex/serviceReports.ts

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

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


// --- THIS FUNCTION IS NOW UPDATED FOR CONSISTENCY ---
export const updateServiceReportStatus = mutation({
  args: {
    serviceReportId: v.id("serviceReports"),
    status: v.union(v.literal('approved'), v.literal('rejected')),
  },
  handler: async (ctx, { serviceReportId, status }) => {
    // 1. Use the standard helper to get the user's ID from your `users` table.
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("You must be logged in to perform this action.");
    }
    
    // 2. Fetch the user document directly by its ID. This is more efficient than querying by email.
    const user = await ctx.db.get(userId);
    
    // 3. Perform the authorization check.
    if (!user || !user.isAdmin) {
      throw new Error("You are not authorized to perform this action.");
    }

    // 4. Patch the document. `user._id` is the same as `userId`.
    await ctx.db.patch(serviceReportId, {
      status: status,
      approvedBy: user._id, 
      approvedAt: Date.now(),
    });

    console.log(`Service Report ${serviceReportId} has been ${status}.`);
  },
});