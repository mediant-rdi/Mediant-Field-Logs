// convex/serviceLogs.ts
import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { asyncMap } from "convex-helpers";

// Helper to enrich a service log with names for UI display
const enrichServiceLog = async (ctx: QueryCtx, log: Doc<"serviceLogs">) => {
    const [location, assignedEngineer, completedBy] = await Promise.all([
        ctx.db.get(log.locationId),
        ctx.db.get(log.engineerId),
        log.completedByUserId ? ctx.db.get(log.completedByUserId) : null,
    ]);

    return {
        ...log,
        locationName: location?.fullName ?? "Unknown Location",
        assignedEngineerName: assignedEngineer?.name ?? "Unknown Engineer",
        completedByName: completedBy?.name,
    };
};

/**
 * Get a single service log by its ID, fully enriched.
 * This is for the detail view page.
 */
export const getById = query({
    args: { id: v.id("serviceLogs") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const log = await ctx.db.get(args.id);
        if (!log) return null;

        return await enrichServiceLog(ctx, log);
    }
});

/**
 * Get the current authenticated engineer's list of service logs for the active period.
 */
export const getMyServiceLogs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db.query("systemSettings").withIndex("by_singleton", q => q.eq("singleton", "global")).first();
    if (!settings?.isServicePeriodActive || !settings.currentServicePeriodId) {
        return [];
    }

    const logs = await ctx.db
      .query("serviceLogs")
      .withIndex("by_engineer_and_period", q => 
        q.eq("engineerId", userId)
         .eq("servicePeriodId", settings.currentServicePeriodId!)
      )
      .order("asc")
      .collect();
      
    return asyncMap(logs, (log) => enrichServiceLog(ctx, log));
  },
});

/**
 * Allows an engineer to start a planned service job, capturing their location.
 * Prevents starting a new job if another is already in progress for the current service period.
 */
export const startPlannedService = mutation({
  args: { 
    serviceLogId: v.id("serviceLogs"),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You must be logged in.");

    const log = await ctx.db.get(args.serviceLogId);
    if (!log) throw new Error("Service log not found.");
    if (log.engineerId !== userId) throw new Error("You are not assigned to this service log.");
    if (log.status !== "Pending") throw new Error("This service must be in 'Pending' status to start.");

    const settings = await ctx.db.query("systemSettings").withIndex("by_singleton", q => q.eq("singleton", "global")).first();
    if (settings?.isServicePeriodActive && settings.currentServicePeriodId) {
        const existingInProgressJob = await ctx.db
            .query("serviceLogs")
            .withIndex("by_engineer_and_period", q => 
                q.eq("engineerId", userId)
                 .eq("servicePeriodId", settings.currentServicePeriodId!)
            )
            .filter(q => q.eq(q.field("status"), "In Progress"))
            .first();

        if (existingInProgressJob) {
            throw new Error("You already have a service job in progress. Please finish it before starting a new one.");
        }
    }

    await ctx.db.patch(log._id, {
        status: "In Progress",
        jobStartTime: Date.now(),
        startLocation: {
            latitude: args.latitude,
            longitude: args.longitude,
        }
    });
  },
});

// --- THIS MUTATION IS CORRECTED ---
/**
 * Allows an engineer to finish a planned service job they started, capturing their location and an optional comment.
 */
export const finishPlannedService = mutation({
  args: { 
    serviceLogId: v.id("serviceLogs"),
    latitude: v.number(),
    longitude: v.number(),
    // THIS IS THE NEW ARGUMENT
    completionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You must be logged in.");

    const log = await ctx.db.get(args.serviceLogId);
    if (!log) throw new Error("Service log not found.");
    if (log.engineerId !== userId) throw new Error("You are not assigned to this service log.");
    if (log.status !== "In Progress") throw new Error("This service must be 'In Progress' to be finished.");
    
    await ctx.db.patch(log._id, {
        status: "Finished",
        completionMethod: "Planned Service",
        completedByUserId: userId,
        jobEndTime: Date.now(),
        endLocation: {
            latitude: args.latitude,
            longitude: args.longitude,
        },
        // THIS IS THE NEW FIELD BEING SAVED
        completionNotes: args.completionNotes,
    });
  },
});