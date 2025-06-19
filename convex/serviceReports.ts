import { mutation } from './_generated/server';
import { v } from 'convex/values';
// --- NEW --- Import the correct helper function
import { getAuthUserId } from '@convex-dev/auth/server';

// Mutation to submit a new service report
export const submitServiceReport = mutation({
  args: {
    // These arguments are correct and unchanged.
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
    // --- CORRECTED --- Use getAuthUserId to get the user's document ID from your `users` table.
    const userId = await getAuthUserId(ctx);

    // This is a critical security check.
    if (!userId) {
      throw new Error("You must be logged in to submit a report.");
    }

    const reportId = await ctx.db.insert('serviceReports', {
      ...args,
      // --- CORRECTED --- Assign the userId, which is of type `Id<"users">`. The type error is now gone.
      submittedBy: userId,
      status: 'pending',
    });
    
    return reportId;
  },
});

// The update status mutation is correct because it already uses a similar pattern to find the user.
export const updateServiceReportStatus = mutation({
  args: {
    serviceReportId: v.id("serviceReports"),
    status: v.union(v.literal('approved'), v.literal('rejected')),
  },
  handler: async (ctx, { serviceReportId, status }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be logged in to perform this action.");
    }
    
    // This part correctly looks up the user to get their `_id`.
    const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", identity.email!)).first();
    if (!user || !user.isAdmin) {
      throw new Error("You are not authorized to perform this action.");
    }

    await ctx.db.patch(serviceReportId, {
      status: status,
      approvedBy: user._id, // This correctly uses the user's `_id`
      approvedAt: Date.now(),
    });

    console.log(`Service Report ${serviceReportId} has been ${status}.`);
  },
});