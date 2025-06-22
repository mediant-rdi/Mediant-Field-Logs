// convex/dashboard.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// --- NEW: Lightweight query for the global header notification ---
export const getPendingSubmissionsCount = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const user = await ctx.db.get(userId as Id<"users">);
    if (!user?.isAdmin) return 0;

    const pendingServiceReportsPromise = ctx.db.query("serviceReports").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
    const pendingComplaintsPromise = ctx.db.query("complaints").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
      
    const [pendingServiceReports, pendingComplaints] = await Promise.all([
      pendingServiceReportsPromise,
      pendingComplaintsPromise,
    ]);

    return pendingServiceReports.length + pendingComplaints.length;
  },
});

// --- UPDATED: The main query for the dashboard page, now with KPIs ---
export const getDashboardSubmissions = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return { submissions: [], isAdmin: false, pendingCount: 0, submissionsTodayCount: 0 };
    }

    const user = await ctx.db.get(userId as Id<"users">);
    const isAdmin = user?.isAdmin ?? false;

    const getReportsQuery = (table: "serviceReports" | "complaints") => {
      if (isAdmin) return ctx.db.query(table).order("desc");
      return ctx.db.query(table).filter((q) => q.or(q.eq(q.field("submittedBy"), userId), q.eq(q.field("status"), "approved"))).order("desc");
    };
    
    const serviceReportsPromise = getReportsQuery("serviceReports").collect();
    const complaintsPromise = getReportsQuery("complaints").collect();
    const feedbackPromise = isAdmin ? ctx.db.query("feedback").order("desc").collect() : Promise.resolve([]);

    const [serviceReports, complaints, feedback] = await Promise.all([
      serviceReportsPromise,
      complaintsPromise,
      feedbackPromise,
    ]);

    const approvalDocs = [...serviceReports, ...complaints];
    const submitterIds = approvalDocs.map((doc) => doc.submittedBy);
    const uniqueSubmitterIds = [...new Set(submitterIds)];
    const submitters = uniqueSubmitterIds.length > 0 ? await ctx.db.query("users").filter((q) => q.or(...uniqueSubmitterIds.map((id) => q.eq(q.field("_id"), id)))).collect() : [];
    const submitterNames = new Map(submitters.map((s) => [s._id, s.name ?? "Unnamed User"]));

    const enrichedServiceReports = serviceReports.map((report) => ({
      ...report,
      submitterName: submitterNames.get(report.submittedBy) ?? "Unknown User", type: 'serviceReport' as const, mainText: report.complaintText,
    }));
    const enrichedComplaints = complaints.map((complaint) => ({
      ...complaint, modelTypes: (complaint as any).modelType ?? [], submitterName: submitterNames.get(complaint.submittedBy) ?? "Unknown User", type: 'complaint' as const, mainText: complaint.complaintText,
    }));
    const enrichedFeedback = feedback.map((fb) => ({
        ...fb, modelTypes: fb.modelType, branchLocation: fb.branchLocation, submitterName: "Customer", type: 'feedback' as const, mainText: fb.feedbackDetails,
    }));

    const allSubmissions = [...enrichedServiceReports, ...enrichedComplaints, ...enrichedFeedback];
    
    // --- Calculate KPIs for the dashboard summary bar ---
    const pendingCount = allSubmissions.filter(s => 'status' in s && s.status === 'pending').length;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const submissionsTodayCount = allSubmissions.filter(s => s._creationTime >= startOfToday.getTime()).length;
    
    allSubmissions.sort((a, b) => b._creationTime - a._creationTime);

    return {
      submissions: allSubmissions,
      isAdmin,
      pendingCount,
      submissionsTodayCount,
    };
  },
});