import { describe, expect, it } from "vite-plus/test";
import { getConfirmedUpload } from "@/lib/project-upload-result";

describe("getConfirmedUpload", () => {
  it("returns the URL and key the server recorded", () => {
    expect(
      getConfirmedUpload({
        serverData: { url: "https://app.ufs.sh/f/k1", key: "k1" },
        url: "https://utfs.io/f/k1",
        key: "k1",
      }),
    ).toEqual({ url: "https://app.ufs.sh/f/k1", key: "k1" });
  });

  it("does not fall back to the client URL when the server sent nothing", () => {
    expect(getConfirmedUpload({ url: "https://utfs.io/f/k1", key: "k1" })).toBeNull();
    expect(
      getConfirmedUpload({ serverData: null, url: "https://utfs.io/f/k1", key: "k1" }),
    ).toBeNull();
    expect(getConfirmedUpload({ serverData: { url: "https://app.ufs.sh/f/k1" } })).toBeNull();
    expect(getConfirmedUpload(undefined)).toBeNull();
  });
});
