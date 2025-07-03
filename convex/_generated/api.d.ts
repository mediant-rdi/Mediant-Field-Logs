/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as clients from "../clients.js";
import type * as complaints from "../complaints.js";
import type * as dashboard from "../dashboard.js";
import type * as data from "../data.js";
import type * as feedback from "../feedback.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as machines from "../machines.js";
import type * as notifications from "../notifications.js";
import type * as passwordResets from "../passwordResets.js";
import type * as reports from "../reports.js";
import type * as serviceReports from "../serviceReports.js";
import type * as setup from "../setup.js";
import type * as shared from "../shared.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  clients: typeof clients;
  complaints: typeof complaints;
  dashboard: typeof dashboard;
  data: typeof data;
  feedback: typeof feedback;
  files: typeof files;
  http: typeof http;
  invitations: typeof invitations;
  machines: typeof machines;
  notifications: typeof notifications;
  passwordResets: typeof passwordResets;
  reports: typeof reports;
  serviceReports: typeof serviceReports;
  setup: typeof setup;
  shared: typeof shared;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
