import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { uploadImageOfKind } from "@/lib/image-upload-client";

type Sent = { method: string; url: string; headers: Record<string, string>; body: unknown };

let sent: Sent[] = [];
let reply: { status: number; body: string } = { status: 200, body: "{}" };

class FakeXhr {
  status = 0;
  responseText = "";
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
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
    this.status = reply.status;
    this.responseText = reply.body;
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  sent = [];
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
});
