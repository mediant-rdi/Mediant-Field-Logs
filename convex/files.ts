// convex/files.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generates a short-lived URL for a client to upload a file to Convex storage.
 * This is used by the frontend right before uploading a user's selected file.
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    // This returns a temporary URL that the client can use to post a file to.
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Retrieves the public URL for a file that has already been stored.
 * This function is used to display images in the application, such as in the SubmissionDetailsModal.
 * It takes a storageId (the ID of the file in Convex) and returns its URL.
 */
export const getImageUrl = query({
  args: {
    // The argument is the ID of the file from the `_storage` table.
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // getUrl() returns a temporary, public URL for the given file.
    return await ctx.storage.getUrl(args.storageId);
  },
});