import { createFileRoute, redirect } from "@tanstack/react-router";

/** Email OTP replaced password sign-in. Old links land on the sign-in page. */
export const Route = createFileRoute("/user/auth/confirm-email")({
  beforeLoad: () => {
    throw redirect({ to: "/user/auth", replace: true });
  },
});
