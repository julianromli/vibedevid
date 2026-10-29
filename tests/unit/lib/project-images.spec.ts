import { describe, expect, it } from "vite-plus/test";
import {
  alignProjectImages,
  INVALID_PROJECT_IMAGE_MESSAGE,
  imageKeyForUrl,
  isAllowedProjectImageUrl,
  type KnownProjectUpload,
} from "@/lib/project-images";

const OWNER = "user-1";
const OWN_URL = "https://utfs.io/f/own-shot";
const OWN_KEY = "own-key";
const VICTIM_URL = "https://utfs.io/f/victim-shot";
const VICTIM_KEY = "victim-key";

function upload(overrides: Partial<KnownProjectUpload> = {}): KnownProjectUpload {
  return {
    key: OWN_KEY,
    url: OWN_URL,
    userId: OWNER,
    projectId: null,
    ...overrides,
  };
}

describe("isAllowedProjectImageUrl", () => {
  it("allows UploadThing and GitHub preview URLs", () => {
    expect(isAllowedProjectImageUrl("https://utfs.io/f/abc")).toBe(true);
    expect(isAllowedProjectImageUrl("https://app.ufs.sh/f/abc")).toBe(true);
    expect(isAllowedProjectImageUrl("https://opengraph.githubassets.com/1/acme/app")).toBe(true);
  });

  it("rejects other hosts, insecure URLs, and credentials", () => {
    expect(isAllowedProjectImageUrl("https://img.example.com/1.png")).toBe(false);
    expect(isAllowedProjectImageUrl("http://utfs.io/f/abc")).toBe(false);
    expect(isAllowedProjectImageUrl("https://user:pass@utfs.io/f/abc")).toBe(false);
    expect(isAllowedProjectImageUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("alignProjectImages", () => {
  it("matches an owned file by key when the URL host differs from the ledger", () => {
    // UploadThing serves one file from utfs.io and <app>.ufs.sh. The ledger keeps ufsUrl.
    const ledgerUrl = `https://app123.ufs.sh/f/${OWN_KEY}`;
    const result = alignProjectImages({
      submittedUrls: [`https://utfs.io/f/${OWN_KEY}`],
      submittedKeys: [OWN_KEY],
      knownUploads: [upload({ url: ledgerUrl })],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result).toEqual({ ok: true, imageUrls: [ledgerUrl], imageKeys: [OWN_KEY] });
  });

  it("does not match by key on a host that is not UploadThing", () => {
    const result = alignProjectImages({
      submittedUrls: [`https://evil.example.com/f/${OWN_KEY}`],
      submittedKeys: [OWN_KEY],
      knownUploads: [upload({ url: `https://app123.ufs.sh/f/${OWN_KEY}` })],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result).toEqual({ ok: false, error: INVALID_PROJECT_IMAGE_MESSAGE });
  });

  it("stores the ledger URL and key for a file this user uploaded", () => {
    const result = alignProjectImages({
      submittedUrls: [OWN_URL],
      submittedKeys: [OWN_KEY],
      knownUploads: [upload()],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result).toEqual({ ok: true, imageUrls: [OWN_URL], imageKeys: [OWN_KEY] });
  });

  it("rejects another user's key even when the caller knows the URL", () => {
    const result = alignProjectImages({
      submittedUrls: [VICTIM_URL],
      submittedKeys: [VICTIM_KEY],
      knownUploads: [],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result).toEqual({ ok: false, error: INVALID_PROJECT_IMAGE_MESSAGE });
  });

  it("does not store a key that is not paired with an allowed image", () => {
    const result = alignProjectImages({
      submittedUrls: [OWN_URL],
      submittedKeys: [OWN_KEY, VICTIM_KEY],
      knownUploads: [upload()],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.imageKeys).toEqual([OWN_KEY]);
  });

  it("keeps a screenshot that is already on this project", () => {
    const result = alignProjectImages({
      submittedUrls: ["https://cdn.example.com/legacy.png"],
      submittedKeys: ["legacy-key"],
      knownUploads: [],
      actorUserId: OWNER,
      projectId: 7,
      existingUrls: ["https://cdn.example.com/legacy.png"],
      existingKeys: ["legacy-key"],
    });

    expect(result).toEqual({
      ok: true,
      imageUrls: ["https://cdn.example.com/legacy.png"],
      imageKeys: ["legacy-key"],
    });
  });

  it("allows a GitHub preview with no upload key", () => {
    const preview = "https://opengraph.githubassets.com/1/acme/app";
    const result = alignProjectImages({
      submittedUrls: [preview],
      submittedKeys: [],
      knownUploads: [],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result).toEqual({ ok: true, imageUrls: [preview], imageKeys: [] });
  });

  it("rejects a file that is already attached to a different project", () => {
    const result = alignProjectImages({
      submittedUrls: [OWN_URL],
      submittedKeys: [OWN_KEY],
      knownUploads: [upload({ projectId: 99 })],
      actorUserId: OWNER,
      projectId: 7,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result.ok).toBe(false);
  });
});

describe("screenshot keys follow their URL, not the array index", () => {
  const preview = "https://opengraph.githubassets.com/1/acme/app";
  const urlA = "https://utfs.io/f/key-a";
  const urlB = "https://utfs.io/f/key-b";

  it("finds the key for an UploadThing URL even when a keyless preview comes first", () => {
    expect(imageKeyForUrl(urlB, ["key-a", "key-b"])).toBe("key-b");
    expect(imageKeyForUrl(preview, ["key-a", "key-b"])).toBeNull();
  });

  it("keeps the right key for an existing screenshot after the cover preview", () => {
    // Stored with the GitHub preview first: keys are shorter than URLs.
    const result = alignProjectImages({
      submittedUrls: [preview, urlB],
      submittedKeys: ["key-b"],
      knownUploads: [],
      actorUserId: OWNER,
      projectId: 7,
      existingUrls: [preview, urlA, urlB],
      existingKeys: ["key-a", "key-b"],
    });

    expect(result).toEqual({ ok: true, imageUrls: [preview, urlB], imageKeys: ["key-b"] });
  });

  it("stores one UploadThing file once even when two host aliases are submitted", () => {
    const ledgerUrl = `https://app123.ufs.sh/f/${OWN_KEY}`;
    const result = alignProjectImages({
      submittedUrls: [`https://utfs.io/f/${OWN_KEY}`, ledgerUrl],
      submittedKeys: [OWN_KEY],
      knownUploads: [upload({ url: ledgerUrl })],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    });

    expect(result).toEqual({ ok: true, imageUrls: [ledgerUrl], imageKeys: [OWN_KEY] });
  });
});

describe("R2 project uploads", () => {
  const R2_KEY = "projects/user-1/abc.png";
  const R2_URL = `https://cdn.vibedeveloper.id/${R2_KEY}`;

  it("allows the R2 CDN host", () => {
    expect(isAllowedProjectImageUrl(R2_URL)).toBe(true);
    expect(isAllowedProjectImageUrl(`http://cdn.vibedeveloper.id/${R2_KEY}`)).toBe(false);
  });

  it("finds the key for an R2 URL", () => {
    expect(imageKeyForUrl(R2_URL, ["other", R2_KEY])).toBe(R2_KEY);
  });

  it("accepts an R2 upload only with its ledger row and key", () => {
    const base = {
      submittedUrls: [R2_URL],
      knownUploads: [upload({ key: R2_KEY, url: R2_URL })],
      actorUserId: OWNER,
      projectId: null,
      existingUrls: [],
      existingKeys: [],
    };
    expect(alignProjectImages({ ...base, submittedKeys: [R2_KEY] })).toEqual({
      ok: true,
      imageUrls: [R2_URL],
      imageKeys: [R2_KEY],
    });
    expect(alignProjectImages({ ...base, submittedKeys: [] })).toEqual({
      ok: false,
      error: INVALID_PROJECT_IMAGE_MESSAGE,
    });
    expect(alignProjectImages({ ...base, knownUploads: [], submittedKeys: [R2_KEY] })).toEqual({
      ok: false,
      error: INVALID_PROJECT_IMAGE_MESSAGE,
    });
  });
});
