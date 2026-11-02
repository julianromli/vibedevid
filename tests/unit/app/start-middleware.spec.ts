import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const getDb = vi.fn(() => {
  throw new Error("database touched");
});

vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("@/lib/server/request-middleware", () => ({
  applyCanonicalHostRedirect: () => null,
  shouldSkipRequestMiddleware: () => false,
  applyLocaleMiddleware: async (_request: Request, pathname: string) => ({
    localeCookies: [],
    pathname,
  }),
  applyAuthMiddleware: async () => ({ cookies: [] }),
  withResponseCookies: (response: Response) => response,
}));

const { startInstance } = await import("@/app/start");

type ServerMiddleware = {
  options: {
    server: (ctx: {
      request: Request;
      pathname: string;
      next: () => Promise<{ response: Response }>;
    }) => Promise<unknown>;
  };
};

async function runLocaleAndAuth(url: string) {
  const options = await startInstance.getOptions();
  const middleware = options.requestMiddleware?.at(-1) as unknown as ServerMiddleware;
  const request = new Request(url);
  return middleware.options.server({
    request,
    pathname: new URL(url).pathname,
    next: async () => ({ response: new Response("ok") }),
  });
}

describe("request middleware on the production host", () => {
  beforeEach(() => {
    getDb.mockClear();
  });

  it("does not query the database for seed rows on a page request", async () => {
    await runLocaleAndAuth("https://vibedeveloper.id/");
    await runLocaleAndAuth("https://vibedeveloper.id/project/list");
    expect(getDb).not.toHaveBeenCalled();
  });
});
