import { createFileRoute } from "@tanstack/react-router";
import ConfirmEmailPage from "@/app/user/auth/confirm-email/page";
import { NOINDEX_META } from "@/lib/seo/site-url";

export const Route = createFileRoute("/user/auth/confirm-email")({
  head: () => ({
    meta: [{ title: "Konfirmasi Email | VibeDev ID" }, NOINDEX_META],
  }),
  component: ConfirmEmailRoute,
});

function ConfirmEmailRoute() {
  return <ConfirmEmailPage />;
}
