import { describe, expect, it, vi } from "vite-plus/test";
import {
  handleKindImageUpload,
  IMAGE_UPLOAD_KINDS,
  storeImageBytes,
} from "@/lib/server/image-upload";

const ORIGIN = "https://vibedeveloper.id";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 1, 2]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0]);
const MB = 1024 * 1024;

function post(
  kind: string | null,
  body: Uint8Array,
  { type = "image/png", origin = ORIGIN }: { type?: string; origin?: string | null } = {},
) {
  const headers: Record<string, string> = { "Content-Type": type };
  if (origin) headers.Origin = origin;
  const query = kind === null ? "" : `?kind=${encodeURIComponent(kind)}`;
  return new Request(`${ORIGIN}/api/uploads/image${query}`, {
    method: "POST",
    headers,
    body: body as BodyInit,
  });
}

function deps(overrides: Partial<Parameters<typeof handleKindImageUpload>[1]> = {}) {
  return {
    getUserId: vi.fn(async (): Promise<string | null> => "user-1"),
    bucket: { put: vi.fn(async () => ({})), delete: vi.fn(async () => undefined) },
    newId: () => "abc123",
    ...overrides,
  };
}

function sized(bytes: number, header = PNG) {
  const body = new Uint8Array(bytes);
  body.set(header);
  return body;
}

describe("handleKindImageUpload", () => {
  it.each([
    ["events", "events/user-1/abc123.png"],
    ["blog", "blog/user-1/abc123.png"],
    ["avatars", "avatars/user-1/abc123.png"],
  ])("stores a %s image under that kind's prefix and returns its CDN URL", async (kind, key) => {
    const d = deps();
    const res = await handleKindImageUpload(post(kind, PNG), d);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ key, url: `https://cdn.vibedeveloper.id/${key}` });
    expect(d.bucket.put).toHaveBeenCalledWith(
      key,
      expect.any(Uint8Array),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({ contentType: "image/png" }),
      }),
    );
  });

  it("names the file by the sniffed type, not the claimed one", async () => {
    const d = deps();
    const res = await handleKindImageUpload(post("blog", WEBP, { type: "image/png" }), d);
    expect(await res.json()).toMatchObject({ key: "blog/user-1/abc123.webp" });
  });

  it.each([
    null,
    "",
    "projects",
    "testimonials",
    "../x",
    "unknown",
  ])("refuses an unknown or reserved kind (%s)", async (kind) => {
    const d = deps();
    const res = await handleKindImageUpload(post(kind, PNG), d);
    expect(res.status).toBe(400);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("keeps the old UploadThing size limits per kind", () => {
    expect(IMAGE_UPLOAD_KINDS.events.maxBytes).toBe(4 * MB);
    expect(IMAGE_UPLOAD_KINDS.blog.maxBytes).toBe(4 * MB);
    expect(IMAGE_UPLOAD_KINDS.avatars.maxBytes).toBe(2 * MB);
  });

  it("refuses an avatar over 2MB but accepts a 3MB blog image", async () => {
    const d = deps();
    expect((await handleKindImageUpload(post("avatars", sized(2 * MB + 1)), d)).status).toBe(413);
    expect(d.bucket.put).not.toHaveBeenCalled();
    expect((await handleKindImageUpload(post("blog", sized(3 * MB)), d)).status).toBe(200);
  });

  it("refuses a 4MB+1 event cover", async () => {
    const d = deps();
    expect((await handleKindImageUpload(post("events", sized(4 * MB + 1)), d)).status).toBe(413);
    expect(d.bucket.put).not.toHaveBeenCalled();
  });

  it("refuses another site, signed-out users, other types, and fake images", async () => {
    const d = deps();
    expect(
      (await handleKindImageUpload(post("blog", PNG, { origin: "https://evil.example" }), d))
        .status,
    ).toBe(403);
    expect((await handleKindImageUpload(post("blog", PNG, { origin: null }), d)).status).toBe(403);
    expect((await handleKindImageUpload(post("blog", PNG, { type: "image/gif" }), d)).status).toBe(
      415,
    );
    expect(
      (await handleKindImageUpload(post("blog", new TextEncoder().encode("<svg>x</svg>....")), d))
        .status,
    ).toBe(415);
    const signedOut = deps({ getUserId: vi.fn(async () => null) });
    expect((await handleKindImageUpload(post("avatars", PNG), signedOut)).status).toBe(401);
    expect(d.bucket.put).not.toHaveBeenCalled();
    expect(signedOut.bucket.put).not.toHaveBeenCalled();
  });
});

describe("storeImageBytes", () => {
  const bucket = () => ({ put: vi.fn(async () => ({})), delete: vi.fn(async () => undefined) });

  it("stores sniffed bytes under the kind and owner prefix", async () => {
    const b = bucket();
    const stored = await storeImageBytes(PNG, {
      bucket: b,
      kind: "testimonials",
      ownerId: "anonymous",
      id: "id1",
      maxBytes: 2 * MB,
    });
    expect(stored).toEqual({
      key: "testimonials/anonymous/id1.png",
      url: "https://cdn.vibedeveloper.id/testimonials/anonymous/id1.png",
    });
    expect(b.put).toHaveBeenCalledWith(
      "testimonials/anonymous/id1.png",
      expect.any(Uint8Array),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({ contentType: "image/png" }),
      }),
    );
  });

  it("throws before storing bytes that are too big or not an image", async () => {
    const b = bucket();
    const options = {
      bucket: b,
      kind: "testimonials",
      ownerId: "anonymous",
      id: "x",
      maxBytes: 16,
    } as const;
    await expect(storeImageBytes(sized(17), options)).rejects.toThrow();
    await expect(
      storeImageBytes(new TextEncoder().encode("not an image!!"), options),
    ).rejects.toThrow();
    expect(b.put).not.toHaveBeenCalled();
  });
});
