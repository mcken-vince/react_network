// The wire contract is defined once in /shared and consumed verbatim here so
// the client and server cannot drift. Add *client-only* helper types below.
export * from "@shared/types";
export * from "@shared/socketEvents";
export * from "@shared/notificationTypes";

/** Field → message map used by client forms. `general` feeds the banner. */
export type FormErrors = Record<string, string | undefined>;
