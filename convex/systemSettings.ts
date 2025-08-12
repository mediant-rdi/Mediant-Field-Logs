// convex/systemSettings.ts

import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get the single settings document, now correctly typed.
const getSettings = (ctx: QueryCtx | MutationCtx) => {
    return ctx.db.query("systemSettings").withIndex("by_singleton", q => q.eq("singleton", "global")).first();
};

/**
 * Gets the current status of the service period.
 * This is a public query that any authenticated user can call.
 * It will return null if the settings have not been initialized yet.
 */
export const getServicePeriodStatus = query({
  handler: async (ctx) => {
    const settings = await getSettings(ctx);
    return settings;
  },
});

/**
 * (ADMIN ONLY) Activates a new service period.
 * This mutation is now responsible for initializing the settings document if it doesn't exist.
 */
export const activateServicePeriod = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("You must be an admin to perform this action.");

    if (args.name.trim().length === 0) throw new Error("Service period name cannot be empty.");

    const settings = await getSettings(ctx);
    const servicePeriodId = `sp_${Date.now()}`;
    
    // Generate new service logs from user assignments
    const usersWithAssignments = await ctx.db.query("users")
      .filter(q => q.neq(q.field("serviceLocationIds"), undefined))
      .collect();

    let logsCreated = 0;
    for (const user of usersWithAssignments) {
        if (user.serviceLocationIds && user.serviceLocationIds.length > 0) {
            for (const locationId of user.serviceLocationIds) {
                await ctx.db.insert("serviceLogs", {
                    servicePeriodId,
                    engineerId: user._id,
                    locationId,
                    status: "Pending",
                });
                logsCreated++;
            }
        }
    }

    // Now, either insert a new settings doc or patch the existing one
    if (settings) {
        // Document exists, so patch it.
        if (settings.isServicePeriodActive) {
            throw new Error("A service period is already active.");
        }
        await ctx.db.patch(settings._id, {
            isServicePeriodActive: true,
            currentServicePeriodId: servicePeriodId,
            servicePeriodName: args.name,
        });
    } else {
        // Document does not exist, so create it for the first time.
        await ctx.db.insert("systemSettings", {
            isServicePeriodActive: true,
            currentServicePeriodId: servicePeriodId,
            servicePeriodName: args.name,
            singleton: "global",
        });
    }
    
    return { logsCreated };
  },
});

/**
 * (ADMIN ONLY) Deactivates the current service period.
 */
export const deactivateServicePeriod = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("You must be an admin to perform this action.");

    const settings = await getSettings(ctx);
    if (!settings || !settings.isServicePeriodActive || !settings.currentServicePeriodId) {
        return { message: "No active service period to deactivate." };
    }

    // Safety check for in-progress jobs
    const inProgressJobs = await ctx.db
      .query("serviceLogs")
      // An index on just the first field of a compound index can be used for filtering.
      .withIndex("by_location_and_period") 
      .filter(q => q.eq(q.field("servicePeriodId"), settings.currentServicePeriodId!))
      .filter(q => q.eq(q.field("status"), "In Progress"))
      .collect();

    if (inProgressJobs.length > 0 && !args.force) {
        return { 
            needsConfirmation: true, 
            inProgressCount: inProgressJobs.length 
        };
    }

    await ctx.db.patch(settings._id, {
        isServicePeriodActive: false,
    });

    return { success: true };
  },
});