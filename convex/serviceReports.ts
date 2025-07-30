// convex/serviceReports.ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';

// --- (This mutation is unchanged) ---
export const submitServiceReport = mutation({
  args: {
    // Relational IDs
    clientId: v.id('clients'),
    locationId: v.id('clientLocations'),
    machineId: v.id('machines'),
    // Denormalized names for display
    branchLocation: v.string(),
    machineName: v.string(),
    // --- NEW: Optional serial number field ---
    machineSerialNumber: v.optional(v.string()),

    // Other service report fields
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

    // Array of image IDs, up to 4 (enforced on client)
    imageIds: v.array(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("You must be logged in to submit a report.");
    }
    
    if (args.imageIds.length > 4) {
      throw new Error("Cannot submit more than 4 images.");
    }

    const reportId = await ctx.db.insert('serviceReports', {
      ...args,
      submittedBy: userId,
      status: 'pending',
    });
    
    return reportId;
  },
});


// --- MODIFIED: This mutation now handles the secondary resolutionStatus ---
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

    // --- Prepare the update payload, mirroring the logic from complaints ---
    const updatePayload = {
      status: status,
      approvedBy: user._id, 
      approvedAt: Date.now(),
      viewedBySubmitter: undefined as boolean | undefined,
      resolutionStatus: undefined as 'waiting' | null | undefined,
    };

    // Clean up temporary properties for type safety
    delete updatePayload.viewedBySubmitter;
    delete updatePayload.resolutionStatus;

    // If the submission is approved, mark it as unread and set initial resolution status
    if (status === 'approved') {
      updatePayload.viewedBySubmitter = false;
      updatePayload.resolutionStatus = 'waiting';
    } else {
      // On rejection, explicitly clear any resolution status.
      updatePayload.resolutionStatus = null;
    }

    await ctx.db.patch(serviceReportId, updatePayload);

    console.log(`Service Report ${serviceReportId} has been ${status}.`);
  },
});