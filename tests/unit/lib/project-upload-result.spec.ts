import { describe, expect, it } from "vite-plus/test";
import { getConfirmedUpload } from "@/lib/project-upload-result";

const KEY = "projects/user-1/k1.png";
const URL_ = `https://cdn.vibedeveloper.id/${KEY}`;

describe("getConfirmedUpload", () => {
  it("returns the URL and key the server recorded", () => {
    expect(getConfirmedUpload({ serverData: { url: URL_, key: KEY } })).toEqual({
      url: URL_,
      key: KEY,
    });
  });

  it("returns null when the server sent nothing", () => {
    expect(getConfirmedUpload({ serverData: null })).toBeNull();
    expect(getConfirmedUpload({ serverData: { url: URL_ } })).toBeNull();
    expect(getConfirmedUpload(undefined)).toBeNull();
  });

  it("returns null when the URL is not the CDN URL for the key", () => {
    expect(
      getConfirmedUpload({ serverData: { url: "https://evil.example/x.png", key: KEY } }),
    ).toBeNull();
    expect(
      getConfirmedUpload({
        serverData: { url: "https://cdn.vibedeveloper.id/projects/user-2/k1.png", key: KEY },
      }),
    ).toBeNull();
  });
});
