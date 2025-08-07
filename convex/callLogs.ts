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

// Create mutation (No changes needed)
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
    });
  },
});

// MODIFIED: Mutation now captures start time in a single patch.
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
    
    // Build the data object to patch
    const patchData: Partial<Doc<"callLogs">> = {
      acceptedBy: [...currentAccepted, userId],
    };

    // If location is provided, add it to the patch data
    if (args.latitude !== undefined && args.longitude !== undefined) {
      patchData.startLocation = {
        latitude: args.latitude,
        longitude: args.longitude,
      };
    }
    
    // If this is the first person to accept, update status and timestamps
    if (callLog.status === "Pending") {
      patchData.status = "In Progress";
      patchData.statusTimestamp = Date.now();
      patchData.jobStartTime = Date.now(); // <-- SET THE START TIME
    }

    // Perform a single, efficient patch operation
    await ctx.db.patch(args.callLogId, patchData);
  },
});

// getById query (No changes needed)
export const getById = query({
  args: { id: v.id("callLogs") },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.id);
    if (!log) {
      return null;
    }
    return enrichLog(ctx, log);
  },
});

// getMyAssignedJobs query (No changes needed)
export const getMyAssignedJobs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const allLogs = await ctx.db.query("callLogs").order("desc").collect();
    const assignedLogs = allLogs.filter(log => 
      log.engineerIds.includes(userId)
    );
    return asyncMap(assignedLogs, (log) => enrichLog(ctx, log));
  },
});

// Other queries (searchCallLogs, list) remain unchanged...
export const searchCallLogs = query({
  args: { searchText: v.string() },
  handler: async (ctx, args) => {
    if (args.searchText === "") {
      const allLogs = await ctx.db.query("callLogs").order("desc").collect();
      return asyncMap(allLogs, (log) => enrichLog(ctx, log));
    }
    const logs = await ctx.db.query("callLogs").withSearchIndex("by_search", (q) => q.search("searchField", args.searchText)).collect();
    return asyncMap(logs, (log) => enrichLog(ctx, log));
  },
});

export const list = query({
  handler: async (ctx) => {
    const logs = await ctx.db.query("callLogs").order("desc").collect();
    return asyncMap(logs, (log) => enrichLog(ctx, log));
  },
});