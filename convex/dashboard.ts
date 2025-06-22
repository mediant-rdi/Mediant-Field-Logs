// convex/dashboard.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDashboardSubmissions = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return { submissions: [], isAdmin: false };
    }

    const user = await ctx.db.get(userId);
    const isAdmin = user?.isAdmin ?? false;

    // --- 1. Define Queries for Approval-Based Reports ---
    const getReportsQuery = (table: "serviceReports" | "complaints") => {
      if (isAdmin) {
        return ctx.db.query(table).order("desc");
      }
      return ctx.db.query(table)
        .filter((q) => q.or(q.eq(q.field("submittedBy"), userId), q.eq(q.field("status"), "approved")))
        .order("desc");
    };
    
    // --- 2. Fetch Data in Parallel ---
    const serviceReportsPromise = getReportsQuery("serviceReports").collect();
    const complaintsPromise = getReportsQuery("complaints").collect();
    // NEW: Fetch feedback only if the user is an admin
    const feedbackPromise = isAdmin ? ctx.db.query("feedback").order("desc").collect() : Promise.resolve([]);

    const [serviceReports, complaints, feedback] = await Promise.all([
      serviceReportsPromise,
      complaintsPromise,
      feedbackPromise,
    ]);

    // --- 3. Enrich Data Efficiently ---
    // Get submitter IDs from reports that have them
    const approvalDocs = [...serviceReports, ...complaints];
    const submitterIds = approvalDocs.map((doc) => doc.submittedBy);
    const uniqueSubmitterIds = [...new Set(submitterIds)];

    const submitters =
      uniqueSubmitterIds.length > 0
        ? await ctx.db.query("users").filter((q) => q.or(...uniqueSubmitterIds.map((id) => q.eq(q.field("_id"), id)))).collect()
        : [];
    
    const submitterNames = new Map(submitters.map((s) => [s._id, s.name ?? "Unnamed User"]));

    // --- 4. Map ALL Fetched Data to a Common Format ---
    const enrichedServiceReports = serviceReports.map((report) => ({
      ...report,
      submitterName: submitterNames.get(report.submittedBy) ?? "Unknown User",
      type: 'serviceReport' as const,
      mainText: report.complaintText, // Use a common field for the main text
    }));

    const enrichedComplaints = complaints.map((complaint) => ({
      ...complaint,
      modelTypes: (complaint as any).modelType ?? [],
      submitterName: submitterNames.get(complaint.submittedBy) ?? "Unknown User",
      type: 'complaint' as const,
      mainText: complaint.complaintText, // Use a common field for the main text
    }));
    
    // NEW: Enrich feedback data
    const enrichedFeedback = feedback.map((fb) => ({
        ...fb,
        modelTypes: fb.modelType, // Map to the common field name
        branchLocation: fb.branchLocation,
        submitterName: "Customer", // Feedback is from external users
        type: 'feedback' as const,
        mainText: fb.feedbackDetails, // Use a common field for the main text
    }));

    // --- 5. Combine, Sort, and Return ---
    // The enrichedFeedback array will be empty for non-admins, so this is safe.
    const allSubmissions = [...enrichedServiceReports, ...enrichedComplaints, ...enrichedFeedback];
    
    allSubmissions.sort((a, b) => b._creationTime - a._creationTime);

    return {
      submissions: allSubmissions,
      isAdmin,
    };
  },
});