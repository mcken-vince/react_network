import { createRouter } from "@tanstack/react-router";
import RouteError from "./components/common/RouteError";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultErrorComponent: RouteError,
  defaultPendingMinMs: 500,
  defaultPendingMs: 1000,
  context: {
    // Add any global context here if needed
  },
  defaultStaleTime: 0,
});

// Register the router instance for maximum type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
