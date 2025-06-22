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
    
    let serviceReports;
    if (isAdmin) {
      // ADMINS: No change. They see all reports.
      serviceReports = await ctx.db.query("serviceReports").order("desc").collect();
    } else {
      // --- THIS IS THE MODIFIED LOGIC FOR REGULAR USERS ---
      // Regular users now see their own submissions OR any approved submission.
      serviceReports = await ctx.db
        .query("serviceReports")
        .filter((q) =>
          q.or(
            // Condition 1: The report was submitted by the current user (any status).
            q.eq(q.field("submittedBy"), userId),
            // Condition 2: The report's status is 'approved' (from any user).
            q.eq(q.field("status"), "approved")
          )
        )
        .order("desc") // Still show the newest first
        .collect();
    }

    // This enrichment logic works perfectly with the new query and does not need to change.
    const submitterIds = serviceReports.map((report) => report.submittedBy);
    const uniqueSubmitterIds = [...new Set(submitterIds)];

    const submitters =
      uniqueSubmitterIds.length > 0
        ? await ctx.db
            .query("users")
            .filter((q) => q.or(...uniqueSubmitterIds.map((id) => q.eq(q.field("_id"), id))))
            .collect()
        : [];

    const submitterNames = new Map(
      submitters.map((user) => [user._id, user.name ?? "Unnamed User"])
    );

    const enrichedReports = serviceReports.map((report) => ({
      ...report,
      submitterName: submitterNames.get(report.submittedBy) ?? "Unknown User",
    }));

    return {
      submissions: enrichedReports,
      isAdmin: isAdmin,
    };
  },
});