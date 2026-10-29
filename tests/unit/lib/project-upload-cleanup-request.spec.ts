import { describe, expect, it, vi } from "vite-plus/test";
import { handleUploadCleanupRequest } from "@/lib/project-upload-cleanup-request";

const URL_ = "https://vibedeveloper.id/api/project-uploads/cleanup";

function post(body: unknown, origin = "https://vibedeveloper.id") {
  return new Request(URL_, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

describe("handleUploadCleanupRequest", () => {
  it("cleans up each listed key once", async () => {
    const cleanup = vi.fn().mockResolvedValue({ success: true });
    const res = await handleUploadCleanupRequest(post({ keys: ["a", "b", "a"] }), cleanup);
    expect(res.status).toBe(200);
    expect(cleanup.mock.calls.map((call) => call[0])).toEqual(["a", "b"]);
  });

  it("refuses requests from another site", async () => {
    const cleanup = vi.fn();
    const res = await handleUploadCleanupRequest(
      post({ keys: ["a"] }, "https://evil.example"),
      cleanup,
    );
    expect(res.status).toBe(403);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("rejects a malformed or oversized body", async () => {
    const cleanup = vi.fn();
    expect((await handleUploadCleanupRequest(post({ keys: "a" }), cleanup)).status).toBe(400);
    const many = Array.from({ length: 11 }, (_, i) => `k${i}`);
    expect((await handleUploadCleanupRequest(post({ keys: many }), cleanup)).status).toBe(400);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("accepts keys as long as project submission allows", async () => {
    const cleanup = vi.fn().mockResolvedValue({ success: true });
    const res = await handleUploadCleanupRequest(post({ keys: ["k".repeat(512)] }), cleanup);
    expect(res.status).toBe(200);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
