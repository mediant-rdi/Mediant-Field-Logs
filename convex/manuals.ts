// convex/manuals.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Creates a new machine manual. Only accessible by admin users.
 * @param machineId - The ID of the machine this manual is for.
 * @param description - A description of the manual.
 * @param fileStorageId - The ID of the uploaded file in Convex storage.
 * @param fileName - The name of the uploaded file.
 * @param fileType - The MIME type of the uploaded file.
 */
export const createManual = mutation({
  args: {
    machineId: v.id("machines"),
    description: v.string(),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    // Manually check for admin privileges
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to create a manual.");
    }
    const user = await ctx.db.get(userId);
    if (!user || !user.isAdmin) {
      throw new Error("You must be an admin to perform this action.");
    }

    // Insert the new manual record into the database.
    await ctx.db.insert("manuals", {
      machineId: args.machineId,
      description: args.description,
      fileStorageId: args.fileStorageId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploadedBy: user._id, // Use the admin user's ID
    });
  },
});

/**
 * Retrieves all machine manuals, enriched with related data.
 * Accessible by any authenticated user.
 * Joins data from `machines` and `users` tables to provide names.
 * FIX: This query now fetches file URLs for every manual upfront for better compatibility.
 */
export const getManuals = query({
  handler: async (ctx) => {
    // Ensure user is authenticated to view manuals.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to view manuals.");
    }
    
    // Fetch all manuals, ordered by creation time (newest first).
    const manuals = await ctx.db.query("manuals").order("desc").collect();

    // Enrich each manual with related data AND the file URL.
    const manualsWithDetails = await Promise.all(
      manuals.map(async (manual) => {
        const machine = await ctx.db.get(manual.machineId);
        const uploader = await ctx.db.get(manual.uploadedBy);
        // Fetch the file URL for each manual record.
        const fileUrl = await ctx.storage.getUrl(manual.fileStorageId);

        return {
          ...manual,
          // Provide fallback names in case related documents are deleted
          machineName: machine?.name ?? "Unknown Machine",
          uploaderName: uploader?.name ?? uploader?.email ?? "Unknown Uploader",
          // Include the fileUrl in the main query result.
          fileUrl: fileUrl,
        };
      })
    );

    return manualsWithDetails;
  },
});


/**
 * Deletes a machine manual and its associated file from storage.
 * Only accessible by admin users.
 * @param id - The ID of the manual to remove.
 */
export const remove = mutation({
  args: { id: v.id("manuals") },
  handler: async (ctx, args) => {
    // Manually check for admin privileges
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to delete a manual.");
    }
    const user = await ctx.db.get(userId);
    if (!user || !user.isAdmin) {
      throw new Error("You must be an admin to perform this action.");
    }

    // Get the manual document to access its file storage ID.
    const manual = await ctx.db.get(args.id);
    if (!manual) {
      throw new Error("Manual not found.");
    }

    // First, delete the file from storage to prevent orphaned files.
    await ctx.storage.delete(manual.fileStorageId);

    // Then, delete the manual record from the database.
    await ctx.db.delete(args.id);
  },
});