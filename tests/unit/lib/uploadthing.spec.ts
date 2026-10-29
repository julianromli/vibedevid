import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { deleteUploadthingFiles } from "@/lib/uploadthing";

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
      deleteFiles = vi.fn(async () =>
        Object.assign(Object.create({ toJSON() {} }), { success: true, deletedCount: 1 }),
      );
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

describe("legacy UTApi client", () => {
  it("constructs UTApi with the Worker runtime token, not process.env", async () => {
    await deleteUploadthingFiles("k1");

    expect(h.state.constructedWith).toHaveLength(1);
    expect(h.state.constructedWith[0]?.token).toBe(VALID_TOKEN);
  });

  it("rejects a placeholder token before it calls UploadThing", async () => {
    h.state.token = "REPLACE_UPLOADTHING_TOKEN";

    await expect(deleteUploadthingFiles("k2")).rejects.toThrow(/UPLOADTHING_TOKEN is invalid/);
  });
});

describe("deleteUploadthingFiles", () => {
  it("returns a plain object a server function can serialize", async () => {
    const result = await deleteUploadthingFiles("k1");

    expect(result).toEqual({ success: true, deletedCount: 1 });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });
});
