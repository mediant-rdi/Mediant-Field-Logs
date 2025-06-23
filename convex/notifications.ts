// convex/notifications.ts
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Get a list of unread approved submissions for the current user.
export const getUnreadNotifications = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get unread service reports
    const serviceReports = await ctx.db
      .query('serviceReports')
      .withIndex('by_submitter_and_viewed', q => 
        q.eq('submittedBy', userId).eq('status', 'approved').eq('viewedBySubmitter', false)
      )
      .order('desc')
      .collect();
    
    // Get unread complaints
    const complaints = await ctx.db
      .query('complaints')
      .withIndex('by_submitter_and_viewed', q => 
        q.eq('submittedBy', userId).eq('status', 'approved').eq('viewedBySubmitter', false)
      )
      .order('desc')
      .collect();

    // Combine and sort by creation time
    const allNotifications = [...serviceReports, ...complaints].sort(
      (a, b) => b._creationTime - a._creationTime
    );

    return allNotifications.map(n => ({
        _id: n._id,
        _creationTime: n._creationTime,
        text: n.complaintText, // Assuming this is the main text
        type: 'complaintText' in n ? 'Complaint' : 'Service Report'
    }));
  },
});

// Mark all of the user's notifications as read.
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }

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
    
    const updates = [
      ...unreadServiceReports.map(r => ctx.db.patch(r._id, { viewedBySubmitter: true })),
      ...unreadComplaints.map(c => ctx.db.patch(c._id, { viewedBySubmitter: true }))
    ];

    await Promise.all(updates);
  }
});