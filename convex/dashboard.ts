// convex/dashboard.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { normalizeName } from "./clients"; // Import our utility from clients.ts

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
 * NOW SUPPORTS DUAL SEARCH: by complaint text AND by client location.
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
      // --- START OF CORRECTED SEARCH LOGIC ---
      
      // === STRATEGY 1: Full-text search on report content (existing) ===
      const baseServiceReportTextSearch = ctx.db
        .query("serviceReports")
        .withSearchIndex("search_complaint_text", (q) => q.search("complaintText", searchQuery));

      const baseComplaintTextSearch = ctx.db
        .query("complaints")
        .withSearchIndex("search_complaint_text", (q) => q.search("complaintText", searchQuery));
        
      const serviceReportTextPromise = (isAdmin ? baseServiceReportTextSearch : baseServiceReportTextSearch.filter(nonAdminQuery)).collect();
      const complaintTextPromise = (isAdmin ? baseComplaintTextSearch : baseComplaintTextSearch.filter(nonAdminQuery)).collect();
      
      // === STRATEGY 2: Search by client location name (new and corrected) ===
      const normalizedQuery = normalizeName(searchQuery);
      const matchingLocations = await ctx.db
        .query("clientLocations")
        .withIndex("by_full_search_name", (q) =>
          q.gte("searchFullName", normalizedQuery).lt("searchFullName", normalizedQuery + "\uffff")
        )
        .collect();

      const locationFullNames = matchingLocations.map(loc => loc.fullName);
      
      let serviceReportLocationPromise: Promise<Doc<"serviceReports">[]> = Promise.resolve([]);
      let complaintLocationPromise: Promise<Doc<"complaints">[]> = Promise.resolve([]);

      if (locationFullNames.length > 0) {
        // --- THIS IS THE FIX ---
        // Create an array of small, indexed query promises, one for each location.
        const serviceReportPromises = locationFullNames.map(name => {
            const baseQuery = ctx.db.query("serviceReports")
                                  .withIndex("by_branchLocation", q => q.eq("branchLocation", name));
            // Apply the non-admin filter *after* using the index
            return (isAdmin ? baseQuery : baseQuery.filter(nonAdminQuery)).collect();
        });

        const complaintPromises = locationFullNames.map(name => {
            const baseQuery = ctx.db.query("complaints")
                                  .withIndex("by_branchLocation", q => q.eq("branchLocation", name));
            return (isAdmin ? baseQuery : baseQuery.filter(nonAdminQuery)).collect();
        });
        
        // Execute all promises in parallel and flatten the array of arrays into a single array.
        serviceReportLocationPromise = Promise.all(serviceReportPromises).then(results => results.flat());
        complaintLocationPromise = Promise.all(complaintPromises).then(results => results.flat());
      }

      // === Run all searches in parallel and combine results ===
      const [
        serviceReportTextResults, 
        complaintTextResults,
        serviceReportLocationResults,
        complaintLocationResults
      ] = await Promise.all([
        serviceReportTextPromise,
        complaintTextPromise,
        serviceReportLocationPromise,
        complaintLocationPromise
      ]);
      
      const combinedResults = [
        ...serviceReportTextResults, 
        ...complaintTextResults,
        ...serviceReportLocationResults,
        ...complaintLocationResults
      ];

      // Deduplicate results
      const uniqueResults = new Map<Id<"serviceReports" | "complaints">, Doc<"serviceReports"> | Doc<"complaints">>();
      for (const doc of combinedResults) {
        if (!uniqueResults.has(doc._id)) {
          uniqueResults.set(doc._id, doc);
        }
      }
      documents = Array.from(uniqueResults.values());
      // --- END OF CORRECTED SEARCH LOGIC ---

    } else {
      // Tabbed browsing logic remains the same
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
    
    // Enriching results logic remains the same
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