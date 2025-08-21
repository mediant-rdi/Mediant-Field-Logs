// convex/servicePeriods.ts
import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { asyncMap } from "convex-helpers";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { enrichServiceLog } from "./serviceLogs"; // OPTIMIZATION: Import shared helper

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
        .order("desc")
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

/**
 * Gets details for a specific user within a specific service period.
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