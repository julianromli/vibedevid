import { describe, expect, it } from "vite-plus/test";
import {
  AVATAR_OUTPUT_MAX_EDGE,
  AVATAR_OUTPUT_QUALITY,
  AVATAR_OUTPUT_TYPE,
  avatarFileName,
} from "@/lib/avatar-crop";

describe("avatar crop output", () => {
  it("is WebP at ~0.82, capped at 512px on the long edge", () => {
    expect(AVATAR_OUTPUT_TYPE).toBe("image/webp");
    expect(AVATAR_OUTPUT_QUALITY).toBe(0.82);
    expect(AVATAR_OUTPUT_MAX_EDGE).toBe(512);
  });

  it("names the file after what the browser actually encoded", () => {
    expect(avatarFileName("me.png", "image/webp")).toBe("me.webp");
    expect(avatarFileName("photo.of.me.jpg", "image/webp")).toBe("photo.of.me.webp");
    // No WebP encoder: toBlob falls back to PNG.
    expect(avatarFileName("me.jpg", "image/png")).toBe("me.png");
    expect(avatarFileName(undefined, "image/webp")).toBe("avatar.webp");
  });
});
