export type GitHubImportErrorCode = "notFound" | "rateLimited" | "invalidUrl" | "failed";

/** GitHub's REST API rejects requests without a User-Agent (403), and Workers fetch sends none. */
export const GITHUB_USER_AGENT = "vibedevid-github-import";

export function githubApiHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": GITHUB_USER_AGENT,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function githubImportErrorCode(status: number, headers: Headers): GitHubImportErrorCode {
  if (status === 404) return "notFound";
  if (status === 429) return "rateLimited";
  if (status === 403 && headers.get("x-ratelimit-remaining") === "0") return "rateLimited";
  return "failed";
}
