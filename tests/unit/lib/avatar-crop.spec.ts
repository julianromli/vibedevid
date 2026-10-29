import { describe, expect, it } from "vite-plus/test";
import {
  AVATAR_OUTPUT_MAX_EDGE,
  AVATAR_OUTPUT_TYPE,
  avatarFileName,
  fitWithin,
} from "@/lib/avatar-crop";

describe("avatar crop output", () => {
  it("is a JPEG capped at 1024px on the long edge", () => {
    expect(AVATAR_OUTPUT_TYPE).toBe("image/jpeg");
    expect(AVATAR_OUTPUT_MAX_EDGE).toBe(1024);
  });

  it("keeps small crops as they are", () => {
    expect(fitWithin(400, 300, 1024)).toEqual({ width: 400, height: 300 });
  });

  it("scales large crops down, keeping the aspect ratio", () => {
    expect(fitWithin(3000, 3000, 1024)).toEqual({ width: 1024, height: 1024 });
    expect(fitWithin(4000, 2000, 1024)).toEqual({ width: 1024, height: 512 });
  });

  it("names the file .jpg whatever the source was", () => {
    expect(avatarFileName("me.png")).toBe("me.jpg");
    expect(avatarFileName("photo.of.me.webp")).toBe("photo.of.me.jpg");
    expect(avatarFileName(undefined)).toBe("avatar.jpg");
  });
});
