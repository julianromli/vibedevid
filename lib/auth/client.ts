import { createAuthClient } from "better-auth/react";

function getAuthBaseUrl(): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const viteUrl = import.meta.env.VITE_BETTER_AUTH_URL;
    if (typeof viteUrl === "string" && viteUrl.length > 0) {
      return viteUrl;
    }
    const siteUrl = import.meta.env.VITE_SITE_URL;
    if (typeof siteUrl === "string" && siteUrl.length > 0) {
      return siteUrl;
    }
  }
  return "";
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
