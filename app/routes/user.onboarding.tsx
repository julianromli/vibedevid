import { createFileRoute, redirect } from "@tanstack/react-router";
import OnboardingPage from "@/app/user/onboarding/page";
import { getOnboardingStateFn } from "@/lib/actions/onboarding.functions";
import { getSafeRedirectPath } from "@/lib/auth/redirect-path";
import { NOINDEX_META } from "@/lib/seo/site-url";

export const Route = createFileRoute("/user/onboarding")({
  validateSearch: (search: Record<string, unknown>): { redirectTo?: string } => ({
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }),
  loaderDeps: ({ search }) => ({ redirectTo: search.redirectTo }),
  loader: async ({ deps }) => {
    const state = await getOnboardingStateFn();
    if (!state) throw redirect({ to: "/user/auth", search: { redirectTo: deps.redirectTo } });
    if (state.claimed)
      throw redirect({ href: getSafeRedirectPath(deps.redirectTo), replace: true });
    return state;
  },
  head: () => ({
    meta: [{ title: "Pilih username | VibeDev ID" }, NOINDEX_META],
  }),
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const { suggestion } = Route.useLoaderData();
  const { redirectTo } = Route.useSearch();
  return <OnboardingPage suggestion={suggestion} redirectTo={redirectTo} />;
}
