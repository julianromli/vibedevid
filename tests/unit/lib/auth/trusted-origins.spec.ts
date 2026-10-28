import { describe, expect, it } from "vite-plus/test";
import { previewTrustedOrigins } from "@/lib/auth/trusted-origins";

const SUFFIX = "-vibedevid.faizintifada.workers.dev";

function post(url: string) {
  return new Request(url, { method: "POST" });
}

describe("previewTrustedOrigins", () => {
  it("trusts a branch preview of this worker, on its own host only", () => {
    const req = post(
      `https://fix-submit-project-flow${SUFFIX}/api/auth/email-otp/send-verification-otp`,
    );
    expect(previewTrustedOrigins(req, SUFFIX)).toEqual([
      `https://fix-submit-project-flow${SUFFIX}`,
    ]);
  });

  it("trusts a commit preview of this worker", () => {
    expect(previewTrustedOrigins(post(`https://5347cfc8${SUFFIX}/x`), SUFFIX)).toEqual([
      `https://5347cfc8${SUFFIX}`,
    ]);
  });

  it("adds nothing on the production host", () => {
    expect(previewTrustedOrigins(post("https://vibedeveloper.id/api/auth/x"), SUFFIX)).toEqual([]);
  });

  it("adds nothing for other workers or look-alike hosts", () => {
    for (const url of [
      "https://other.faizintifada.workers.dev/x",
      "https://vibedevid.faizintifada.workers.dev.evil.com/x",
      `https://a.b${SUFFIX}/x`,
      `http://fix${SUFFIX}/x`,
      `https://${SUFFIX.slice(1)}/x`,
    ]) {
      expect(previewTrustedOrigins(post(url), SUFFIX), url).toEqual([]);
    }
  });

  it("adds nothing without a request or a configured suffix", () => {
    expect(previewTrustedOrigins(undefined, SUFFIX)).toEqual([]);
    expect(previewTrustedOrigins(post(`https://fix${SUFFIX}/x`), "")).toEqual([]);
  });
});
