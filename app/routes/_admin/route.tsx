import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayoutClient from "@/app/(admin)/layout-client";
import { resolveAdminUser } from "@/lib/auth/admin-gate";
import { NOINDEX_META } from "@/lib/seo/site-url";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    return resolveAdminUser();
  },
  head: () => ({
    meta: [NOINDEX_META],
  }),
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const { user } = Route.useRouteContext();

  return (
    <DashboardLayoutClient user={user}>
      <Outlet />
    </DashboardLayoutClient>
  );
}
