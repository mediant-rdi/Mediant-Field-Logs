// convex/schema.ts
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { machineCategory } from './shared';
import { feedbackStatus } from './feedback';

const approvalStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected')
);

const resolutionStatus = v.union(
  v.literal('waiting'),
  v.literal('in_progress'),
  v.literal('resolved')
);

const agreementType = v.union(
  v.literal('LEASE'),
  v.literal('COMPREHENSIVE'),
  v.literal('CONTRACT')
);

const locationWithUser = v.object({
  latitude: v.number(),
  longitude: v.number(),
  capturedBy: v.id("users"),
  capturedAt: v.number(),
});

export default defineSchema({
  ...authTables,

  servicePeriods: defineTable({
    name: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    logsCreated: v.number(),
  })
  .index("by_isActive", ["isActive"]),

  systemSettings: defineTable({
    isServicePeriodActive: v.boolean(),
    currentServicePeriodId: v.optional(v.id("servicePeriods")),
    servicePeriodName: v.optional(v.string()),
    singleton: v.literal("global"),
  }).index("by_singleton", ["singleton"]),

  serviceLogs: defineTable({
    servicePeriodId: v.id("servicePeriods"),
    engineerId: v.id("users"), 
    locationId: v.id("clientLocations"),
    status: v.union(
      v.literal("Pending"),
      v.literal("In Progress"),
      v.literal("Finished")
    ),
    completionMethod: v.optional(v.union(
      v.literal("Planned Service"),
      v.literal("Call Log")
    )),
    completedByUserId: v.optional(v.id("users")),
    completedCallLogId: v.optional(v.id("callLogs")),
    completionNotes: v.optional(v.string()),
    jobStartTime: v.optional(v.number()), 
    jobEndTime: v.optional(v.number()),   
    startLocation: v.optional(locationWithUser),
    endLocation: v.optional(locationWithUser),
    // MODIFICATION: Added field to track which user started the job.
    startedByUserId: v.optional(v.id("users")),
  })
  .index("by_engineer_and_period", ["engineerId", "servicePeriodId"])
  .index("by_location_and_period", ["locationId", "servicePeriodId"])
  .index("by_period", ["servicePeriodId"]),

  callLogs: defineTable({
    locationId: v.id("clientLocations"), 
    issue: v.string(),
    engineerIds: v.array(v.id("users")), 
    status: v.string(), 
    statusTimestamp: v.number(),
    searchField: v.optional(v.string()),
    acceptedBy: v.optional(v.array(v.id("users"))),
    viewedByEngineers: v.optional(v.array(v.id("users"))),
    startLocation: v.optional(locationWithUser),
    jobStartTime: v.optional(v.number()),
    endLocation: v.optional(locationWithUser),
    jobEndTime: v.optional(v.number()),
    isEscalated: v.optional(v.boolean()),
    escalatedJobStartTime: v.optional(v.number()),
    escalatedStartLocation: v.optional(locationWithUser),
    engineersAtEscalation: v.optional(v.number()),
  })
  .index("by_location", ["locationId"])
  .index("by_status", ["status"])
  .searchIndex("by_search", { searchField: "searchField" })
  .index("by_engineer", ["engineerIds"])
  .index("by_engineer_and_status", ["engineerIds", "status"]),


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
    canAccessCallLogs: v.optional(v.boolean()),
    canAccessManagementDashboard: v.optional(v.boolean()),
    accountActivated: v.optional(v.boolean()),
    searchName: v.optional(v.string()),
    serviceLocationIds: v.optional(v.array(v.id("clientLocations"))),
    taggedTeamMemberIds: v.optional(v.array(v.id("users"))),
  })
    .index('by_email', ['email'])
    .index("by_search_name", ["searchName"])
    .searchIndex("by_name_search", { searchField: "name" }),
  
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
    category: machineCategory,
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

  manuals: defineTable({
    description: v.string(),
    machineId: v.id("machines"),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    uploadedBy: v.id("users"),
  }).index("by_machineId", ["machineId"]),

  serviceReports: defineTable({
    submittedBy: v.id("users"),
    clientId: v.id('clients'),
    locationId: v.id('clientLocations'),
    machineId: v.id('machines'),
    branchLocation: v.string(),
    machineName: v.string(),
    machineSerialNumber: v.optional(v.string()),
    complaintText: v.string(),
    solution: v.string(),
    problemType: v.union(v.literal('electrical'), v.literal('mechanical'), v.literal('software'), v.literal('service-delay'), v.literal('other')),
    backofficeAccess: v.boolean(),
    spareDelay: v.boolean(),
    delayedReporting: v.boolean(),
    communicationBarrier: v.boolean(),
    otherText: v.optional(v.string()),
    imageIds: v.optional(v.array(v.id('_storage'))),
    status: approvalStatus,
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    viewedBySubmitter: v.optional(v.boolean()),
    resolutionStatus: v.optional(v.union(resolutionStatus, v.null())),
    otherActionsProvided: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_submittedBy", ["submittedBy"])
    .index("by_submitter_and_viewed", ["submittedBy", "status", "viewedBySubmitter"])
    .searchIndex("search_complaint_text", { searchField: "complaintText" })
    .index("by_branchLocation", ["branchLocation"])
    .index("by_client", ["clientId"])
    .index("by_location", ["locationId"])
    .index("by_machine", ["machineId"])
    .searchIndex("search_branchLocation", { searchField: "branchLocation" })
    .searchIndex("search_machineName", { searchField: "machineName" })
    .searchIndex("search_machineSerialNumber", { searchField: "machineSerialNumber" }),

  complaints: defineTable({
    submittedBy: v.id("users"),
    clientId: v.id('clients'),
    locationId: v.id('clientLocations'),
    machineId: v.id('machines'),
    branchLocation: v.string(), 
    modelType: v.string(), 
    machineSerialNumber: v.optional(v.string()),
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
    resolutionStatus: v.optional(v.union(resolutionStatus, v.null())),
    otherActionsProvided: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_submittedBy", ["submittedBy"])
    .index("by_submitter_and_viewed", ["submittedBy", "status", "viewedBySubmitter"])
    .searchIndex("search_complaint_text", { searchField: "complaintText" })
    .index("by_branchLocation", ["branchLocation"])
    .index("by_client", ["clientId"])
    .index("by_location", ["locationId"])
    .index("by_machine", ["machineId"])
    .searchIndex("search_branchLocation", { searchField: "branchLocation" })
    .searchIndex("search_modelType", { searchField: "modelType" })
    .searchIndex("search_machineSerialNumber", { searchField: "machineSerialNumber" }),
    
  feedback: defineTable({
    clientId: v.optional(v.id('clients')),
    clientName: v.optional(v.string()),
    machineId: v.id('machines'),
    machineName: v.string(),
    feedbackDetails: v.string(),
    imageIds: v.array(v.id('_storage')),
    submittedBy: v.id("users"),
    status: feedbackStatus,
    feedbackSource: v.union(v.literal('customer'), v.literal('engineer')),
    actionTaken: v.optional(v.string()),
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
    .index("by_search_name", ["searchName"])
    .searchIndex("by_full_name_text", { searchField: "fullName", }),
});