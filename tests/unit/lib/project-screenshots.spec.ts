import { describe, expect, it } from "vite-plus/test";
import {
  addQueuedShots,
  clampProgress,
  hasImageSignature,
  isAnyShotUploading,
  MAX_SCREENSHOTS,
  makeCover,
  moveShot,
  patchShot,
  pickScreenshotFiles,
  removeShot,
  type Shot,
  setImportedShot,
  submittedImages,
} from "@/lib/project-screenshots";

function done(id: string): Shot {
  return {
    id,
    source: "upload",
    status: "done",
    previewUrl: `blob:${id}`,
    url: `https://x.ufs.sh/f/${id}`,
    key: id,
    progress: 100,
  };
}

describe("project screenshots list", () => {
  it("puts the GitHub preview first so it becomes the cover", () => {
    const shots = setImportedShot([done("a"), done("b")], "https://opengraph.githubassets.com/x");
    expect(shots[0]?.source).toBe("github");
    expect(submittedImages(shots).imageUrls).toEqual([
      "https://opengraph.githubassets.com/x",
      "https://x.ufs.sh/f/a",
      "https://x.ufs.sh/f/b",
    ]);
  });

  it("replaces an earlier GitHub preview instead of adding a second one", () => {
    const once = setImportedShot([], "https://example.com/1.png");
    const twice = setImportedShot(once, "https://example.com/2.png");
    expect(twice.filter((shot) => shot.source === "github")).toHaveLength(1);
    expect(twice[0]?.url).toBe("https://example.com/2.png");
  });

  it("drops the GitHub preview when the URL is cleared", () => {
    expect(setImportedShot(setImportedShot([], "https://example.com/1.png"), null)).toEqual([]);
  });

  it("make cover moves a tile to index 0 and keeps the rest in order", () => {
    const shots = makeCover([done("a"), done("b"), done("c")], "c");
    expect(shots.map((shot) => shot.id)).toEqual(["c", "a", "b"]);
  });

  it("moves a tile left or right and ignores moves past the ends", () => {
    const shots = [done("a"), done("b"), done("c")];
    expect(moveShot(shots, "b", -1).map((shot) => shot.id)).toEqual(["b", "a", "c"]);
    expect(moveShot(shots, "b", 1).map((shot) => shot.id)).toEqual(["a", "c", "b"]);
    expect(moveShot(shots, "a", -1)).toBe(shots);
    expect(moveShot(shots, "c", 1)).toBe(shots);
  });

  it("submits only finished screenshots, with keys only for uploads", () => {
    const shots: Shot[] = [
      ...setImportedShot([], "https://example.com/og.png"),
      done("a"),
      { id: "b", source: "upload", status: "uploading", previewUrl: "blob:b", progress: 40 },
      { id: "c", source: "upload", status: "error", previewUrl: "blob:c", progress: 0, error: "x" },
    ];
    expect(submittedImages(shots)).toEqual({
      imageUrls: ["https://example.com/og.png", "https://x.ufs.sh/f/a"],
      imageKeys: ["a"],
    });
    expect(isAnyShotUploading(shots)).toBe(true);
    expect(isAnyShotUploading([done("a")])).toBe(false);
  });

  it("queues new uploads after existing tiles, patches and removes them", () => {
    const queued = addQueuedShots([done("a")], [{ id: "n", previewUrl: "blob:n" }]);
    expect(queued[1]).toMatchObject({ id: "n", status: "queued", progress: 0 });
    const patched = patchShot(queued, "n", { status: "uploading", progress: 30 });
    expect(patched[1]).toMatchObject({ status: "uploading", progress: 30 });
    expect(removeShot(patched, "a").map((shot) => shot.id)).toEqual(["n"]);
  });
});

describe("pickScreenshotFiles", () => {
  const png = (name: string, size = 1000) =>
    new File([new Uint8Array(size)], name, { type: "image/png" });

  it("accepts JPG, PNG and WebP under 4 MB", () => {
    const jpg = new File([new Uint8Array(10)], "a.jpg", { type: "image/jpeg" });
    const webp = new File([new Uint8Array(10)], "a.webp", { type: "image/webp" });
    const result = pickScreenshotFiles([png("a.png"), jpg, webp], MAX_SCREENSHOTS);
    expect(result.accepted.map((file) => file.name)).toEqual(["a.png", "a.jpg", "a.webp"]);
    expect(result.rejected).toEqual([]);
  });

  it("rejects the wrong type and files over 4 MB without uploading them", () => {
    const gif = new File(["x"], "a.gif", { type: "image/gif" });
    const big = png("big.png", 4 * 1024 * 1024 + 1);
    const result = pickScreenshotFiles([gif, big], MAX_SCREENSHOTS);
    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([
      { name: "a.gif", reason: "type" },
      { name: "big.png", reason: "size" },
    ]);
  });

  it("keeps only as many files as there are free slots", () => {
    const result = pickScreenshotFiles([png("a.png"), png("b.png"), png("c.png")], 2);
    expect(result.accepted.map((file) => file.name)).toEqual(["a.png", "b.png"]);
    expect(result.overLimit).toBe(1);
  });
});

describe("clampProgress", () => {
  it("keeps progress between 0 and 100", () => {
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(42.6)).toBe(43);
    expect(clampProgress(180)).toBe(100);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe("hasImageSignature", () => {
  const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];

  it("accepts a real PNG", async () => {
    const file = new File([new Uint8Array(PNG_HEAD)], "a.png", { type: "image/png" });
    expect(await hasImageSignature(file)).toBe(true);
  });

  it("rejects a text file renamed to .png", async () => {
    const file = new File(["hello, this is not an image"], "fake.png", { type: "image/png" });
    expect(await hasImageSignature(file)).toBe(false);
  });
});
