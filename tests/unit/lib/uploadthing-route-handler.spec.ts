import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createUploadthingRouteHandler } from "@/lib/server/uploadthing-route-handler";

const API_KEY = "sk_test_never_log_me";
const TOKEN = globalThis.btoa(
  JSON.stringify({ apiKey: API_KEY, appId: "app_test", regions: ["sea1"] }),
);

vi.mock("@/lib/server/auth", () => ({
  requireUser: async () => ({ id: "user_test" }),
}));

vi.mock("@/lib/server/runtime-secrets", () => ({
  getServerRuntimeSecrets: () => ({ uploadthingToken: TOKEN }),
}));

function uploadRequest() {
  return new Request(
    "https://vibedeveloper.id/api/uploadthing?actionType=upload&slug=projectImageUploader",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-uploadthing-package": "@uploadthing/react",
        "x-uploadthing-version": "7.7.4",
      },
      body: JSON.stringify({
        files: [{ name: "shot.webp", size: 1024, type: "image/webp", lastModified: 1 }],
      }),
    },
  );
}

describe("createUploadthingRouteHandler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs when UploadThing rejects metadata registration, without leaking the API key", async () => {
    const errors: unknown[][] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args);
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
      if (url.endsWith("/route-metadata")) {
        return new Response('{"error":"Invalid callback"}', {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("unexpected", { status: 500 });
    });

    const handler = createUploadthingRouteHandler(TOKEN, fetchMock as unknown as typeof fetch);
    const response = await handler(uploadRequest());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
    const registrationLog = errors.find((args) =>
      String(args[0]).includes("[uploadthing] ingest request rejected"),
    );
    expect(registrationLog?.[1]).toMatchObject({ path: "/route-metadata", status: 403 });
    expect(JSON.stringify(errors)).not.toContain(API_KEY);
  });

  it("stays quiet when registration succeeds", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));

    const handler = createUploadthingRouteHandler(TOKEN, fetchMock as unknown as typeof fetch);
    const response = await handler(uploadRequest());

    expect(response.status).toBe(200);
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("[uploadthing]"),
      expect.anything(),
    );
  });
});
