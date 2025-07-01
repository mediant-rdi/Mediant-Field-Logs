// convex/dashboard.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

/**
 * A lightweight, optimized query to fetch only dashboard statistics.
 * This is used by the dashboard page and the main layout for notification counts.
 */
export const getDashboardStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { pendingCount: 0, submissionsTodayCount: 0, isAdmin: false };

    const user = await ctx.db.get(userId as Id<"users">);
    if (!user?.isAdmin) return { pendingCount: 0, submissionsTodayCount: 0, isAdmin: false };
    
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    
    const pendingServiceReportsPromise = ctx.db.query("serviceReports").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
    const pendingComplaintsPromise = ctx.db.query("complaints").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
    
    const serviceReportsTodayPromise = ctx.db.query("serviceReports").withIndex("by_creation_time").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();
    const complaintsTodayPromise = ctx.db.query("complaints").withIndex("by_creation_time").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();
    const feedbackTodayPromise = ctx.db.query("feedback").withIndex("by_creation_time").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();

    const [
      pendingServiceReports, 
      pendingComplaints, 
      serviceReportsToday,
      complaintsToday,
      feedbackToday
    ] = await Promise.all([
      pendingServiceReportsPromise, 
      pendingComplaintsPromise,
      serviceReportsTodayPromise,
      complaintsTodayPromise,
      feedbackTodayPromise
    ]);

    const pendingCount = pendingServiceReports.length + pendingComplaints.length;
    const submissionsTodayCount = serviceReportsToday.length + complaintsToday.length + feedbackToday.length;

    return { pendingCount, submissionsTodayCount, isAdmin: true };
  },
});

/**
 * A powerful, server-filtered query for all dashboard lists.
 */
export const getFilteredSubmissions = query({
  args: {
    tab: v.optional(v.union(v.literal('needsReview'), v.literal('serviceReports'), v.literal('complaints'), v.literal('feedback'), v.null())),
    statusFilter: v.optional(v.string()),
  },
  handler: async (ctx, { tab, statusFilter }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { submissions: [], isAdmin: false };

    const user = await ctx.db.get(userId as Id<"users">);
    const isAdmin = user?.isAdmin ?? false;

    let documents: (Doc<"serviceReports"> | Doc<"complaints"> | Doc<"feedback">)[] = [];
    const nonAdminQuery = (q: any) => q.or(q.eq(q.field("submittedBy"), userId), q.eq(q.field("status"), "approved"));
    
    switch(tab) {
        case 'needsReview':
            if(isAdmin) {
                const pendingServiceReports = await ctx.db.query("serviceReports").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").collect();
                const pendingComplaints = await ctx.db.query("complaints").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").collect();
                documents = [...pendingServiceReports, ...pendingComplaints];
            }
            break;
        case 'serviceReports':
            documents = await (isAdmin ? ctx.db.query("serviceReports") : ctx.db.query("serviceReports").filter(nonAdminQuery)).order("desc").collect();
            break;
        case 'complaints':
            documents = await (isAdmin ? ctx.db.query("complaints") : ctx.db.query("complaints").filter(nonAdminQuery)).order("desc").collect();
            break;
        case 'feedback':
            documents = isAdmin ? await ctx.db.query("feedback").order("desc").collect() : [];
            break;
        default:
            return { submissions: [], isAdmin };
    }

    let filteredDocs = documents;
    if(isAdmin && statusFilter && statusFilter !== 'all' && tab !== 'needsReview') {
        filteredDocs = documents.filter(doc => 'status' in doc && doc.status === statusFilter);
    }
    
    const submitterIds = filteredDocs
      .map(doc => (doc as { submittedBy?: Id<"users"> }).submittedBy)
      .filter((id): id is Id<"users"> => !!id);
    
    const uniqueSubmitterIds = [...new Set(submitterIds)];
    const submitters = uniqueSubmitterIds.length > 0 ? await ctx.db.query("users").filter((q) => q.or(...uniqueSubmitterIds.map((id) => q.eq(q.field("_id"), id)))).collect() : [];
    const submitterNames = new Map(submitters.map((s) => [s._id, s.name ?? "Unnamed User"]));

    const allSubmissions = filteredDocs.map(doc => {
      const type = 'feedbackDetails' in doc ? 'feedback' : 'modelTypes' in doc ? 'serviceReport' : 'complaint';
      const mainText = 'feedbackDetails' in doc ? doc.feedbackDetails : doc.complaintText;
      const modelTypes = 'modelTypes' in doc ? doc.modelTypes : 'modelType' in doc ? doc.modelType : undefined;
      const submitterName = 'submittedBy' in doc && doc.submittedBy ? (submitterNames.get(doc.submittedBy) ?? "Unknown User") : "Customer";
      
      return { ...doc, type, mainText, modelTypes, submitterName };
    });

    allSubmissions.sort((a, b) => b._creationTime - a._creationTime);
    return { submissions: allSubmissions, isAdmin };
  },
});