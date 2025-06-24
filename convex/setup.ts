// convex/setup.ts
import { internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

export const createFirstAdmin = internalAction({
    args: {
        name: v.string(),
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, { name, email, password }) => {

        // Check if any users already exist
        const users = await ctx.runQuery(internal.users._getAllUsers);
        if (users.length > 0) {
            return "Cannot create first admin: Users already exist in the system.";
        }

        console.log("No existing users found. Proceeding to create first admin...");

        // Step 1: Create the user account using the auth sign-up flow.
        // This cleanly creates both the `users` and `identities` records.
        try {
            await ctx.runAction(api.auth.signIn, {
                provider: "password",
                params: {
                    email,
                    password,
                    flow: "signUp",
                }
            });
            console.log(`Successfully ran auth.signIn for ${email}`);
        } catch (error) {
            console.error("Error during auth.signIn:", error);
            // Don't throw here, as the user might still have been created.
        }

        // Step 2: Find the user that was just created.
        const newUser = await ctx.runQuery(internal.users._getUserByEmail, { email });

        if (!newUser) {
            throw new Error("Critical error: User was not found by email after sign-up.");
        }
        
        console.log(`Found newly created user with ID: ${newUser._id}`);

        // Step 3: Patch the new user to make them an activated admin.
        await ctx.runMutation(internal.setup._makeUserAdmin, {
            userId: newUser._id,
            name,
        });
        
        console.log(`Successfully promoted ${email} to admin.`);
        
        return `Successfully created admin user: ${email}`;
    },
});

// Helper mutation for the action above
export const _makeUserAdmin = internalMutation({
    args: { userId: v.id("users"), name: v.string() },
    handler: async (ctx, { userId, name }) => {
        await ctx.db.patch(userId, {
            name: name,
            isAdmin: true,
            accountActivated: true,
        });
    },
});