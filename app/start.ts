import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import {
  applyAuthMiddleware,
  applyLocaleMiddleware,
  shouldSkipRequestMiddleware,
  withResponseCookies,
} from "@/lib/server/request-middleware";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const localeAndAuthMiddleware = createMiddleware().server(async ({ request, pathname, next }) => {
  if (shouldSkipRequestMiddleware(pathname)) {
    return next();
  }

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
  requestMiddleware: [csrfMiddleware, localeAndAuthMiddleware],
}));
