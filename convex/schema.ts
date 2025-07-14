// convex/schema.ts
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { machineCategory } from './shared'; // <-- IMPORTANT: Import the new source of truth

const approvalStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected')
);

const agreementType = v.union(
  v.literal('LEASE'),
  v.literal('COMPREHENSIVE'),
  v.literal('CONTRACT')
);

export default defineSchema({
  ...authTables,
  
  authAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("providerAndAccountId", ["provider", "providerAccountId"]),

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
    accountActivated: v.optional(v.boolean()),
  }).index('by_email', ['email']),

  invitations: defineTable({
    token: v.string(),
    email: v.string(),
    name: v.string(),
    isAdmin: v.boolean(),
    expiresAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),
    
  machines: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: machineCategory, // <-- Use the imported definition
  })
    .index('by_name', ['name'])
    .searchIndex('by_name_search', { searchField: 'name' })
    .index("by_category", ["category"]),

  reports: defineTable({
    description: v.string(),
    machineId: v.id("machines"),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    uploadedBy: v.id("users"),
  }).index("by_machineId", ["machineId"]),

  // --- MODIFIED: `serviceReports` table is updated ---
  serviceReports: defineTable({
    submittedBy: v.id("users"),

    // Store IDs for robust, relational data.
    clientId: v.id('clients'),
    locationId: v.id('clientLocations'),
    machineId: v.id('machines'),

    // Keep denormalized names for easy display and backward compatibility.
    // Rename `modelTypes` to `machineName` for consistency.
    branchLocation: v.string(),
    machineName: v.string(),

    complaintText: v.string(),
    solution: v.string(),
    problemType: v.union(v.literal('electrical'), v.literal('mechanical'), v.literal('software'), v.literal('service-delay'), v.literal('other')),
    backofficeAccess: v.boolean(),
    spareDelay: v.boolean(),
    delayedReporting: v.boolean(),
    communicationBarrier: v.boolean(),
    otherText: v.optional(v.string()),

    // Store an array of image storage IDs, allowing for multiple uploads.
    // The old `imageId` field is now deprecated for new submissions.
    // We make this optional to support old documents without this field.
    imageIds: v.optional(v.array(v.id('_storage'))),
    
    status: approvalStatus,
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    viewedBySubmitter: v.optional(v.boolean()),
  })
    .index("by_status", ["status"])
    .index("by_submittedBy", ["submittedBy"])
    .index("by_submitter_and_viewed", ["submittedBy", "status", "viewedBySubmitter"])
    .searchIndex("search_complaint_text", {
      searchField: "complaintText",
    })
    .index("by_branchLocation", ["branchLocation"])
    // Add new indexes for efficient querying by new relational IDs
    .index("by_client", ["clientId"])
    .index("by_location", ["locationId"])
    .index("by_machine", ["machineId"]),

  complaints: defineTable({
    submittedBy: v.id("users"),
    
    // Store IDs for robust, relational data.
    clientId: v.id('clients'),
    locationId: v.id('clientLocations'),
    machineId: v.id('machines'),

    // Keep denormalized names for easy display and backward compatibility.
    branchLocation: v.string(), 
    modelType: v.string(), 

    complaintText: v.string(),
    solution: v.string(),
    problemType: v.union(v.literal('equipment-fault'), v.literal('poor-experience'), v.literal('other')),
    fault_oldAge: v.boolean(),
    fault_frequentBreakdowns: v.boolean(),
    fault_undoneRepairs: v.boolean(),
    experience_paperJamming: v.boolean(),
    experience_noise: v.boolean(),
    experience_freezing: v.boolean(),
    experience_dust: v.boolean(),
    experience_buttonsSticking: v.boolean(),
    otherProblemDetails: v.string(),
    
    imageIds: v.optional(v.array(v.id('_storage'))),
    
    status: approvalStatus,
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    viewedBySubmitter: v.optional(v.boolean()),
  })
    .index("by_status", ["status"])
    .index("by_submittedBy", ["submittedBy"])
    .index("by_submitter_and_viewed", ["submittedBy", "status", "viewedBySubmitter"])
    .searchIndex("search_complaint_text", {
      searchField: "complaintText",
    })
    .index("by_branchLocation", ["branchLocation"])
    .index("by_client", ["clientId"])
    .index("by_location", ["locationId"])
    .index("by_machine", ["machineId"]),
    
  feedback: defineTable({
    clientId: v.id('clients'),
    machineId: v.id('machines'),
    
    clientName: v.string(),
    machineName: v.string(),

    feedbackDetails: v.string(),
    
    imageIds: v.array(v.id('_storage')),
    
    submittedBy: v.id("users"),
  })
  .index("by_client", ["clientId"])
  .index("by_machine", ["machineId"])
  .index("by_submittedBy", ["submittedBy"]),

  clients: defineTable({
    name: v.string(),
    searchName: v.string(),
    agreementType: agreementType,
  }).index("by_search_name", ["searchName"]),

  clientLocations: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    searchName: v.string(),
    fullName: v.string(),
    searchFullName: v.string(),
  })
    .index("by_client_and_search", ["clientId", "searchName"])
    .index("by_full_search_name", ["searchFullName"])
    .index("by_search_name", ["searchName"]),
});