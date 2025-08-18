// convex/servicePeriods.ts
import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { asyncMap } from "convex-helpers";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";


// Helper to enrich a service log with names for UI display
const enrichServiceLog = async (ctx: QueryCtx, log: Doc<"serviceLogs">) => {
    const [location, assignedEngineer, completedBy, startUser, endUser] = await Promise.all([
        ctx.db.get(log.locationId),
        ctx.db.get(log.engineerId),
        log.completedByUserId ? ctx.db.get(log.completedByUserId) : null,
        log.startLocation ? ctx.db.get(log.startLocation.capturedBy) : null,
        log.endLocation ? ctx.db.get(log.endLocation.capturedBy) : null,
    ]);

    return {
        ...log,
        locationName: location?.fullName ?? "Unknown Location",
        assignedEngineerName: assignedEngineer?.name ?? "Unknown Engineer",
        completedByName: completedBy?.name,
        startLocation: log.startLocation ? { ...log.startLocation, capturedByName: startUser?.name ?? "Unknown" } : undefined,
        endLocation: log.endLocation ? { ...log.endLocation, capturedByName: endUser?.name ?? "Unknown" } : undefined,
    };
};

/**
 * Lists all service periods for management view.
 */
export const listAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    return await ctx.db.query("servicePeriods")
        .order("desc") // Shows most recent first
        .collect();
  }
});

/**
 * Gets a single service period and all its logs for management view.
 */
export const getByIdWithLogs = query({
  args: { periodId: v.id("servicePeriods") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const period = await ctx.db.get(args.periodId);
    if (!period) return null;

    const logs = await ctx.db.query("serviceLogs")
        .withIndex("by_period", q => q.eq("servicePeriodId", args.periodId))
        .collect();
        
    const enrichedLogs = await asyncMap(logs, (log) => enrichServiceLog(ctx, log));

    return {
        ...period,
        serviceLogs: enrichedLogs,
    };
  }
});

// --- NEW QUERY ---
/**
 * Gets details for a specific user within a specific service period,
 * including the period info, user info, and all their logs.
 */
export const getUserPeriodDetails = query({
    args: {
        periodId: v.id("servicePeriods"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            return null;
        }

        const [period, user, logs] = await Promise.all([
            ctx.db.get(args.periodId),
            ctx.db.get(args.userId),
            ctx.db
                .query("serviceLogs")
                .withIndex("by_engineer_and_period", (q) =>
                    q.eq("engineerId", args.userId).eq("servicePeriodId", args.periodId)
                )
                .collect(),
        ]);

        if (!period || !user) {
            return null;
        }

        const enrichedLogs = await asyncMap(logs, (log) => enrichServiceLog(ctx, log));

        return {
            period,
            user,
            logs: enrichedLogs,
        };
    },
});