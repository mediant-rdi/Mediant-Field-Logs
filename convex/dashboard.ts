// convex/dashboard.ts
import { query } from "./_generated/server";
// --- CORRECTED --- Removed the non-existent 'getIsAdmin' import
import { getAuthUserId } from "@convex-dev/auth/server";

// This query powers the main dashboard view.
export const getDashboardSubmissions = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      // Return a default state for logged-out users.
      return { submissions: [], isAdmin: false };
    }

    // --- THIS IS THE FIX ---
    // 1. Fetch the user document from *your* users table using their ID.
    const user = await ctx.db.get(userId);

    // 2. Determine admin status from your user document.
    //    Use optional chaining `?.` and nullish coalescing `??` for safety.
    const isAdmin = user?.isAdmin ?? false;
    
    // The rest of the logic works perfectly with this correct `isAdmin` value.
    let serviceReports;
    if (isAdmin) {
      // Admin: Fetch all reports, newest first
      serviceReports = await ctx.db.query("serviceReports").order("desc").collect();
    } else {
      // Regular User: Fetch only their own reports, newest first
      serviceReports = await ctx.db
        .query("serviceReports")
        .withIndex("by_submittedBy", (q) => q.eq("submittedBy", userId))
        .order("desc")
        .collect();
    }

    // Enrich the reports with the submitter's name.
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

    // Return the final object. The shape is the same, so the frontend doesn't need to change.
    return {
      submissions: enrichedReports,
      isAdmin: isAdmin,
    };
  },
});