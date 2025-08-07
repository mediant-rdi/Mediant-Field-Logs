import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper function MUST be identical to the one in users.ts
const normalizeNameForSearch = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
};

/**
 * A one-time migration to backfill the `searchName` field for all existing users.
 * Run this function once from the Convex dashboard after deploying the schema change.
 */
export const backfillUserSearchNames = internalMutation({
  handler: async (ctx) => {
    // 1. Get all users from the database.
    const allUsers = await ctx.db.query("users").collect();

    let updatedCount = 0;

    // 2. Create a list of update promises.
    const updatePromises = allUsers.map(async (user) => {
      // 3. Only update if the user has a name and `searchName` is missing.
      if (user.name && !user.searchName) {
        const searchName = normalizeNameForSearch(user.name);
        
        // 4. Patch the document with the new field.
        await ctx.db.patch(user._id, { searchName });
        
        updatedCount++;
      }
    });

    // 5. Execute all updates concurrently.
    await Promise.all(updatePromises);

    const resultMessage = `Migration complete. Updated ${updatedCount} user documents.`;
    console.log(resultMessage);
    return resultMessage;
  },
});