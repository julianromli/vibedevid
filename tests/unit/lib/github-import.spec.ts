import { describe, expect, it } from "vite-plus/test";
import { githubApiHeaders, githubImportErrorCode } from "@/lib/github-import";

describe("githubApiHeaders", () => {
  it("always sends a User-Agent, which the GitHub API requires", () => {
    expect(githubApiHeaders()["User-Agent"]).toBeTruthy();
  });

  it("adds the token only when one is configured", () => {
    expect(githubApiHeaders().Authorization).toBeUndefined();
    expect(githubApiHeaders("t0k").Authorization).toBe("Bearer t0k");
  });
});

describe("githubImportErrorCode", () => {
  const headers = (init: Record<string, string> = {}) => new Headers(init);

  it("maps 404 to notFound (also what GitHub returns for private repos)", () => {
    expect(githubImportErrorCode(404, headers())).toBe("notFound");
  });

  it("maps 429 and a 403 with no quota left to rateLimited", () => {
    expect(githubImportErrorCode(429, headers())).toBe("rateLimited");
    expect(githubImportErrorCode(403, headers({ "x-ratelimit-remaining": "0" }))).toBe(
      "rateLimited",
    );
  });

  it("maps any other failure to failed", () => {
    expect(githubImportErrorCode(403, headers({ "x-ratelimit-remaining": "42" }))).toBe("failed");
    expect(githubImportErrorCode(500, headers())).toBe("failed");
  });
});
