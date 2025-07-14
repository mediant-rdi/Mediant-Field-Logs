// convex/files.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

// --- NEW QUERY TO FETCH MULTIPLE URLs ---
/**
 * Takes an array of storage IDs and returns an array of their corresponding URLs.
 * This is more efficient than calling getImageUrl multiple times.
 */
export const getMultipleImageUrls = query({
  args: {
    storageIds: v.array(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    // If the array of IDs is empty, return an empty array immediately.
    if (args.storageIds.length === 0) {
      return [];
    }
    // Use Promise.all to fetch all URLs in parallel for maximum efficiency.
    const urls = await Promise.all(
      args.storageIds.map((storageId) => ctx.storage.getUrl(storageId))
    );
    // Filter out any potential null URLs to ensure the return type is string[].
    return urls.filter((url): url is string => url !== null);
  },
});