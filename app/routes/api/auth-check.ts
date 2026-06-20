import { createFileRoute } from "@tanstack/react-router";
import { getSafeRedirectPath } from "@/lib/auth/credentials";
import { getServerSession } from "@/lib/server/auth";

const DEFAULT_REDIRECT = "/blog/editor";

export const Route = createFileRoute("/api/auth-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);

        const safePath = getSafeRedirectPath(searchParams.get("redirectTo"));
        const redirectTo = safePath === "/" ? DEFAULT_REDIRECT : safePath;

        const session = await getServerSession();

        if (!session?.user) {
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
