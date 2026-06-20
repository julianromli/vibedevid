import { createFileRoute } from "@tanstack/react-router";
import { getSafeRedirectPath } from "@/lib/auth/credentials";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT = "/blog/editor";

export const Route = createFileRoute("/api/auth-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);

        // Prevent open redirects via the canonical guard. Falls back to the
        // editor when the requested path is missing or unsafe.
        const safePath = getSafeRedirectPath(searchParams.get("redirectTo"));
        const redirectTo = safePath === "/" ? DEFAULT_REDIRECT : safePath;

        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return Response.redirect(
            new URL(`/user/auth?redirectTo=${encodeURIComponent(redirectTo)}`, request.url),
            302,
          );
        }

        return Response.redirect(new URL(redirectTo, request.url), 302);
      },
    },
  },
});
