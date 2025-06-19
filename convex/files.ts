// convex/files.ts
import { mutation } from "./_generated/server";

// This mutation doesn't need any arguments.
// It's a simple, secure way for the client to ask for an upload URL.
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    // This returns a temporary URL that the client can use to post a file to.
    return await ctx.storage.generateUploadUrl();
  },
});