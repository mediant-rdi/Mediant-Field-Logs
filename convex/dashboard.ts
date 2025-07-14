// convex/dashboard.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { normalizeName } from "./clients";

// getDashboardStats remains the same.
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
    
    const serviceReportsTodayPromise = ctx.db.query("serviceReports").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();
    const complaintsTodayPromise = ctx.db.query("complaints").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();
    const feedbackTodayPromise = ctx.db.query("feedback").filter(q => q.gt(q.field("_creationTime"), startOfToday.getTime())).collect();

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
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, { tab, statusFilter, searchQuery }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { submissions: [], isAdmin: false };

    const user = await ctx.db.get(userId as Id<"users">);
    const isAdmin = user?.isAdmin ?? false;

    let documents: (Doc<"serviceReports"> | Doc<"complaints"> | Doc<"feedback">)[] = [];
    
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
    }
    
    let filteredDocs = documents;
    if(isAdmin && statusFilter && statusFilter !== 'all' && tab !== 'needsReview' && !searchQuery) {
        filteredDocs = documents.filter(doc => 'status' in doc && doc.status === statusFilter);
    }
    
    // --- START OF CORRECTED ENRICHMENT LOGIC ---
    const allSubmissions = await Promise.all(filteredDocs.map(async (doc) => {
      const submitter = 'submittedBy' in doc && doc.submittedBy ? await ctx.db.get(doc.submittedBy) : null;
      const submitterName = submitter?.name ?? "Unknown User";

      let type: 'feedback' | 'serviceReport' | 'complaint';
      let mainText: string;
      let locationName: string;
      let machineName: string;

      // Use `any` to safely access legacy fields that may not exist on the current schema type
      const anyDoc = doc as any;

      // Determine document type using a unique field as a guard
      if ('feedbackDetails' in anyDoc) {
        type = 'feedback';
        mainText = anyDoc.feedbackDetails;
        locationName = anyDoc.clientName;
        machineName = anyDoc.machineName;
      } else if ('backofficeAccess' in anyDoc) { // `backofficeAccess` is unique to Service Reports
        type = 'serviceReport';
        mainText = anyDoc.complaintText;
        locationName = anyDoc.branchLocation;
        // Handle both new (`machineName`) and legacy (`modelTypes`) fields
        machineName = anyDoc.machineName ?? anyDoc.modelTypes;
      } else { // Fallback to Complaint
        type = 'complaint';
        mainText = anyDoc.complaintText;
        locationName = anyDoc.branchLocation;
        // Complaints use `modelType`
        machineName = anyDoc.modelType;
      }
      
      return { 
        ...doc, 
        type, 
        mainText, 
        locationName, 
        machineName, 
        submitterName 
      };
    }));
    // --- END OF CORRECTED ENRICHMENT LOGIC ---

    allSubmissions.sort((a, b) => b._creationTime - a._creationTime);
    return { submissions: allSubmissions, isAdmin };
  },
});