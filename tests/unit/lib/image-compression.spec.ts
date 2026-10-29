import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  compressForUpload,
  fitWithin,
  isAnimatedImage,
  keepSmallerUpload,
  needsReencode,
  UPLOAD_MAX_EDGE,
  webpFileName,
} from "@/lib/image-compression";
import { UPLOAD_MAX_BYTES } from "@/lib/r2-uploads";

const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const pngChunk = (type: string, length = 0) => [
  0,
  0,
  0,
  length,
  ...ascii(type),
  ...Array(length).fill(0),
  0,
  0,
  0,
  0,
];
const webpVp8x = (flags: number) =>
  new Uint8Array([
    ...ascii("RIFF"),
    0,
    0,
    0,
    0,
    ...ascii("WEBP"),
    ...ascii("VP8X"),
    10,
    0,
    0,
    0,
    flags,
    0,
    0,
    0,
  ]);

describe("max edge per kind", () => {
  it("is 512px for avatars and testimonials and 1920px for everything else", () => {
    expect(UPLOAD_MAX_EDGE).toEqual({
      avatars: 512,
      testimonials: 512,
      blog: 1920,
      events: 1920,
      projects: 1920,
    });
  });

  it("scales the long edge down to the cap and never scales up", () => {
    expect(fitWithin(4032, 3024, 1920)).toEqual({ width: 1920, height: 1440 });
    expect(fitWithin(3000, 6000, 512)).toEqual({ width: 256, height: 512 });
    expect(fitWithin(800, 600, 1920)).toEqual({ width: 800, height: 600 });
  });
});

describe("keepSmallerUpload", () => {
  const original = new File([new Uint8Array(1000)], "photo.jpg", { type: "image/jpeg" });

  it("uses the WebP when it is smaller, renamed to .webp", () => {
    const out = keepSmallerUpload(
      original,
      new Blob([new Uint8Array(300)], { type: "image/webp" }),
    );
    expect(out.name).toBe("photo.webp");
    expect(out.type).toBe("image/webp");
    expect(out.size).toBe(300);
  });

  it("keeps the original when the WebP is not smaller", () => {
    expect(
      keepSmallerUpload(original, new Blob([new Uint8Array(1000)], { type: "image/webp" })),
    ).toBe(original);
    expect(
      keepSmallerUpload(original, new Blob([new Uint8Array(1500)], { type: "image/webp" })),
    ).toBe(original);
  });

  it("keeps the original when the browser cannot encode WebP", () => {
    // Browsers without a WebP encoder hand back a PNG from toBlob("image/webp").
    expect(keepSmallerUpload(original, new Blob([new Uint8Array(10)], { type: "image/png" }))).toBe(
      original,
    );
    expect(keepSmallerUpload(original, null)).toBe(original);
  });
});

describe("needsReencode", () => {
  const small = (type: string) => ({ type, size: 1000 });

  it("re-encodes JPEG and PNG, and WebP that is over the cap", () => {
    expect(needsReencode(small("image/jpeg"), 800, 600, "blog")).toBe(true);
    expect(needsReencode(small("image/png"), 800, 600, "blog")).toBe(true);
    expect(needsReencode(small("image/webp"), 4000, 3000, "blog")).toBe(true);
  });

  it("leaves a WebP that already fits alone, so it is not compressed twice", () => {
    expect(needsReencode(small("image/webp"), 512, 512, "avatars")).toBe(false);
  });

  it("re-encodes a WebP that fits the edge but is over the kind's byte limit", () => {
    const big = { type: "image/webp", size: UPLOAD_MAX_BYTES.avatars + 1 };
    expect(needsReencode(big, 512, 512, "avatars")).toBe(true);
  });
});

describe("isAnimatedImage", () => {
  it("spots animated PNG and WebP", () => {
    expect(
      isAnimatedImage(
        new Uint8Array([
          ...PNG_SIG,
          ...pngChunk("IHDR", 13),
          ...pngChunk("acTL", 8),
          ...pngChunk("IDAT"),
        ]),
      ),
    ).toBe(true);
    expect(isAnimatedImage(webpVp8x(0x02))).toBe(true);
    expect(isAnimatedImage(new Uint8Array(ascii("GIF89a")))).toBe(true);
  });

  it("assumes animated when the prefix ends before IDAT, so an APNG is never flattened", () => {
    expect(isAnimatedImage(new Uint8Array([...PNG_SIG, ...pngChunk("IHDR", 13)]))).toBe(true);
  });

  it("treats still images as still", () => {
    expect(
      isAnimatedImage(
        new Uint8Array([
          ...PNG_SIG,
          ...pngChunk("IHDR", 13),
          ...pngChunk("IDAT"),
          ...pngChunk("acTL"),
        ]),
      ),
    ).toBe(false);
    expect(isAnimatedImage(webpVp8x(0x10))).toBe(false);
    expect(isAnimatedImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(false);
  });
});

describe("webpFileName", () => {
  it("swaps the extension", () => {
    expect(webpFileName("a.b.png")).toBe("a.b.webp");
    expect(webpFileName("noext")).toBe("noext.webp");
    expect(webpFileName("")).toBe("image.webp");
  });
});

describe("compressForUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function stubBrowser(width: number, height: number, encoded: Blob | null) {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width, height, close })),
    );
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
    ) {
      callback(encoded);
    });
    return { drawImage, toBlob, close };
  }

  const jpeg = (size: number) => {
    const bytes = new Uint8Array(size);
    bytes.set([0xff, 0xd8, 0xff, 0xe0]);
    return new File([bytes], "photo.jpg", { type: "image/jpeg" });
  };

  it("downscales to the kind's max edge and encodes WebP at ~0.82", async () => {
    const { drawImage, toBlob, close } = stubBrowser(
      4032,
      3024,
      new Blob([new Uint8Array(200)], { type: "image/webp" }),
    );
    const out = await compressForUpload(jpeg(5000), "avatars");
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 512, 384);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.82);
    expect(close).toHaveBeenCalled();
    expect(out.name).toBe("photo.webp");
    expect(out.size).toBe(200);
  });

  it("uploads the original when WebP is bigger or not supported", async () => {
    const original = jpeg(100);
    stubBrowser(800, 600, new Blob([new Uint8Array(500)], { type: "image/webp" }));
    expect(await compressForUpload(original, "blog")).toBe(original);
    vi.restoreAllMocks();
    stubBrowser(800, 600, new Blob([new Uint8Array(10)], { type: "image/png" }));
    expect(await compressForUpload(original, "blog")).toBe(original);
  });

  it("uploads the original when decoding fails or the image is animated", async () => {
    const original = jpeg(5000);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decode failed");
      }),
    );
    expect(await compressForUpload(original, "events")).toBe(original);

    const animated = new File([webpVp8x(0x02)], "anim.webp", { type: "image/webp" });
    const bitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", bitmap);
    expect(await compressForUpload(animated, "events")).toBe(animated);
    expect(bitmap).not.toHaveBeenCalled();
  });

  it("re-encodes a WebP that fits the edge but is over the byte limit", async () => {
    const { toBlob } = stubBrowser(
      512,
      512,
      new Blob([new Uint8Array(300)], { type: "image/webp" }),
    );
    const bytes = new Uint8Array(UPLOAD_MAX_BYTES.avatars + 1);
    bytes.set(ascii("RIFF"));
    bytes.set(ascii("WEBPVP8 "), 8);
    const big = new File([bytes], "big.webp", { type: "image/webp" });
    const out = await compressForUpload(big, "avatars");
    expect(toBlob).toHaveBeenCalled();
    expect(out.size).toBe(300);
  });

  it("leaves non-image files alone without decoding them", async () => {
    const bitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", bitmap);
    const gif = new File(["GIF89a"], "a.gif", { type: "image/gif" });
    const text = new File(["hello"], "a.txt", { type: "text/plain" });
    expect(await compressForUpload(gif, "blog")).toBe(gif);
    expect(await compressForUpload(text, "blog")).toBe(text);
    expect(bitmap).not.toHaveBeenCalled();
  });
});
