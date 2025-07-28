// convex/dashboard.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { normalizeName } from "./clients";

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
    statusFilter: v.optional(v.union(v.literal('all'), v.literal('pending'), v.literal('approved'), v.literal('rejected'))),
    feedbackStatusFilter: v.optional(v.union(v.literal('all'), v.literal('waiting'), v.literal('in_progress'), v.literal('resolved'), v.literal('cannot_be_implemented'))),
  },
  handler: async (ctx, { tab, statusFilter, feedbackStatusFilter, searchQuery }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { submissions: [], isAdmin: false };

    const user = await ctx.db.get(userId as Id<"users">);
    const isAdmin = user?.isAdmin ?? false;

    let documents: (Doc<"serviceReports"> | Doc<"complaints"> | Doc<"feedback">)[] = [];
    
    // Search logic and initial document fetching remains the same...
    const nonAdminQuery = (q: any) => q.or(q.eq(q.field("submittedBy"), userId), q.eq(q.field("status"), "approved"));
    
    if (searchQuery && searchQuery.length > 0) {
      const baseServiceReportTextSearch = ctx.db.query("serviceReports").withSearchIndex("search_complaint_text", (q) => q.search("complaintText", searchQuery));
      const baseComplaintTextSearch = ctx.db.query("complaints").withSearchIndex("search_complaint_text", (q) => q.search("complaintText", searchQuery));
      const serviceReportTextPromise = (isAdmin ? baseServiceReportTextSearch : baseServiceReportTextSearch.filter(nonAdminQuery)).collect();
      const complaintTextPromise = (isAdmin ? baseComplaintTextSearch : baseComplaintTextSearch.filter(nonAdminQuery)).collect();
      
      const normalizedQuery = normalizeName(searchQuery);
      const matchingLocations = await ctx.db.query("clientLocations").withIndex("by_full_search_name", (q) => q.gte("searchFullName", normalizedQuery).lt("searchFullName", normalizedQuery + "\uffff")).collect();
      const locationFullNames = matchingLocations.map(loc => loc.fullName);
      
      let serviceReportLocationPromise: Promise<Doc<"serviceReports">[]> = Promise.resolve([]);
      let complaintLocationPromise: Promise<Doc<"complaints">[]> = Promise.resolve([]);

      if (locationFullNames.length > 0) {
        const serviceReportPromises = locationFullNames.map(name => {
            const baseQuery = ctx.db.query("serviceReports").withIndex("by_branchLocation", q => q.eq("branchLocation", name));
            return (isAdmin ? baseQuery : baseQuery.filter(nonAdminQuery)).collect();
        });
        const complaintPromises = locationFullNames.map(name => {
            const baseQuery = ctx.db.query("complaints").withIndex("by_branchLocation", q => q.eq("branchLocation", name));
            return (isAdmin ? baseQuery : baseQuery.filter(nonAdminQuery)).collect();
        });
        serviceReportLocationPromise = Promise.all(serviceReportPromises).then(results => results.flat());
        complaintLocationPromise = Promise.all(complaintPromises).then(results => results.flat());
      }
      
      const [ serviceReportTextResults, complaintTextResults, serviceReportLocationResults, complaintLocationResults ] = await Promise.all([ serviceReportTextPromise, complaintTextPromise, serviceReportLocationPromise, complaintLocationPromise ]);
      const combinedResults = [ ...serviceReportTextResults, ...complaintTextResults, ...serviceReportLocationResults, ...complaintLocationResults ];
      
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
              documents = isAdmin 
                ? await ctx.db.query("feedback")
                    .filter(q => q.neq(q.field("status"), "pending"))
                    .order("desc").collect() 
                : [];
              break;
          default:
              return { submissions: [], isAdmin };
      }
    }
    
    // Filtering logic remains the same...
    let filteredDocs = documents;
    if (isAdmin && !searchQuery) {
      if (tab === 'feedback' && feedbackStatusFilter && feedbackStatusFilter !== 'all') {
        filteredDocs = documents.filter(doc => 'status' in doc && doc.status === feedbackStatusFilter);
      } else if ((tab === 'serviceReports' || tab === 'complaints') && statusFilter && statusFilter !== 'all') {
        filteredDocs = documents.filter(doc => 'status' in doc && doc.status === statusFilter);
      }
    }
    
    // --- MODIFIED: Enrichment logic now includes `feedbackSource` ---
    const allSubmissions = await Promise.all(filteredDocs.map(async (doc) => {
      const submitter = 'submittedBy' in doc && doc.submittedBy ? await ctx.db.get(doc.submittedBy) : null;
      const submitterName = submitter?.name ?? "Unknown User";

      let type: 'feedback' | 'serviceReport' | 'complaint';
      let mainText: string;
      let locationName: string;
      let machineName: string;
      let machineSerialNumber: string | undefined;
      let feedbackSource: 'customer' | 'engineer' | undefined; // Declare variable

      const anyDoc = doc as any;

      if ('feedbackDetails' in anyDoc) {
        type = 'feedback';
        mainText = anyDoc.feedbackDetails;
        locationName = anyDoc.clientName;
        machineName = anyDoc.machineName;
        feedbackSource = anyDoc.feedbackSource; // Assign from document
      } else if ('backofficeAccess' in anyDoc) {
        type = 'serviceReport';
        mainText = anyDoc.complaintText;
        locationName = anyDoc.branchLocation;
        machineName = anyDoc.machineName ?? anyDoc.modelTypes;
        machineSerialNumber = anyDoc.machineSerialNumber;
      } else {
        type = 'complaint';
        mainText = anyDoc.complaintText;
        locationName = anyDoc.branchLocation;
        machineName = anyDoc.modelType;
        machineSerialNumber = anyDoc.machineSerialNumber;
      }
      
      return { 
        ...doc, 
        type, 
        mainText, 
        locationName, 
        machineName,
        machineSerialNumber,
        submitterName,
        feedbackSource // Include in returned object
      };
    }));

    allSubmissions.sort((a, b) => b._creationTime - a._creationTime);
    return { submissions: allSubmissions, isAdmin };
  },
});