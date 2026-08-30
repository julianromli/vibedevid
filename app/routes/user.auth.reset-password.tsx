import { createFileRoute } from "@tanstack/react-router";
import ResetPasswordPage from "@/app/user/auth/reset-password/page";
import { NOINDEX_META } from "@/lib/seo/site-url";

export const Route = createFileRoute("/user/auth/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password | VibeDev ID" }, NOINDEX_META],
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  return <ResetPasswordPage />;
}
