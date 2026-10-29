import { describe, expect, it } from "vite-plus/test";
import {
  isR2ProjectKey,
  isR2UploadKey,
  isR2UrlForKey,
  r2PublicUrl,
  r2UploadKey,
} from "@/lib/r2-uploads";

describe("R2 project upload keys", () => {
  it("builds a key under the user's prefix", () => {
    expect(r2UploadKey("projects", "user-1", "abc", "image/webp")).toBe("projects/user-1/abc.webp");
  });

  it("knows R2 keys from UploadThing keys", () => {
    expect(isR2ProjectKey("projects/user-1/abc.png")).toBe(true);
    expect(isR2ProjectKey("Xyz123utkey")).toBe(false);
    expect(isR2ProjectKey("projects/../x.png")).toBe(false);
  });

  it("matches a CDN URL to its key only", () => {
    const key = "projects/user-1/abc.png";
    expect(r2PublicUrl(key)).toBe("https://cdn.vibedeveloper.id/projects/user-1/abc.png");
    expect(isR2UrlForKey(r2PublicUrl(key), key)).toBe(true);
    expect(isR2UrlForKey(r2PublicUrl(key), "projects/user-2/abc.png")).toBe(false);
    expect(isR2UrlForKey(`http://cdn.vibedeveloper.id/${key}`, key)).toBe(false);
    expect(isR2UrlForKey(`https://evil.example/${key}`, key)).toBe(false);
    expect(isR2UrlForKey(`https://cdn.vibedeveloper.id:8443/${key}`, key)).toBe(false);
    expect(isR2UrlForKey(`${r2PublicUrl(key)}#x`, key)).toBe(false);
  });
});

describe("R2 upload keys for every kind", () => {
  it("builds keys per kind", () => {
    expect(r2UploadKey("events", "user-1", "abc", "image/png")).toBe("events/user-1/abc.png");
    expect(r2UploadKey("avatars", "user-1", "abc", "image/jpeg")).toBe("avatars/user-1/abc.jpg");
  });

  it("knows any app-written R2 key, and project keys stay project-only", () => {
    for (const key of [
      "projects/u/a.png",
      "events/u/a.webp",
      "blog/u/a.jpg",
      "avatars/u/a.png",
      "testimonials/anonymous/a.png",
    ]) {
      expect(isR2UploadKey(key)).toBe(true);
    }
    expect(isR2UploadKey("Xyz123utkey")).toBe(false);
    expect(isR2UploadKey("other/u/a.png")).toBe(false);
    expect(isR2UploadKey("blog/../a.png")).toBe(false);
    expect(isR2ProjectKey("blog/u/a.png")).toBe(false);
  });
});
