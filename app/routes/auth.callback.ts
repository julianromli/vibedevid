import { createFileRoute } from "@tanstack/react-router";

/**
 * Legacy Supabase OAuth callback — Better Auth handles callbacks at
 * `/api/auth/callback/{provider}`.
 */
export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.redirect(new URL("/", request.url), 302);
      },
    },
  },
});
