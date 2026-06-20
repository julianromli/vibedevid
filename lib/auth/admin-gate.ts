import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "@/lib/actions/user";

export const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const;

/**
 * Server-only admin gate. Wrapped in `createServerFn` so the server-only
 * Supabase client never executes (or gets bundled) on the client when
 * `beforeLoad` re-runs during client-side navigation.
 */
export const resolveAdminUser = createServerFn({ method: "GET" }).handler(async () => {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    throw redirect({ to: "/user/auth" });
  }

  if (user.role !== ROLES.ADMIN) {
    throw redirect({ to: "/" });
  }

  return { user };
});
