import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { UPLOAD_TIMEOUT_MS, uploadImageOfKind } from "@/lib/image-upload-client";

type Sent = { method: string; url: string; headers: Record<string, string>; body: unknown };

let sent: Sent[] = [];
let reply: { status: number; body: string; hang?: boolean } = { status: 200, body: "{}" };
let lastXhr: FakeXhr | null = null;

class FakeXhr {
  status = 0;
  responseText = "";
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  timeout = 0;
  private request: Sent = { method: "", url: "", headers: {}, body: null };
  open(method: string, url: string) {
    this.request.method = method;
    this.request.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.request.headers[name] = value;
  }
  abort() {
    this.onabort?.();
  }
  send(body: unknown) {
    this.request.body = body;
    sent.push(this.request);
    lastXhr = this;
    if (reply.hang) return;
    this.status = reply.status;
    this.responseText = reply.body;
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  sent = [];
  lastXhr = null;
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadImageOfKind", () => {
  it("posts the raw file to the kind's upload route and returns the stored url", async () => {
    reply = {
      status: 200,
      body: JSON.stringify({
        key: "blog/u/a.png",
        url: "https://cdn.vibedeveloper.id/blog/u/a.png",
      }),
    };
    const file = new File([new Uint8Array([1])], "a.png", { type: "image/png" });

    const result = await uploadImageOfKind("blog", file);

    expect(result).toEqual({
      key: "blog/u/a.png",
      url: "https://cdn.vibedeveloper.id/blog/u/a.png",
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      method: "POST",
      url: "/api/uploads/image?kind=blog",
      headers: { "Content-Type": "image/png" },
      body: file,
    });
  });

  it("sends the WebP-compressed file, capped at the kind's max edge", async () => {
    reply = {
      status: 200,
      body: JSON.stringify({
        key: "avatars/u/a.webp",
        url: "https://cdn.vibedeveloper.id/avatars/u/a.webp",
      }),
    };
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 2000, height: 1000, close: () => {} })),
    );
    const drawImage = vi.fn();
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback) => callback(new Blob(["webp"], { type: "image/webp" })));
    const photo = new File([new Uint8Array(5000)], "me.jpg", { type: "image/jpeg" });

    try {
      await uploadImageOfKind("avatars", photo);
    } finally {
      getContext.mockRestore();
      toBlob.mockRestore();
    }

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 512, 256);
    const body = sent[0]?.body as File;
    expect(body.name).toBe("me.webp");
    expect(sent[0]?.headers["Content-Type"]).toBe("image/webp");
  });

  it("rejects with the server's error message", async () => {
    reply = { status: 413, body: JSON.stringify({ error: "Avatars must be 2MB or smaller" }) };
    const file = new File([new Uint8Array([1])], "a.png", { type: "image/png" });

    await expect(uploadImageOfKind("avatars", file)).rejects.toThrow(
      "Avatars must be 2MB or smaller",
    );
  });

  it("rejects when the server answers without a url", async () => {
    reply = { status: 200, body: "{}" };
    const file = new File([new Uint8Array([1])], "a.png", { type: "image/png" });

    await expect(uploadImageOfKind("events", file)).rejects.toThrow("Upload failed");
  });

  it("gives up after the upload timeout instead of hanging", async () => {
    reply = { status: 200, body: "{}", hang: true };
    const file = new File([new Uint8Array([1])], "a.png", { type: "image/png" });

    const pending = uploadImageOfKind("events", file);
    expect(UPLOAD_TIMEOUT_MS).toBe(120_000);
    // The request starts once the file has been compressed.
    await vi.waitFor(() => expect(lastXhr?.timeout).toBe(UPLOAD_TIMEOUT_MS));
    lastXhr?.ontimeout?.();

    await expect(pending).rejects.toThrow("Upload timed out");
  });
});
