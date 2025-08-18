// convex/callLogs.ts

import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { asyncMap } from "convex-helpers";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function
const enrichLog = async (ctx: QueryCtx, log: Doc<"callLogs">) => {
    // --- MODIFICATION: Fetch location capturer names along with location ---
    const [location, startUser, endUser, escalatedStartUser] = await Promise.all([
      ctx.db.get(log.locationId),
      log.startLocation ? ctx.db.get(log.startLocation.capturedBy) : null,
      log.endLocation ? ctx.db.get(log.endLocation.capturedBy) : null,
      log.escalatedStartLocation ? ctx.db.get(log.escalatedStartLocation.capturedBy) : null,
    ]);

    let clientName = "Unknown Location";
    if (location) {
        clientName = location.fullName;
    }
    
    const engineers = await asyncMap(
      log.engineerIds,
      (engineerId: Id<"users">) => ctx.db.get(engineerId)
    );

    return {
      ...log,
      clientName,
      engineers: engineers.map((e: Doc<"users"> | null) => e?.name ?? "Unknown User"),
      // --- MODIFICATION: Add enriched location data with capturer names ---
      startLocation: log.startLocation ? { ...log.startLocation, capturedByName: startUser?.name ?? "Unknown" } : undefined,
      endLocation: log.endLocation ? { ...log.endLocation, capturedByName: endUser?.name ?? "Unknown" } : undefined,
      escalatedStartLocation: log.escalatedStartLocation ? { ...log.escalatedStartLocation, capturedByName: escalatedStartUser?.name ?? "Unknown" } : undefined,
    };
};

export const requestEscalation = mutation({
  args: { callLogId: v.id("callLogs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You must be logged in to escalate a job.");

    const callLog = await ctx.db.get(args.callLogId);
    if (!callLog) throw new Error("Call log not found.");
    if (callLog.status !== "In Progress") throw new Error("Job must be 'In Progress' to be escalated.");
    if (callLog.isEscalated) throw new Error("This job has already been escalated.");
    if (!callLog.engineerIds.includes(userId)) throw new Error("You are not assigned to this call log.");

    const currentAccepted = callLog.acceptedBy ?? [];
    const allCurrentEngineers = callLog.engineerIds;
    const newAcceptedBy = [...new Set([...currentAccepted, ...allCurrentEngineers])];

    await ctx.db.patch(args.callLogId, {
      status: "Escalated",
      statusTimestamp: Date.now(),
      isEscalated: true,
      engineersAtEscalation: callLog.engineerIds.length,
      acceptedBy: newAcceptedBy,
    });
  },
});

export const create = mutation({
  args: {
    locationId: v.id("clientLocations"),
    issue: v.string(),
    engineerIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.issue.trim().length === 0) throw new Error("Issue description cannot be empty.");
    if (args.engineerIds.length === 0) throw new Error("At least one engineer must be selected.");
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found.");
    const engineers = await asyncMap(args.engineerIds, (id) => ctx.db.get(id));
    const engineerNames = engineers.map(e => e?.name).filter(Boolean).join(" ");
    const searchField = [location.fullName, args.issue, engineerNames].join(" ");

    await ctx.db.insert("callLogs", {
      locationId: args.locationId,
      issue: args.issue,
      engineerIds: args.engineerIds,
      status: "Pending",
      statusTimestamp: Date.now(),
      searchField: searchField,
      acceptedBy: [],
      viewedByEngineers: [],
      isEscalated: false,
    });
  },
});

export const acceptJob = mutation({
  args: {
    callLogId: v.id("callLogs"),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You must be logged in to accept a job.");
    const callLog = await ctx.db.get(args.callLogId);
    if (!callLog) throw new Error("Call log not found.");
    if (!callLog.engineerIds.includes(userId)) throw new Error("You are not assigned to this call log.");
    if (callLog.acceptedBy?.includes(userId)) return;
    const currentAccepted = callLog.acceptedBy ?? [];
    const patchData: Partial<Doc<"callLogs">> = {
      acceptedBy: [...currentAccepted, userId],
    };
    if (args.latitude !== undefined && args.longitude !== undefined) {
      // --- MODIFICATION: Create the enhanced location object ---
      const locationData = { 
        latitude: args.latitude, 
        longitude: args.longitude,
        capturedBy: userId,
        capturedAt: Date.now(),
      };
      if (callLog.status === "Pending") {
          patchData.startLocation = locationData;
      } else if (callLog.status === "Escalated") {
          patchData.escalatedStartLocation = locationData;
      }
    }
    if (callLog.status === "Pending" || callLog.status === "Escalated") {
      patchData.status = "In Progress";
      patchData.statusTimestamp = Date.now();
      if (callLog.status === "Pending") {
        patchData.jobStartTime = Date.now();
      } else {
        patchData.escalatedJobStartTime = Date.now();
      }
    }
    await ctx.db.patch(args.callLogId, patchData);
  },
});

export const assignEscalatedEngineer = mutation({
  args: {
    callLogId: v.id("callLogs"),
    newEngineerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const callLog = await ctx.db.get(args.callLogId);
    if (!callLog) throw new Error("Call log not found.");
    if (callLog.status !== "Escalated") throw new Error("Job must have 'Escalated' status to assign a new engineer.");
    const newEngineer = await ctx.db.get(args.newEngineerId);
    if (!newEngineer) throw new Error("The selected new engineer could not be found.");
    if (callLog.engineerIds.includes(args.newEngineerId)) throw new Error("This engineer is already assigned to the job.");
    const newEngineerName = newEngineer.name ?? "Unknown User";
    const searchField = [callLog.searchField, newEngineerName].join(" ");
    await ctx.db.patch(args.callLogId, {
      engineerIds: [...callLog.engineerIds, args.newEngineerId],
      searchField: searchField,
    });
  },
});

export const finishJob = mutation({
  args: { callLogId: v.id("callLogs"), latitude: v.optional(v.number()), longitude: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You must be logged in to finish a job.");
    
    const callLog = await ctx.db.get(args.callLogId);
    if (!callLog) throw new Error("Call log not found.");
    if (!callLog.engineerIds.includes(userId)) throw new Error("You are not assigned to this call log.");
    if (callLog.status !== "In Progress") throw new Error("Job must be 'In Progress' to be marked as resolved.");
    
    const patchData: Partial<Doc<"callLogs">> = {
      status: "Resolved",
      statusTimestamp: Date.now(),
      jobEndTime: Date.now(),
    };
    if (args.latitude !== undefined && args.longitude !== undefined) {
      // --- MODIFICATION: Create the enhanced location object ---
      patchData.endLocation = { 
        latitude: args.latitude, 
        longitude: args.longitude,
        capturedBy: userId,
        capturedAt: Date.now(),
      };
    }
    await ctx.db.patch(args.callLogId, patchData);

    const settings = await ctx.db.query("systemSettings").withIndex("by_singleton", q => q.eq("singleton", "global")).first();
    
    if (settings && settings.isServicePeriodActive && settings.currentServicePeriodId) {
      const serviceLog = await ctx.db
        .query("serviceLogs")
        .withIndex("by_location_and_period", q => 
          q.eq("locationId", callLog.locationId)
           .eq("servicePeriodId", settings.currentServicePeriodId!)
        )
        .first();

      if (serviceLog && serviceLog.status !== "Finished") {
        await ctx.db.patch(serviceLog._id, {
          status: "Finished",
          completionMethod: "Call Log",
          completedByUserId: userId,
          completedCallLogId: callLog._id,
          jobEndTime: Date.now(), 
        });
        console.log(`Service log ${serviceLog._id} for location ${callLog.locationId} completed via call log ${callLog._id}.`);
      }
    }
  },
});

// Queries
export const getById = query({
  args: { id: v.id("callLogs") },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.id);
    if (!log) return null;
    return enrichLog(ctx, log);
  },
});

export const getMyAssignedJobs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const allLogs = await ctx.db.query("callLogs").order("desc").collect();
    const assignedLogs = allLogs.filter(log => log.engineerIds.includes(userId));
    return asyncMap(assignedLogs, (log) => enrichLog(ctx, log));
  },
});

export const searchCallLogs = query({
  args: { searchText: v.string() },
  handler: async (ctx, args) => {
    const logs = args.searchText === ""
      ? await ctx.db.query("callLogs").order("desc").collect()
      : await ctx.db.query("callLogs").withSearchIndex("by_search", (q) => q.search("searchField", args.searchText)).collect();
    return asyncMap(logs, (log) => enrichLog(ctx, log));
  },
});

// --- NEW QUERY FOR THE CHART ---
export const getRecentLogsForChart = query({
  handler: async (ctx) => {
    // Calculate the date for 30 days ago
    const thirtyDaysAgoTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Query logs created in the last 30 days
    const recentLogs = await ctx.db
      .query("callLogs")
      .filter((q) => q.gt(q.field("_creationTime"), thirtyDaysAgoTimestamp))
      .order("desc")
      .collect();

    // Enrich the logs with client names
    return asyncMap(recentLogs, (log) => enrichLog(ctx, log));
  },
});