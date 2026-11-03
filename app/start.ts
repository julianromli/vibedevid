import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

// start.ts is part of the client entry. The `.server()` callbacks are stripped
// from the client build, but top-level imports are not. Static imports of the
// middleware modules pulled getDb/getAuth (postgres.js and
// `@tanstack/react-start/server`) into the browser bundle, where h3's
// AsyncLocalStorage setup throws at module eval and React never hydrates.
// Keep server-only modules behind dynamic imports inside `.server()` callbacks.
const loadRequestMiddleware = () => import("@/lib/server/request-middleware");

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const canonicalHostMiddleware = createMiddleware().server(async ({ request, next }) => {
  const { applyCanonicalHostRedirect } = await loadRequestMiddleware();
  const redirect = applyCanonicalHostRedirect(request);
  if (redirect) return redirect;
  return next();
});

const localeAndAuthMiddleware = createMiddleware().server(async ({ request, pathname, next }) => {
  const {
    applyAuthMiddleware,
    applyLocaleMiddleware,
    shouldSkipRequestMiddleware,
    withResponseCookies,
  } = await loadRequestMiddleware();

  if (shouldSkipRequestMiddleware(pathname)) {
    return next();
  }

  const { ensureProductionSeedPurged } = await import("@/lib/server/purge-seed-content");
  await ensureProductionSeedPurged(request);

  const localeResult = await applyLocaleMiddleware(request, pathname);
  if (localeResult instanceof Response) {
    return localeResult;
  }

  const authResult = await applyAuthMiddleware(
    request,
    localeResult.pathname,
    localeResult.localeCookies,
  );
  if (authResult instanceof Response) {
    return authResult;
  }

  const result = await next();
  return {
    ...result,
    response: withResponseCookies(result.response, authResult.cookies),
  };
});

export const startInstance = createStart(() => ({
  requestMiddleware: [canonicalHostMiddleware, csrfMiddleware, localeAndAuthMiddleware],
}));
