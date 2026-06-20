import { createFileRoute } from "@tanstack/react-router";
import { signInWithCredentials } from "@/lib/auth/credentials";
import { redirectFromAuthResult } from "@/lib/auth/redirects";

export const Route = createFileRoute("/api/auth/sign-in")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData();
        const result = await signInWithCredentials(formData, request.headers);
        return redirectFromAuthResult(request, formData, result);
      },
    },
  },
});
