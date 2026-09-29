import { describe, expect, it } from "vite-plus/test";
import {
  alignProjectImages,
  INVALID_PROJECT_IMAGE_MESSAGE,
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
