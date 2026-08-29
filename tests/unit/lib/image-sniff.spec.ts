import { describe, expect, it } from "vite-plus/test";
import { sniffImageMime } from "@/lib/image-sniff";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0, 0, 0, 0]);

describe("sniffImageMime", () => {
  it("detects png, jpeg, and webp from header bytes", () => {
    expect(sniffImageMime(PNG)).toBe("image/png");
    expect(sniffImageMime(JPEG)).toBe("image/jpeg");
    expect(sniffImageMime(WEBP)).toBe("image/webp");
  });

  it("rejects a spoofed or short payload", () => {
    expect(sniffImageMime(PDF)).toBeNull();
    expect(sniffImageMime(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});
