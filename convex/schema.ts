// convex/schema.ts
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { machineCategory } from './shared';

const approvalStatus = v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'));
const agreementType = v.union(v.literal('LEASE'), v.literal('COMPREHENSIVE'), v.literal('CONTRACT'));


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
    invitationToken: v.optional(v.string()),
    invitationExpiresAt: v.optional(v.number()),
    invitationSent: v.optional(v.boolean()),
    accountActivated: v.optional(v.boolean()),
  })
    .index('by_email', ['email'])
    .index('by_username', ['name'])
    .index('by_invitation_token', ['invitationToken']), // <-- ADD THIS INDEX FOR FASTER LOOKUPS

  machines: defineTable({ 
    name: v.string(), 
    description: v.optional(v.string()),
    category: machineCategory,
  })
    .index('by_name', ['name'])
    .searchIndex('by_name_search', { searchField: 'name' })
    .index("by_category", ["category"]),
  
  serviceReports: defineTable({ 
    submittedBy: v.id("users"), 
    modelTypes: v.string(), 
    branchLocation: v.string(), 
    complaintText: v.string(), 
    solution: v.string(), 
    problemType: v.union(v.literal('electrical'), v.literal('mechanical'), v.literal('software'), v.literal('service-delay'), v.literal('other')), 
    backofficeAccess: v.boolean(), 
    spareDelay: v.boolean(), 
    delayedReporting: v.boolean(), 
    communicationBarrier: v.boolean(), 
    otherText: v.optional(v.string()), 
    imageId: v.optional(v.id('_storage')), 
    status: approvalStatus, 
    approvedBy: v.optional(v.id("users")), 
    approvedAt: v.optional(v.number()),
    viewedBySubmitter: v.optional(v.boolean()),
  })
    .index("by_status", ["status"])
    .index("by_submittedBy", ["submittedBy"])
    .index("by_submitter_and_viewed", ["submittedBy", "status", "viewedBySubmitter"]),

  complaints: defineTable({ 
    submittedBy: v.id("users"),
    modelType: v.string(), 
    branchLocation: v.string(), 
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
    imageId: v.optional(v.id('_storage')), 
    status: approvalStatus, 
    approvedBy: v.optional(v.id("users")), 
    approvedAt: v.optional(v.number()), 
    viewedBySubmitter: v.optional(v.boolean()),
  })
    .index("by_status", ["status"])
    .index("by_submittedBy", ["submittedBy"])
    .index("by_submitter_and_viewed", ["submittedBy", "status", "viewedBySubmitter"]),

  feedback: defineTable({ branchLocation: v.string(), modelType: v.string(), feedbackDetails: v.string(), imageId: v.optional(v.id('_storage')), }).index("by_branch_and_model", ["branchLocation", "modelType"]),
  
  clients: defineTable({ name: v.string(), searchName: v.string(), agreementType: agreementType, }).index("by_search_name", ["searchName"]),
  
  clientLocations: defineTable({ clientId: v.id("clients"), name: v.string(), searchName: v.string(), fullName: v.string(), searchFullName: v.string(), }).index("by_client_and_search", ["clientId", "searchName"]).index("by_full_search_name", ["searchFullName"]),
});