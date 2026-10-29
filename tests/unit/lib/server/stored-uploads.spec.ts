import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const h = vi.hoisted(() => ({
  deleteUploadthingFiles: vi.fn(),
  r2Delete: vi.fn(),
}));

vi.mock("@/lib/uploadthing", () => ({ deleteUploadthingFiles: h.deleteUploadthingFiles }));

import { deleteStoredProjectFiles } from "@/lib/server/stored-uploads";

const R2_KEY = "projects/user-1/abc.png";

beforeEach(() => {
  h.deleteUploadthingFiles.mockReset();
  h.deleteUploadthingFiles.mockResolvedValue({ success: true, deletedCount: 1 });
  h.r2Delete.mockReset();
  h.r2Delete.mockResolvedValue(undefined);
  (globalThis as { __env__?: unknown }).__env__ = {
    PROJECT_UPLOADS: { put: vi.fn(), delete: h.r2Delete },
  };
});

describe("deleteStoredProjectFiles", () => {
  it("deletes R2 keys from the bucket and the rest from UploadThing", async () => {
    const result = await deleteStoredProjectFiles([R2_KEY, "utkey1", " "]);
    expect(h.r2Delete).toHaveBeenCalledWith([R2_KEY]);
    expect(h.deleteUploadthingFiles).toHaveBeenCalledWith(["utkey1"]);
    expect(result).toEqual({ success: true, deletedCount: 2 });
  });

  it("does not call UploadThing for R2-only keys", async () => {
    const result = await deleteStoredProjectFiles(R2_KEY);
    expect(h.deleteUploadthingFiles).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, deletedCount: 1 });
  });

  it("reports failure when the bucket binding is missing", async () => {
    (globalThis as { __env__?: unknown }).__env__ = {};
    const result = await deleteStoredProjectFiles([R2_KEY]);
    expect(result).toEqual({ success: false, deletedCount: 0 });
  });
});
