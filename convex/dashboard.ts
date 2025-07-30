// convex/dashboard.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

// getDashboardStats function remains unchanged...
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
    const pendingFeedbackPromise = ctx.db.query("feedback").filter(q => q.eq(q.field("status"), "pending")).collect();
    
    const serviceReportsTodayPromise = ctx.db.query("serviceReports").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();
    const complaintsTodayPromise = ctx.db.query("complaints").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();
    const feedbackTodayPromise = ctx.db.query("feedback").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();

    const [
      pendingServiceReports, 
      pendingComplaints,
      pendingFeedback, 
      serviceReportsToday,
      complaintsToday,
      feedbackToday
    ] = await Promise.all([
      pendingServiceReportsPromise, 
      pendingComplaintsPromise,
      pendingFeedbackPromise,
      serviceReportsTodayPromise,
      complaintsTodayPromise,
      feedbackTodayPromise
    ]);

    const pendingCount = pendingServiceReports.length + pendingComplaints.length + pendingFeedback.length;
    const submissionsTodayCount = serviceReportsToday.length + complaintsToday.length + feedbackToday.length;

    return { pendingCount, submissionsTodayCount, isAdmin: true };
  },
});

export const getFilteredSubmissions = query({
  args: {
    tab: v.optional(v.union(v.literal('needsReview'), v.literal('serviceReports'), v.literal('complaints'), v.literal('feedback'), v.null())),
    searchQuery: v.optional(v.string()),
    // --- MODIFIED: New comprehensive filter for complaints/reports ---
    complaintStatusFilter: v.optional(v.union(v.literal('all'), v.literal('waiting'), v.literal('in_progress'), v.literal('resolved'), v.literal('rejected'))),
    feedbackStatusFilter: v.optional(v.union(v.literal('all'), v.literal('waiting'), v.literal('in_progress'), v.literal('resolved'), v.literal('cannot_be_implemented'))),
  },
  handler: async (ctx, { tab, complaintStatusFilter, feedbackStatusFilter, searchQuery }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { submissions: [], isAdmin: false };

    const user = await ctx.db.get(userId as Id<"users">);
    const isAdmin = user?.isAdmin ?? false;

    let documents: (Doc<"serviceReports"> | Doc<"complaints"> | Doc<"feedback">)[] = [];
    
    // For non-admins, this fetches their own reports (any status) plus all globally approved ones.
    const nonAdminQuery = (q: any) => q.or(q.eq(q.field("submittedBy"), userId), q.eq(q.field("status"), "approved"));
    
    if (searchQuery && searchQuery.length > 0) {
      // --- Search logic is unchanged ---
      const searchPromises: Promise<(Doc<"serviceReports"> | Doc<"complaints">)[]>[] = [];
      const matchingUsers = await ctx.db.query("users").withSearchIndex("by_name_search", (q) => q.search("name", searchQuery)).collect();
      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length > 0) {
        for (const id of userIds) {
          const srAuthorQuery = ctx.db.query("serviceReports").withIndex("by_submittedBy", (q) => q.eq("submittedBy", id));
          searchPromises.push((isAdmin ? srAuthorQuery : srAuthorQuery.filter(nonAdminQuery)).collect());
          const cAuthorQuery = ctx.db.query("complaints").withIndex("by_submittedBy", (q) => q.eq("submittedBy", id));
          searchPromises.push((isAdmin ? cAuthorQuery : cAuthorQuery.filter(nonAdminQuery)).collect());
        }
      }
      const srSearchTasks = [{ index: "search_complaint_text" as const, field: "complaintText" as const }, { index: "search_branchLocation" as const, field: "branchLocation" as const }, { index: "search_machineName" as const, field: "machineName" as const }, { index: "search_machineSerialNumber" as const, field: "machineSerialNumber" as const }];
      for (const task of srSearchTasks) {
        const baseQuery = ctx.db.query("serviceReports").withSearchIndex(task.index, (q) => q.search(task.field, searchQuery));
        searchPromises.push((isAdmin ? baseQuery : baseQuery.filter(nonAdminQuery)).collect());
      }
      const cSearchTasks = [{ index: "search_complaint_text" as const, field: "complaintText" as const }, { index: "search_branchLocation" as const, field: "branchLocation" as const }, { index: "search_modelType" as const, field: "modelType" as const }, { index: "search_machineSerialNumber" as const, field: "machineSerialNumber" as const }];
      for (const task of cSearchTasks) {
        const baseQuery = ctx.db.query("complaints").withSearchIndex(task.index, (q) => q.search(task.field, searchQuery));
        searchPromises.push((isAdmin ? baseQuery : baseQuery.filter(nonAdminQuery)).collect());
      }
      const allResults = await Promise.all(searchPromises);
      const combinedResults = allResults.flat();
      const uniqueResults = new Map<Id<"serviceReports" | "complaints">, Doc<"serviceReports"> | Doc<"complaints">>();
      for (const doc of combinedResults) {
        if (!uniqueResults.has(doc._id)) { uniqueResults.set(doc._id, doc); }
      }
      documents = Array.from(uniqueResults.values());
    } else {
      switch(tab) {
          case 'needsReview':
              if(isAdmin) {
                  const pendingServiceReports = await ctx.db.query("serviceReports").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").collect();
                  const pendingComplaints = await ctx.db.query("complaints").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").collect();
                  const pendingFeedback = await ctx.db.query("feedback").filter(q => q.eq(q.field("status"), "pending")).order("desc").collect();
                  documents = [...pendingServiceReports, ...pendingComplaints, ...pendingFeedback];
              }
              break;
          case 'serviceReports':
              documents = await (isAdmin ? ctx.db.query("serviceReports") : ctx.db.query("serviceReports").filter(nonAdminQuery)).order("desc").collect();
              break;
          case 'complaints':
              documents = await (isAdmin ? ctx.db.query("complaints") : ctx.db.query("complaints").filter(nonAdminQuery)).order("desc").collect();
              break;
          case 'feedback':
              documents = isAdmin ? await ctx.db.query("feedback").filter(q => q.neq(q.field("status"), "pending")).order("desc").collect() : [];
              break;
          default:
              return { submissions: [], isAdmin };
      }
    }
    
    // --- MODIFIED: Filtering logic to handle the new complaintStatusFilter ---
    let filteredDocs = documents;
    if (!searchQuery) { // Apply filters only when not performing a global search
      if (isAdmin && tab === 'feedback' && feedbackStatusFilter && feedbackStatusFilter !== 'all') {
        filteredDocs = documents.filter(doc => 'status' in doc && doc.status === feedbackStatusFilter);
      } else if ((tab === 'serviceReports' || tab === 'complaints') && complaintStatusFilter) {
        
        let baseDocs = documents;
        // For admins, the complaint/report tabs should not show 'pending' items.
        // 'pending' items are exclusively for the 'Needs Review' tab.
        if (isAdmin) {
          baseDocs = documents.filter(doc => doc.status !== 'pending');
        }

        if (complaintStatusFilter === 'all') {
          filteredDocs = baseDocs;
        } else if (complaintStatusFilter === 'rejected') {
          filteredDocs = baseDocs.filter(doc => 'status' in doc && doc.status === 'rejected');
        } else { // 'waiting', 'in_progress', 'resolved'
          // These filters apply only to 'approved' reports.
          filteredDocs = baseDocs.filter(
            doc => 'status' in doc && 
            doc.status === 'approved' && 
            'resolutionStatus' in doc && 
            doc.resolutionStatus === complaintStatusFilter
          );
        }
      }
    }
    
    // Enrichment logic remains the same...
    const allSubmissions = await Promise.all(filteredDocs.map(async (doc) => {
      const submitter = 'submittedBy' in doc && doc.submittedBy ? await ctx.db.get(doc.submittedBy) : null;
      const submitterName = submitter?.name ?? "Unknown User";
      let type: 'feedback' | 'serviceReport' | 'complaint';
      let mainText: string, locationName: string, machineName: string, machineSerialNumber: string | undefined, feedbackSource: 'customer' | 'engineer' | undefined;
      const anyDoc = doc as any;
      if ('feedbackDetails' in anyDoc) {
        type = 'feedback'; mainText = anyDoc.feedbackDetails; locationName = anyDoc.clientName; machineName = anyDoc.machineName; feedbackSource = anyDoc.feedbackSource;
      } else if ('backofficeAccess' in anyDoc) {
        type = 'serviceReport'; mainText = anyDoc.complaintText; locationName = anyDoc.branchLocation; machineName = anyDoc.machineName ?? anyDoc.modelTypes; machineSerialNumber = anyDoc.machineSerialNumber;
      } else {
        type = 'complaint'; mainText = anyDoc.complaintText; locationName = anyDoc.branchLocation; machineName = anyDoc.modelType; machineSerialNumber = anyDoc.machineSerialNumber;
      }
      return { ...doc, type, mainText, locationName, machineName, machineSerialNumber, submitterName, feedbackSource };
    }));

    allSubmissions.sort((a, b) => b._creationTime - a._creationTime);
    return { submissions: allSubmissions, isAdmin };
  },
});