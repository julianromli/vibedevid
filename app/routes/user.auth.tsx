import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "@/app/user/auth/page";
import { NOINDEX_META } from "@/lib/seo/site-url";

export type AuthSearch = { redirectTo?: string; step?: "code" };

export const Route = createFileRoute("/user/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
    step: search.step === "code" ? "code" : undefined,
  }),
  head: () => ({
    meta: [{ title: "Masuk | VibeDev ID" }, NOINDEX_META],
  }),
  component: UserAuthRoute,
});

function UserAuthRoute() {
  const { step, redirectTo } = Route.useSearch();
  return <AuthPage step={step} redirectTo={redirectTo} />;
}
