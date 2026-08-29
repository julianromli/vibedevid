import { createRouter } from "@tanstack/react-router";
import { DefaultRouteError } from "@/components/errors/default-route-error";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultErrorComponent: DefaultRouteError,
    defaultOnCatch: (error, _errorInfo) => {
      console.error("Router error:", error);
    },
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
