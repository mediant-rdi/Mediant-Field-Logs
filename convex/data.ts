// convex/data.ts
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Normalizes a string for searching.
 * Converts to lowercase, removes punctuation, and trims extra whitespace.
 * This MUST be identical to the one in `clients.ts` to ensure consistency.
 */
const normalizeName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with a single one
    .trim();
};

// Define the expected agreement types to match your schema
const agreementType = v.union(
  v.literal('LEASE'),
  v.literal('COMPREHENSIVE'),
  v.literal('CONTRACT')
);

// Define the shape of the data we expect from our cleaned_customers.json file.
// This acts as a validator when we run the function.
const clientSeedSchema = v.object({
    name: v.string(),
    agreementType: agreementType,
    branches: v.array(v.string())
});

/**
 * An internal mutation to seed the database from a cleaned JSON file.
 * This can only be run from the Convex dashboard, not from the client.
 */
export const seedDatabase = internalMutation({
  // Define the arguments this mutation accepts.
  // We'll pass the entire content of cleaned_customers.json as this array.
  args: {
    clients: v.array(clientSeedSchema)
  },

  handler: async (ctx, { clients }) => {
    let clientCount = 0;
    let locationCount = 0;
    let skippedClientCount = 0;
    
    console.log(`Starting database seed with ${clients.length} client records...`);

    // --- Optional: Clear existing data ---
    // Uncomment these lines ONLY if you want to wipe the tables clean before seeding.
    // WARNING: This is destructive. Be very careful, especially if you have existing data.
    /*
    console.log("Clearing existing clients and locations...");
    const existingLocations = await ctx.db.query("clientLocations").collect();
    await Promise.all(existingLocations.map(l => ctx.db.delete(l._id)));
    const existingClients = await ctx.db.query("clients").collect();
    await Promise.all(existingClients.map(c => ctx.db.delete(c._id)));
    console.log("Existing data cleared.");
    */

    for (const clientData of clients) {
        // --- 1. Create the Client Record ---
        const searchName = normalizeName(clientData.name);
        
        // Check if a client with this *exact* search name already exists.
        // This prevents creating duplicate "Family Bank" entries.
        const existing = await ctx.db
          .query("clients")
          .withIndex("by_search_name", q => q.eq("searchName", searchName))
          .first();

        // If a client already exists, we skip it to prevent duplicates.
        if (existing) {
            console.warn(`Client "${clientData.name}" already exists (searchName: "${searchName}"). Skipping.`);
            skippedClientCount++;
            continue;
        }

        const clientId = await ctx.db.insert("clients", {
            name: clientData.name,
            searchName: searchName,
            agreementType: clientData.agreementType,
        });
        clientCount++;

        // --- 2. Create its Location (Branch) Records ---
        // This loop will run for every branch in the "branches" array.
        // If "branches" is empty, the loop is skipped, which is the correct behavior.
        for (const branchName of clientData.branches) {
            const fullName = `${clientData.name} - ${branchName}`;
            
            await ctx.db.insert("clientLocations", {
                clientId: clientId,
                name: branchName, // The individual branch name, e.g., "Mtwapa"
                fullName: fullName, // e.g., "IMARIKA SACCO - Mtwapa"
                searchName: normalizeName(branchName), // e.g., "mtwapa"
                searchFullName: normalizeName(fullName), // e.g., "imarika sacco mtwapa"
            });
            locationCount++;
        }
    }
    
    const summary = `Seeding complete. Added: ${clientCount} new clients and ${locationCount} new locations. Skipped: ${skippedClientCount} duplicate clients.`;
    console.log(summary);
    return summary;
  },
});