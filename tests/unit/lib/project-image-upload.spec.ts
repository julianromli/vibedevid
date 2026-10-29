import { describe, expect, it, vi } from "vite-plus/test";
import {
  handleProjectImageUpload,
  PROJECT_IMAGE_MAX_BYTES,
} from "@/lib/server/project-image-upload";

const ORIGIN = "https://vibedeveloper.id";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 1, 2]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

function post(
  body: Uint8Array,
  { type = "image/png", origin = ORIGIN }: { type?: string; origin?: string | null } = {},
) {
  const headers: Record<string, string> = { "Content-Type": type };
  if (origin) headers.Origin = origin;
  return new Request(`${ORIGIN}/api/project-uploads`, {
    method: "POST",
    headers,
    body: body as BodyInit,
  });
}

function deps(overrides: Partial<Parameters<typeof handleProjectImageUpload>[1]> = {}) {
  return {
    requireUserId: vi.fn(async () => "user-1"),
    bucket: { put: vi.fn(async () => ({})), delete: vi.fn(async () => undefined) },
    record: vi.fn(async () => undefined),
    newId: () => "abc123",
    ...overrides,
  };
}

describe("handleProjectImageUpload", () => {
  it("stores a PNG under the user's prefix and records it in the ledger", async () => {
    const d = deps();
    const res = await handleProjectImageUpload(post(PNG), d);

    expect(res.status).toBe(200);
    const key = "projects/user-1/abc123.png";
    const url = `https://cdn.vibedeveloper.id/${key}`;
    expect(await res.json()).toEqual({ key, url });
    expect(d.bucket.put).toHaveBeenCalledWith(
      key,
      expect.any(Uint8Array),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({ contentType: "image/png" }),
      }),
    );
    expect(d.record).toHaveBeenCalledWith({ key, url, userId: "user-1" });
  });

  it("uses the type the bytes prove, not the type the browser claims", async () => {
    const d = deps();
    const res = await handleProjectImageUpload(post(JPEG, { type: "image/png" }), d);
    expect(await res.json()).toMatchObject({ key: "projects/user-1/abc123.jpg" });
    expect(d.bucket.put).toHaveBeenCalledWith(
      "projects/user-1/abc123.jpg",
      expect.any(Uint8Array),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({ contentType: "image/jpeg" }),
      }),
    );
  });

  it("refuses a signed-out user before reading the body", async () => {
    const d = deps({ requireUserId: vi.fn(async () => Promise.reject(new Error("no session"))) });
    const res = await handleProjectImageUpload(post(PNG), d);
    expect(res.status).toBe(401);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("refuses requests from another site", async () => {
    const d = deps();
    expect(
      (await handleProjectImageUpload(post(PNG, { origin: "https://evil.example" }), d)).status,
    ).toBe(403);
    expect((await handleProjectImageUpload(post(PNG, { origin: null }), d)).status).toBe(403);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("refuses types other than JPG, PNG, and WebP", async () => {
    const d = deps();
    const res = await handleProjectImageUpload(post(PNG, { type: "image/gif" }), d);
    expect(res.status).toBe(415);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("refuses bytes that are not a JPG, PNG, or WebP", async () => {
    const d = deps();
    const res = await handleProjectImageUpload(
      post(new TextEncoder().encode("<svg>not an image</svg>")),
      d,
    );
    expect(res.status).toBe(415);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("refuses files over the size limit", async () => {
    const d = deps();
    const big = new Uint8Array(PROJECT_IMAGE_MAX_BYTES + 1);
    big.set(PNG);
    const res = await handleProjectImageUpload(post(big), d);
    expect(res.status).toBe(413);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("refuses an empty body", async () => {
    const d = deps();
    const res = await handleProjectImageUpload(post(new Uint8Array()), d);
    expect(res.status).toBe(400);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("deletes the stored object when the ledger write fails", async () => {
    const d = deps({ record: vi.fn(async () => Promise.reject(new Error("db down"))) });
    const res = await handleProjectImageUpload(post(PNG), d);
    expect(res.status).toBe(500);
    expect(d.bucket.delete).toHaveBeenCalledWith("projects/user-1/abc123.png");
  });

  it("logs the ledger failure and a failed rollback delete", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const d = deps({ record: vi.fn(async () => Promise.reject(new Error("db down"))) });
    d.bucket.delete = vi.fn(async () => Promise.reject(new Error("r2 down")));
    const res = await handleProjectImageUpload(post(PNG), d);
    expect(res.status).toBe(500);
    const logged = errorLog.mock.calls.map((call) => String(call[0]));
    expect(logged.some((line) => line.includes("afterStore"))).toBe(true);
    expect(logged.some((line) => line.includes("rollback"))).toBe(true);
    errorLog.mockRestore();
  });
});
