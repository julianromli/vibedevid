import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { USER_ROLE } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/server/auth";

export const ROLES = {
  ADMIN: USER_ROLE.ADMIN,
  MODERATOR: USER_ROLE.MODERATOR,
  USER: USER_ROLE.USER,
} as const;

/**
 * Server-only admin gate. Wrapped in `createServerFn` so the server-only
 * auth helpers never execute (or get bundled) on the client when
 * `beforeLoad` re-runs during client-side navigation.
 */
export const resolveAdminUser = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw redirect({ to: "/user/auth" });
  }

  if (user.role !== ROLES.ADMIN) {
    throw redirect({ to: "/" });
  }

  return { user };
});
