// convex/callLogs.ts

import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { asyncMap } from "convex-helpers";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function (No changes needed)
const enrichLog = async (ctx: QueryCtx, log: Doc<"callLogs">) => {
    const location = await ctx.db.get(log.locationId);
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
    };
};

// --- CORRECTED MUTATION TO REQUEST AN ESCALATION ---
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

    // Change status and record the number of engineers at this exact moment.
    await ctx.db.patch(args.callLogId, {
      status: "Escalated",
      statusTimestamp: Date.now(),
      isEscalated: true,
      engineersAtEscalation: callLog.engineerIds.length, // <-- THIS IS THE KEY CHANGE
    });
  },
});

// Create mutation
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

// acceptJob mutation
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
      if (callLog.status === "Pending") {
          patchData.startLocation = { latitude: args.latitude, longitude: args.longitude };
      } else if (callLog.status === "Escalated") {
          patchData.escalatedStartLocation = { latitude: args.latitude, longitude: args.longitude };
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

// assignEscalatedEngineer mutation
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

// finishJob mutation
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
      patchData.endLocation = { latitude: args.latitude, longitude: args.longitude };
    }
    await ctx.db.patch(args.callLogId, patchData);
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