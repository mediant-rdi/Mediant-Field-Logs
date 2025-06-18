import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    
    
    isAdmin: v.optional(v.boolean()),
  })
    .index('by_email', ['email'])
    .index('by_username', ['name']),


  machines: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  })

  .index("by_name", ["name"]),
});