import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const h = vi.hoisted(() => ({
  deleteUploadthingFiles: vi.fn(),
  r2Delete: vi.fn(),
  r2Put: vi.fn(),
}));

vi.mock("@/lib/uploadthing", () => ({ deleteUploadthingFiles: h.deleteUploadthingFiles }));

import {
  deleteStoredFiles,
  deleteStoredFilesThenForget,
  storeAnonymousAvatar,
} from "@/lib/server/stored-uploads";

const R2_KEY = "projects/user-1/abc.png";

beforeEach(() => {
  h.deleteUploadthingFiles.mockReset();
  h.deleteUploadthingFiles.mockResolvedValue({ success: true, deletedCount: 1 });
  h.r2Delete.mockReset();
  h.r2Delete.mockResolvedValue(undefined);
  h.r2Put.mockReset();
  h.r2Put.mockResolvedValue({});
  (globalThis as { __env__?: unknown }).__env__ = {
    PROJECT_UPLOADS: { put: h.r2Put, delete: h.r2Delete },
  };
});

describe("deleteStoredFiles", () => {
  it("deletes R2 keys from the bucket and the rest from UploadThing", async () => {
    const result = await deleteStoredFiles([R2_KEY, "utkey1", " "]);
    expect(h.r2Delete).toHaveBeenCalledWith([R2_KEY]);
    expect(h.deleteUploadthingFiles).toHaveBeenCalledWith(["utkey1"]);
    expect(result).toEqual({ success: true, deletedCount: 2 });
  });

  it("does not call UploadThing for R2-only keys", async () => {
    const result = await deleteStoredFiles(R2_KEY);
    expect(h.deleteUploadthingFiles).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, deletedCount: 1 });
  });

  it("reports failure when the bucket binding is missing", async () => {
    (globalThis as { __env__?: unknown }).__env__ = {};
    const result = await deleteStoredFiles([R2_KEY]);
    expect(result).toEqual({ success: false, deletedCount: 0 });
  });
});

describe("deleteStoredFiles failures", () => {
  it("logs an R2 delete failure and reports it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    h.r2Delete.mockRejectedValueOnce(new Error("r2 down"));
    const result = await deleteStoredFiles([R2_KEY]);
    expect(result).toEqual({ success: false, deletedCount: 0 });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("deleteStoredFilesThenForget", () => {
  it("forgets every key after the files are deleted", async () => {
    const forget = vi.fn(async () => undefined);
    const result = await deleteStoredFilesThenForget([R2_KEY, "utkey1"], forget);
    expect(result.success).toBe(true);
    expect(forget.mock.calls).toEqual([[R2_KEY], ["utkey1"]]);
  });

  it("tries to forget every key even when one ledger delete fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const forget = vi.fn(async (key: string) => {
      if (key === R2_KEY) throw new Error("db blip");
    });
    const result = await deleteStoredFilesThenForget([R2_KEY, "utkey1"], forget);
    expect(result.success).toBe(true);
    expect(forget.mock.calls).toEqual([[R2_KEY], ["utkey1"]]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("keeps the ledger rows when a delete fails, so the files can be found later", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    h.r2Delete.mockRejectedValueOnce(new Error("r2 down"));
    const forget = vi.fn(async () => undefined);
    const result = await deleteStoredFilesThenForget([R2_KEY], forget);
    expect(result.success).toBe(false);
    expect(forget).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("deleteStoredFiles for every upload kind", () => {
  it("sends event, blog, avatar, and testimonial keys to R2", async () => {
    const keys = [
      "events/u/a.png",
      "blog/u/b.jpg",
      "avatars/u/c.webp",
      "testimonials/anonymous/d.png",
    ];
    const result = await deleteStoredFiles(keys);
    expect(h.r2Delete).toHaveBeenCalledWith(keys);
    expect(h.deleteUploadthingFiles).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, deletedCount: 4 });
  });
});

describe("storeAnonymousAvatar", () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  it("stores the avatar in R2 under testimonials/anonymous/", async () => {
    const stored = await storeAnonymousAvatar(PNG);
    expect(stored.key).toMatch(/^testimonials\/anonymous\/[A-Za-z0-9_-]+\.png$/);
    expect(stored.url).toBe(`https://cdn.vibedeveloper.id/${stored.key}`);
    expect(h.r2Put).toHaveBeenCalledWith(stored.key, expect.any(Uint8Array), expect.any(Object));
  });

  it("refuses avatars over 2MB", async () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 1);
    big.set(PNG);
    await expect(storeAnonymousAvatar(big)).rejects.toThrow("The image is too large");
    expect(h.r2Put).not.toHaveBeenCalled();
  });

  it("fails when the bucket binding is missing", async () => {
    (globalThis as { __env__?: unknown }).__env__ = {};
    await expect(storeAnonymousAvatar(PNG)).rejects.toThrow("Upload service not configured");
  });
});
