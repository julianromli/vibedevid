import { describe, expect, it } from "vite-plus/test";
import {
  isR2ProjectKey,
  isR2UrlForKey,
  projectUploadKey,
  r2PublicUrl,
} from "@/lib/r2-project-uploads";

describe("R2 project upload keys", () => {
  it("builds a key under the user's prefix", () => {
    expect(projectUploadKey("user-1", "abc", "image/webp")).toBe("projects/user-1/abc.webp");
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
  });
});
