// The wire contract is defined once in /shared and consumed verbatim here so
// the client and server cannot drift. Add *client-only* helper types below.
export * from "@shared/types";
export * from "@shared/socketEvents";
export * from "@shared/notificationTypes";
