// convex/serviceLogs.ts
import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { asyncMap } from "convex-helpers";

// Helper to enrich a service log with names for UI display
export const enrichServiceLog = async (ctx: QueryCtx, log: Doc<"serviceLogs">) => {
    const [location, assignedEngineer, completedBy, startUser, endUser, startedByUser] = await Promise.all([
        ctx.db.get(log.locationId),
        ctx.db.get(log.engineerId),
        log.completedByUserId ? ctx.db.get(log.completedByUserId) : null,
        log.startLocation ? ctx.db.get(log.startLocation.capturedBy) : null,
        log.endLocation ? ctx.db.get(log.endLocation.capturedBy) : null,
        // MODIFICATION: Fetch the user who started the job
        log.startedByUserId ? ctx.db.get(log.startedByUserId) : null,
    ]);

    return {
        ...log,
        locationName: location?.fullName ?? "Unknown Location",
        assignedEngineerName: assignedEngineer?.name ?? "Unknown Engineer",
        completedByName: completedBy?.name,
        startLocation: log.startLocation ? { ...log.startLocation, capturedByName: startUser?.name ?? "Unknown" } : undefined,
        endLocation: log.endLocation ? { ...log.endLocation, capturedByName: endUser?.name ?? "Unknown" } : undefined,
        // MODIFICATION: Add the starter's name to the enriched object
        startedByName: startedByUser?.name,
    };
};

/**
 * Get a single service log by its ID, fully enriched.
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
 * [MODIFIED] Get the current authenticated engineer's TEAM list of service logs for the active period.
 * This includes logs assigned to the engineer directly, their team leader, and their teammates.
 */
export const getMyServiceLogs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // 1. Determine the user's team
    const allUsers = await ctx.db.query("users").collect();
    const currentUser = allUsers.find(u => u._id === userId);
    if (!currentUser) return [];

    const leader = allUsers.find(u => u.taggedTeamMemberIds?.includes(userId)) ?? currentUser;
    const teamMemberIds = Array.from(new Set([leader._id, ...(leader.taggedTeamMemberIds ?? [])]));
    
    // 2. Get active service period
    const settings = await ctx.db.query("systemSettings").withIndex("by_singleton", q => q.eq("singleton", "global")).first();
    if (!settings?.isServicePeriodActive || !settings.currentServicePeriodId) {
        return [];
    }
    const periodId = settings.currentServicePeriodId;

    // 3. Fetch logs for each team member using the index for better performance
    const logsPromises = teamMemberIds.map(engineerId => 
      ctx.db
        .query("serviceLogs")
        .withIndex("by_engineer_and_period", q => 
          q.eq("engineerId", engineerId)
           .eq("servicePeriodId", periodId)
        )
        .collect()
    );

    const logsByMember = await Promise.all(logsPromises);
    const allLogs = logsByMember.flat();
      
    // 4. Enrich and return
    return asyncMap(allLogs, (log) => enrichServiceLog(ctx, log));
  },
});

/**
 * [MODIFIED] Allows any member of the assigned engineer's team to start a planned service job.
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
    if (log.status !== "Pending") throw new Error("This service must be in 'Pending' status to start.");

    // MODIFICATION: Check for team membership instead of direct assignment
    const allUsers = await ctx.db.query("users").collect();
    const assignedEngineer = allUsers.find(u => u._id === log.engineerId);
    const actingUser = allUsers.find(u => u._id === userId);
    if (!assignedEngineer || !actingUser) throw new Error("Engineer not found.");

    const assignedEngineerLeader = allUsers.find(u => u.taggedTeamMemberIds?.includes(assignedEngineer._id)) ?? assignedEngineer;
    const actingUserLeader = allUsers.find(u => u.taggedTeamMemberIds?.includes(actingUser._id)) ?? actingUser;

    if (assignedEngineerLeader._id !== actingUserLeader._id) {
        throw new Error("You are not on the same team as the assigned engineer.");
    }
    
    // Check if the acting user already has a job in progress
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

    // MODIFICATION: Patch the log with the ID of the user who started it
    await ctx.db.patch(log._id, {
        status: "In Progress",
        jobStartTime: Date.now(),
        startedByUserId: userId, // <-- Record who started the job
        startLocation: {
            latitude: args.latitude,
            longitude: args.longitude,
            capturedBy: userId,
            capturedAt: Date.now(),
        }
    });
  },
});

/**
 * [MODIFIED] Allows the engineer who started a planned service job to finish it.
 */
export const finishPlannedService = mutation({
  args: { 
    serviceLogId: v.id("serviceLogs"),
    latitude: v.number(),
    longitude: v.number(),
    completionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You must be logged in.");

    const log = await ctx.db.get(args.serviceLogId);
    if (!log) throw new Error("Service log not found.");
    if (log.status !== "In Progress") throw new Error("This service must be 'In Progress' to be finished.");
    
    // MODIFICATION: Only the user who started the job can finish it.
    if (!log.startedByUserId) throw new Error("Cannot finish a job that hasn't been started properly.");
    if (log.startedByUserId !== userId) throw new Error("Only the engineer who started this job can finish it.");
    
    await ctx.db.patch(log._id, {
        status: "Finished",
        completionMethod: "Planned Service",
        completedByUserId: userId,
        jobEndTime: Date.now(),
        endLocation: {
            latitude: args.latitude,
            longitude: args.longitude,
            capturedBy: userId,
            capturedAt: Date.now(),
        },
        completionNotes: args.completionNotes,
    });
  },
});