import { createFileRoute } from "@tanstack/react-router";

/**
 * Legacy OAuth route — Better Auth handles social sign-in at
 * `/api/auth/sign-in/social` and callbacks at `/api/auth/callback/{provider}`.
 */
export const Route = createFileRoute("/api/auth/oauth/$provider")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.redirect(new URL("/user/auth", request.url), 302);
      },
    },
  },
});
