import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "@/app/user/auth/page";
import { NOINDEX_META } from "@/lib/seo/site-url";

type AuthMode = "signin" | "signup" | "reset";

function parseAuthMode(value: unknown): AuthMode | undefined {
  if (value === "signup" || value === "reset" || value === "signin") return value;
  return undefined;
}

export const Route = createFileRoute("/user/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirectTo?: string; success?: string; error?: string; mode?: AuthMode } => ({
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
    success: typeof search.success === "string" ? search.success : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    mode: parseAuthMode(search.mode),
  }),
  head: () => ({
    meta: [{ title: "Masuk / Daftar | VibeDev ID" }, NOINDEX_META],
  }),
  component: UserAuthRoute,
});

function UserAuthRoute() {
  return <AuthPage />;
}
