import { mutation } from './_generated/server';

export const createDummyUsers = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Create regular user
      const userId = await ctx.db.insert('users', {
        name: "testuser",
        email: "user@test.com",
        //role: "user",
      });

      // Create admin user
      const adminId = await ctx.db.insert('users', {
        name: "testadmin",
        email: "admin@test.com",
       // role: "admin",
      });

      return {
        success: true,
        users: [
          { id: userId, email: "user@test.com", role: "user" },
          { id: adminId, email: "admin@test.com", role: "admin" }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to create users: ${(error as Error).message}`);
    }
  },
});
