// convex/reports.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper function to check for admin privileges
const ensureAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated. You must be logged in.");
  }
  
  const user = await ctx.db.get(userId);
  if (!user || !user.isAdmin) {
    throw new Error("You do not have permission to perform this action.");
  }
  return userId; // Return userId for convenience
};


// --- GET MACHINES: For the dropdown in the 'Add Report' form ---
// Only admins should need this list for adding reports.
export const getMachinesForSelect = query({
  handler: async (ctx) => {
    await ensureAdmin(ctx); // <-- Security Check
    const machines = await ctx.db.query("machines").order("asc").collect();
    
    // We only need the ID and name for the dropdown
    return machines.map((machine) => ({
      _id: machine._id,
      name: machine.name,
    }));
  },
});


// --- GENERATE UPLOAD URL: For the client to upload a file to storage ---
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await ensureAdmin(ctx); // <-- Security Check
    return await ctx.storage.generateUploadUrl();
  }
});


// --- CREATE REPORT: Creates the report document after a file is uploaded ---
export const addReport = mutation({
  args: {
    description: v.string(),
    machineId: v.id("machines"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ensureAdmin(ctx); // <-- Security Check

    await ctx.db.insert("reports", {
      description: args.description,
      machineId: args.machineId,
      fileStorageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploadedBy: userId, // Track who uploaded the report
    });
  },
});

// --- GET REPORTS: Fetches all reports with their machine info and file URL ---
export const getReports = query({
  handler: async (ctx) => {
    // Any authenticated user can view the list of reports
    const userId = await getAuthUserId(ctx);
    if (!userId) {
        return []; // Return empty array if not logged in
    }

    const reports = await ctx.db.query("reports").order("desc").collect();

    // Join report data with machine data and generate file URLs
    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const machine = await ctx.db.get(report.machineId);
        const fileUrl = await ctx.storage.getUrl(report.fileStorageId);

        return {
          ...report,
          machineName: machine?.name ?? "Unknown Machine", // Handle if machine was deleted
          fileUrl: fileUrl, // This URL is temporary and secure
        };
      })
    );

    return reportsWithDetails;
  },
});

// --- DELETE REPORT: Removes a report and its associated file from storage ---
export const remove = mutation({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx); // <-- Security Check

    // First, get the report document to find its fileStorageId
    const report = await ctx.db.get(args.id);
    if (!report) {
      // If the report is already deleted, we can just stop.
      console.warn(`Report with id ${args.id} not found for deletion.`);
      return; 
    }

    // Delete the associated file from Convex storage
    await ctx.storage.delete(report.fileStorageId);
    
    // Then, delete the report document from the database
    await ctx.db.delete(args.id);
  },
});