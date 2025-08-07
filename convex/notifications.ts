// convex/notifications.ts
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';
import { asyncMap } from 'convex-helpers';

// Get a list of unread notifications for the current user.
export const getUnreadNotifications = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get unread service reports for submitter
    const serviceReports = await ctx.db
      .query('serviceReports')
      .withIndex('by_submitter_and_viewed', q => 
        q.eq('submittedBy', userId).eq('status', 'approved').eq('viewedBySubmitter', false)
      )
      .collect();
    
    // Get unread complaints for submitter
    const complaints = await ctx.db
      .query('complaints')
      .withIndex('by_submitter_and_viewed', q => 
        q.eq('submittedBy', userId).eq('status', 'approved').eq('viewedBySubmitter', false)
      )
      .collect();
      
    // --- CORRECTED: Get unread call log assignments for engineer ---
    // Use the new composite index to find jobs that are for this user AND have "Pending" status.
    const callLogAssignments = await ctx.db
      .query("callLogs")
      .withIndex("by_engineer_and_status", (q) => 
        q.eq("engineerIds", userId as any).eq("status", "Pending")
      )
      .collect();

    // Then, filter in-memory to find the ones the user hasn't viewed yet.
    const unviewedAssignments = callLogAssignments.filter(log => 
        !log.viewedByEngineers?.includes(userId)
    );

    const reportNotifications = serviceReports.map(n => ({
        _id: n._id,
        _creationTime: n._creationTime,
        title: 'Your Service Report was approved!',
        text: n.complaintText,
        type: 'Service Report'
    }));

    const complaintNotifications = complaints.map(n => ({
        _id: n._id,
        _creationTime: n._creationTime,
        title: 'Your Complaint was approved!',
        text: n.complaintText,
        type: 'Complaint'
    }));
    
    // Use the filtered `unviewedAssignments` array
    const assignmentNotifications = await asyncMap(unviewedAssignments, async (log) => {
        const location = await ctx.db.get(log.locationId);
        return {
            _id: log._id,
            _creationTime: log._creationTime,
            title: 'New Assignment',
            text: `Job at ${location?.fullName ?? "Unknown Location"}: ${log.issue}`,
            type: 'Assignment'
        };
    });

    const allNotifications = [...reportNotifications, ...complaintNotifications, ...assignmentNotifications].sort(
      (a, b) => b._creationTime - a._creationTime
    );

    return allNotifications;
  },
});

// Mark all of the user's notifications as read.
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }

    // This logic for service reports and complaints is correct.
    const unreadServiceReports = await ctx.db
      .query('serviceReports')
      .withIndex('by_submitter_and_viewed', q => q.eq('submittedBy', userId))
      .filter(q => q.eq(q.field('viewedBySubmitter'), false))
      .collect();

    const unreadComplaints = await ctx.db
      .query('complaints')
      .withIndex('by_submitter_and_viewed', q => q.eq('submittedBy', userId))
      .filter(q => q.eq(q.field('viewedBySubmitter'), false))
      .collect();
      
    // --- CORRECTED: Find unread call logs for the engineer ---
    // Use the simpler 'by_engineer' index since we don't care about the status here.
    // We want to mark *any* unread assignment as read, regardless of its status.
    const allLogsAssignedToUser = await ctx.db
      .query("callLogs")
      .withIndex("by_engineer", (q) => q.eq("engineerIds", userId as any))
      .collect();

    // Filter in-memory to find the ones the user hasn't actually viewed.
    const unreadCallLogs = allLogsAssignedToUser.filter(log => 
        !log.viewedByEngineers?.includes(userId)
    );
    
    const updates = [
      ...unreadServiceReports.map(r => ctx.db.patch(r._id, { viewedBySubmitter: true })),
      ...unreadComplaints.map(c => ctx.db.patch(c._id, { viewedBySubmitter: true })),
      // Add the user's ID to the `viewedByEngineers` array for each unread log.
      ...unreadCallLogs.map(log => {
        const currentViewers = log.viewedByEngineers ?? [];
        return ctx.db.patch(log._id, { viewedByEngineers: [...currentViewers, userId] });
      })
    ];

    await Promise.all(updates);
  }
});