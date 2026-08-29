import { describe, expect, it } from "vite-plus/test";
import { isUploadthingTokenShape } from "@/lib/uploadthing-token";

function encodeToken(payload: unknown): string {
  return globalThis.btoa(JSON.stringify(payload));
}

describe("isUploadthingTokenShape", () => {
  it("accepts a base64 JSON token with apiKey, appId, and regions", () => {
    const token = encodeToken({
      apiKey: "sk_test",
      appId: "app_test",
      regions: ["sea1"],
    });

    expect(isUploadthingTokenShape(token)).toBe(true);
  });

  it("rejects a placeholder or API-key string", () => {
    expect(isUploadthingTokenShape("REPLACE_UPLOADTHING_TOKEN")).toBe(false);
    expect(isUploadthingTokenShape("sk_live_not_a_token")).toBe(false);
    expect(isUploadthingTokenShape("")).toBe(false);
  });
});
