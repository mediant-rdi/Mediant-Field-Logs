// convex/systemSettings.ts

import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

const getSettings = (ctx: QueryCtx | MutationCtx) => {
    return ctx.db.query("systemSettings").withIndex("by_singleton", q => q.eq("singleton", "global")).first();
};

/**
 * Gets the current status of the service period.
 */
export const getServicePeriodStatus = query({
  handler: async (ctx) => {
    return await getSettings(ctx);
  },
});

/**
 * (ADMIN ONLY) Activates a new service period.
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
    if (settings?.isServicePeriodActive) {
      throw new Error("A service period is already active. Please deactivate it first.");
    }
    
    const usersWithAssignments = await ctx.db.query("users")
      .filter(q => q.neq(q.field("serviceLocationIds"), undefined))
      .filter(q => q.neq(q.field("serviceLocationIds"), []))
      .collect();

    if (usersWithAssignments.length === 0) {
      throw new Error("Cannot activate a period with no engineers assigned to locations.");
    }

    let logsToCreate: { engineerId: Id<"users">; locationId: Id<"clientLocations">; status: "Pending" }[] = [];
    for (const user of usersWithAssignments) {
        if (user.serviceLocationIds) {
            for (const locationId of user.serviceLocationIds) {
                logsToCreate.push({
                    engineerId: user._id,
                    locationId,
                    status: "Pending",
                });
            }
        }
    }

    const newPeriodId = await ctx.db.insert("servicePeriods", {
        name: args.name,
        startDate: Date.now(),
        isActive: true,
        createdBy: userId,
        logsCreated: logsToCreate.length,
    });

    for (const log of logsToCreate) {
        await ctx.db.insert("serviceLogs", {
            ...log,
            servicePeriodId: newPeriodId,
        });
    }
    
    if (settings) {
        await ctx.db.patch(settings._id, {
            isServicePeriodActive: true,
            currentServicePeriodId: newPeriodId,
            servicePeriodName: args.name,
        });
    } else {
        await ctx.db.insert("systemSettings", {
            isServicePeriodActive: true,
            currentServicePeriodId: newPeriodId,
            servicePeriodName: args.name,
            singleton: "global",
        });
    }
    
    return { logsCreated: logsToCreate.length };
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

    const inProgressJobs = await ctx.db
      .query("serviceLogs")
      .withIndex("by_period", q => q.eq("servicePeriodId", settings.currentServicePeriodId!))
      .filter(q => q.eq(q.field("status"), "In Progress"))
      .collect();

    if (inProgressJobs.length > 0 && !args.force) {
        return { 
            needsConfirmation: true, 
            inProgressCount: inProgressJobs.length 
        };
    }

    await ctx.db.patch(settings.currentServicePeriodId, {
        isActive: false,
        endDate: Date.now(),
    });

    await ctx.db.patch(settings._id, {
        isServicePeriodActive: false,
    });

    return { success: true };
  },
});