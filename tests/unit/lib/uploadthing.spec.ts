import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { uploadAnonymousImage } from "@/lib/uploadthing";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function makeFile(bytes: Uint8Array, type: string, name: string): File {
  const copy = bytes.slice();
  return {
    type,
    size: copy.byteLength,
    name,
    arrayBuffer: async () => copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength),
  } as File;
}

const VALID_TOKEN = globalThis.btoa(
  JSON.stringify({ apiKey: "sk_test", appId: "app_test", regions: ["sea1"] }),
);

const h = vi.hoisted(() => {
  const state = {
    token: globalThis.btoa(
      JSON.stringify({ apiKey: "sk_test", appId: "app_test", regions: ["sea1"] }),
    ),
    constructedWith: [] as Array<{ token?: string } | undefined>,
  };

  return {
    state,
    UTApi: class {
      constructor(options?: { token?: string }) {
        state.constructedWith.push(options);
      }
      uploadFiles = vi.fn(async () => ({
        data: {
          url: "https://utfs.io/avatar.webp",
          key: "avatar-key",
          ufsUrl: "https://utfs.io/avatar.webp",
        },
      }));
    },
  };
});

vi.mock("@/lib/server/runtime-secrets", () => ({
  getServerRuntimeSecrets: () => ({
    uploadthingToken: h.state.token,
  }),
}));

vi.mock("uploadthing/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("uploadthing/server")>();
  return {
    ...actual,
    UTApi: h.UTApi,
  };
});

beforeEach(() => {
  h.state.token = VALID_TOKEN;
  h.state.constructedWith = [];
});

describe("uploadAnonymousImage", () => {
  it("constructs UTApi with the Worker runtime token, not process.env", async () => {
    await uploadAnonymousImage(makeFile(PNG_BYTES, "image/png", "avatar.png"));

    expect(h.state.constructedWith).toHaveLength(1);
    expect(h.state.constructedWith[0]?.token).toBe(VALID_TOKEN);
  });

  it("rejects a placeholder token before it calls UploadThing", async () => {
    h.state.token = "REPLACE_UPLOADTHING_TOKEN";

    await expect(
      uploadAnonymousImage(makeFile(PNG_BYTES, "image/png", "avatar.png")),
    ).rejects.toThrow(/UPLOADTHING_TOKEN is invalid/);
    expect(h.state.constructedWith).toHaveLength(0);
  });
});
