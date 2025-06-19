import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Define a reusable status type for the approval workflow
const approvalStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected')
);

export default defineSchema({
  // --- Existing Tables ---
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

  // --- UPDATED: machines table with a search index ---
  machines: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  })
  .index('by_name', ['name'])
  // Add this search index for the autocomplete feature
  .searchIndex('by_name_search', {
    searchField: 'name',
  }),

  // --- UPDATED: Table for the Service Delay & Complaint Form ---
  serviceReports: defineTable({
    // --- ADDED ---
    // The ID of the user who submitted the report. This is now mandatory.
    submittedBy: v.id("users"), 
    
    // Common fields
    modelTypes: v.string(),
    branchLocation: v.string(),
    complaintText: v.string(),
    solution: v.string(),
    
    // Dropdown selection
    problemType: v.union(
      v.literal('electrical'),
      v.literal('mechanical'),
      v.literal('software'),
      v.literal('service-delay'),
      v.literal('other')
    ),
    
    // Checkboxes for 'service-delay'
    backofficeAccess: v.boolean(),
    spareDelay: v.boolean(),
    delayedReporting: v.boolean(),
    communicationBarrier: v.boolean(),

    // Textbox for 'other'
    otherText: v.optional(v.string()),

    // Optional image
    imageId: v.optional(v.id('_storage')),

    // Approval Workflow Fields
    status: approvalStatus,
    approvedBy: v.optional(v.id("users")), // ID of the admin who approved/rejected
    approvedAt: v.optional(v.number()),
  })
  .index("by_status", ["status"])
  .index("by_submittedBy", ["submittedBy"]), // Index to find reports by user

  // --- UPDATED: Table for the Complaint Logging Form ---
  complaints: defineTable({
    // Common fields
    modelType: v.string(),
    branchLocation: v.string(),
    complaintText: v.string(),
    solution: v.string(),

    // Dropdown selection
    problemType: v.union(
      v.literal('equipment-fault'),
      v.literal('poor-experience'),
      v.literal('other')
    ),

    // Checkboxes for 'equipment-fault'
    fault_oldAge: v.boolean(),
    fault_frequentBreakdowns: v.boolean(),
    fault_undoneRepairs: v.boolean(),
    
    // Checkboxes for 'poor-experience'
    experience_paperJamming: v.boolean(),
    experience_noise: v.boolean(),
    experience_freezing: v.boolean(),
    experience_dust: v.boolean(),
    experience_buttonsSticking: v.boolean(),

    // Textbox for 'other'
    otherProblemDetails: v.optional(v.string()),

    // Optional image
    imageId: v.optional(v.id('_storage')),

    // Approval Workflow Fields
    status: approvalStatus,
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
  })
  .index("by_status", ["status"]),
  
  // --- UNCHANGED: Table for the Customer Feedback Form ---
  feedback: defineTable({
    branchLocation: v.string(),
    modelType: v.string(),
    feedbackDetails: v.string(),
    imageId: v.optional(v.id('_storage')),
  })
  .index("by_branch_and_model", ["branchLocation", "modelType"]),
});