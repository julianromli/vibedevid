import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useScreenshotUploads } from "@/components/ui/submit-project-form/use-screenshot-uploads";
import i18n from "@/i18n";

const h = vi.hoisted(() => ({ uploadFiles: vi.fn(), cleanup: vi.fn(), compress: vi.fn() }));

vi.mock("@/lib/image-compression", () => ({ compressImageFile: h.compress }));

vi.mock("@/lib/uploadthing-client", () => ({ uploadFiles: h.uploadFiles }));
vi.mock("@/lib/actions/projects.functions", () => ({
  cleanupProjectProvisionalUploadFn: h.cleanup,
}));

const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const png = (name: string) => new File([new Uint8Array(PNG_HEAD)], name, { type: "image/png" });

function confirmed(key: string) {
  const url = `https://app.ufs.sh/f/${key}`;
  return [{ key, url, serverData: { key, url } }];
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
  URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
  URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  h.uploadFiles.mockReset();
  h.cleanup.mockReset();
  h.cleanup.mockResolvedValue({ success: true });
  h.compress.mockReset();
  h.compress.mockImplementation(async (file: File) => file);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("useScreenshotUploads", () => {
  it("marks a failed file for retry while the other files finish", async () => {
    h.uploadFiles.mockImplementation(async (_endpoint, { files }: { files: File[] }) => {
      if (files[0]?.name === "bad.png") throw new Error("network");
      return confirmed(files[0]?.name ?? "x");
    });
    const { result } = renderHook(() => useScreenshotUploads());

    await act(async () => {
      await result.current.addFiles([png("good.png"), png("bad.png")]);
    });

    await waitFor(() =>
      expect(result.current.shots.map((shot) => shot.status)).toEqual(["done", "error"]),
    );
    expect(result.current.isUploading).toBe(false);

    h.uploadFiles.mockResolvedValueOnce(confirmed("bad-retry"));
    act(() => result.current.retry(result.current.shots[1]?.id ?? ""));

    await waitFor(() => expect(result.current.shots[1]?.status).toBe("done"));
    expect(result.current.shots[1]?.key).toBe("bad-retry");
  });

  it("treats an upload the server never confirmed as failed", async () => {
    h.uploadFiles.mockResolvedValue([{ key: "orphan", url: "https://utfs.io/f/orphan" }]);
    const { result } = renderHook(() => useScreenshotUploads());

    await act(async () => {
      await result.current.addFiles([png("a.png")]);
    });

    await waitFor(() => expect(result.current.shots[0]?.status).toBe("error"));
    expect(result.current.shots[0]?.error).toMatch(/could not be saved/i);
  });

  it("rejects the wrong file type before uploading it", async () => {
    const { result } = renderHook(() => useScreenshotUploads());

    await act(async () => {
      await result.current.addFiles([new File(["x"], "a.gif", { type: "image/gif" })]);
    });

    expect(h.uploadFiles).not.toHaveBeenCalled();
    expect(result.current.shots).toEqual([]);
    expect(result.current.notice).toMatch(/a\.gif/);
  });

  it("deletes the stored file when a finished upload is removed", async () => {
    h.uploadFiles.mockResolvedValue(confirmed("k1"));
    const { result } = renderHook(() => useScreenshotUploads());
    await act(async () => {
      await result.current.addFiles([png("a.png")]);
    });
    await waitFor(() => expect(result.current.shots[0]?.status).toBe("done"));

    act(() => result.current.remove(result.current.shots[0]?.id ?? ""));

    expect(result.current.shots).toEqual([]);
    expect(h.cleanup).toHaveBeenCalledWith({ data: { imageKey: "k1" } });
  });

  it("keeps the GitHub preview as the cover after uploads", async () => {
    h.uploadFiles.mockResolvedValue(confirmed("k1"));
    const { result } = renderHook(() => useScreenshotUploads());
    act(() => result.current.setImported("https://opengraph.githubassets.com/repo"));
    await act(async () => {
      await result.current.addFiles([png("a.png")]);
    });
    await waitFor(() => expect(result.current.shots[1]?.status).toBe("done"));

    expect(result.current.images.imageUrls[0]).toBe("https://opengraph.githubassets.com/repo");
  });

  it("counts files that are still being compressed as uploading", async () => {
    const compressing = deferred<File>();
    h.compress.mockReturnValueOnce(compressing.promise);
    h.uploadFiles.mockResolvedValue(confirmed("k1"));
    const { result } = renderHook(() => useScreenshotUploads());

    let adding: Promise<void> = Promise.resolve();
    act(() => {
      adding = result.current.addFiles([png("a.png")]);
    });
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      compressing.resolve(png("a.png"));
      await adding;
    });
    await waitFor(() => expect(result.current.shots[0]?.status).toBe("done"));
    expect(result.current.isUploading).toBe(false);
  });

  it("discardAll stops queued uploads and deletes files that finish later", async () => {
    const pending = new Map<string, (value: unknown) => void>();
    h.uploadFiles.mockImplementation(
      (_endpoint, { files }: { files: File[] }) =>
        new Promise((resolve) => pending.set(files[0]?.name ?? "", resolve)),
    );
    const { result } = renderHook(() => useScreenshotUploads());
    await act(async () => {
      await result.current.addFiles(["a", "b", "c", "d"].map((n) => png(`${n}.png`)));
    });
    expect(h.uploadFiles).toHaveBeenCalledTimes(3);

    act(() => result.current.discardAll());
    await act(async () => {
      pending.get("a.png")?.(confirmed("late-a"));
      await Promise.resolve();
    });

    await waitFor(() => expect(h.cleanup).toHaveBeenCalledWith({ data: { imageKey: "late-a" } }));
    expect(h.uploadFiles).toHaveBeenCalledTimes(3);
  });

  it("deletes finished uploads on unmount unless they were released to a project", async () => {
    h.uploadFiles.mockResolvedValue(confirmed("k1"));
    const first = renderHook(() => useScreenshotUploads());
    await act(async () => {
      await first.result.current.addFiles([png("a.png")]);
    });
    await waitFor(() => expect(first.result.current.shots[0]?.status).toBe("done"));
    first.unmount();
    expect(h.cleanup).toHaveBeenCalledWith({ data: { imageKey: "k1" } });

    h.cleanup.mockClear();
    const second = renderHook(() => useScreenshotUploads());
    await act(async () => {
      await second.result.current.addFiles([png("b.png")]);
    });
    await waitFor(() => expect(second.result.current.shots[0]?.status).toBe("done"));
    act(() => second.result.current.release());
    second.unmount();
    expect(h.cleanup).not.toHaveBeenCalled();
  });

  it("rejects a non-image renamed to .png before uploading it", async () => {
    const { result } = renderHook(() => useScreenshotUploads());

    await act(async () => {
      await result.current.addFiles([
        new File(["not an image"], "fake.png", { type: "image/png" }),
      ]);
    });

    expect(h.uploadFiles).not.toHaveBeenCalled();
    expect(result.current.shots).toEqual([]);
    expect(result.current.notice).toMatch(/fake\.png/);
  });

  it("asks the server to delete stored uploads when the page is closed or reloaded", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    h.uploadFiles.mockResolvedValueOnce(confirmed("k1"));
    const { result } = renderHook(() => useScreenshotUploads());
    await act(async () => {
      await result.current.addFiles([png("a.png")]);
    });
    await waitFor(() => expect(result.current.shots[0]?.status).toBe("done"));

    window.dispatchEvent(new Event("pagehide"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/project-uploads/cleanup");
    expect(init).toMatchObject({ method: "POST", keepalive: true });
    expect(JSON.parse(String(init.body))).toEqual({ keys: ["k1"] });
  });

  it("keeps released uploads when the page is closed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    h.uploadFiles.mockResolvedValueOnce(confirmed("k1"));
    const { result } = renderHook(() => useScreenshotUploads());
    await act(async () => {
      await result.current.addFiles([png("a.png")]);
    });
    await waitFor(() => expect(result.current.shots[0]?.status).toBe("done"));
    act(() => result.current.release());

    window.dispatchEvent(new Event("pagehide"));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cleans up on page close again after resume", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    h.uploadFiles.mockResolvedValueOnce(confirmed("k1"));
    const { result } = renderHook(() => useScreenshotUploads());
    await act(async () => {
      await result.current.addFiles([png("a.png")]);
    });
    await waitFor(() => expect(result.current.shots[0]?.status).toBe("done"));
    act(() => result.current.release());
    act(() => result.current.resume());

    window.dispatchEvent(new Event("pagehide"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
