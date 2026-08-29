import { createServerFn } from "@tanstack/react-start";
import { getServerLocale } from "@/lib/locale";

/**
 * Resolve the request locale from the locale cookie. Safe to call from
 * `beforeLoad` on the server and the client; the cookie is read server-side.
 */
export const getLocaleFn = createServerFn({ method: "GET" }).handler(async () => {
  return getServerLocale();
});
