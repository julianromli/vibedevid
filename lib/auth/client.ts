import { createAuthClient } from "better-auth/react";
import { resolveAuthClientBaseUrl } from "@/lib/auth/origins";

function getAuthBaseUrl(): string {
  const configuredUrls: Array<string | undefined> = [];
  if (typeof import.meta !== "undefined" && import.meta.env) {
    configuredUrls.push(import.meta.env.VITE_BETTER_AUTH_URL, import.meta.env.VITE_SITE_URL);
  }

  const pageOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
  return resolveAuthClientBaseUrl({ pageOrigin, configuredUrls });
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
