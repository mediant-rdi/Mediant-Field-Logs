// convex/schema.ts
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Define a reusable status type for the approval workflow
const approvalStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected')
);

// --- ADDED: Reusable type for Client Agreement as per AddClientForm.tsx ---
const agreementType = v.union(
  v.literal('LEASE'),
  v.literal('COMPREHENSIVE'),
  v.literal('CONTRACT')
);

export default defineSchema({
  // --- Existing Tables ---
  ...authTables,
  users: defineTable({
    // --- Existing User Fields ---
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),

    // --- NEW INVITATION FIELDS (as per the guide) ---
    invitationToken: v.optional(v.string()),
    invitationExpiresAt: v.optional(v.number()), // Stored as a Unix timestamp (milliseconds)
    invitationSent: v.optional(v.boolean()),     // To identify invited (but not activated) users
    accountActivated: v.optional(v.boolean()),   // To mark the invitation as used
  })
    .index('by_email', ['email'])
    .index('by_username', ['name']),

  // ... (The rest of your schema tables)
  machines: defineTable({ name: v.string(), description: v.optional(v.string()), }).index('by_name', ['name']).searchIndex('by_name_search', { searchField: 'name', }),
  serviceReports: defineTable({ submittedBy: v.id("users"), modelTypes: v.string(), branchLocation: v.string(), complaintText: v.string(), solution: v.string(), problemType: v.union(v.literal('electrical'), v.literal('mechanical'), v.literal('software'), v.literal('service-delay'), v.literal('other')), backofficeAccess: v.boolean(), spareDelay: v.boolean(), delayedReporting: v.boolean(), communicationBarrier: v.boolean(), otherText: v.optional(v.string()), imageId: v.optional(v.id('_storage')), status: approvalStatus, approvedBy: v.optional(v.id("users")), approvedAt: v.optional(v.number()), }).index("by_status", ["status"]).index("by_submittedBy", ["submittedBy"]),
  complaints: defineTable({ modelType: v.string(), branchLocation: v.string(), complaintText: v.string(), solution: v.string(), problemType: v.union(v.literal('equipment-fault'), v.literal('poor-experience'), v.literal('other')), fault_oldAge: v.boolean(), fault_frequentBreakdowns: v.boolean(), fault_undoneRepairs: v.boolean(), experience_paperJamming: v.boolean(), experience_noise: v.boolean(), experience_freezing: v.boolean(), experience_dust: v.boolean(), experience_buttonsSticking: v.boolean(), otherProblemDetails: v.optional(v.string()), imageId: v.optional(v.id('_storage')), status: approvalStatus, approvedBy: v.optional(v.id("users")), approvedAt: v.optional(v.number()), }).index("by_status", ["status"]),
  feedback: defineTable({ branchLocation: v.string(), modelType: v.string(), feedbackDetails: v.string(), imageId: v.optional(v.id('_storage')), }).index("by_branch_and_model", ["branchLocation", "modelType"]),
  clients: defineTable({ name: v.string(), searchName: v.string(), agreementType: agreementType, }).index("by_search_name", ["searchName"]),
  clientLocations: defineTable({ clientId: v.id("clients"), name: v.string(), searchName: v.string(), fullName: v.string(), searchFullName: v.string(), }).index("by_client_and_search", ["clientId", "searchName"]).index("by_full_search_name", ["searchFullName"]),
});