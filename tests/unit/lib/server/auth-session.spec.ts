import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const getSession = vi.fn(async () => null);
const getDb = vi.fn(() => ({ delete: vi.fn(() => ({ where: vi.fn(async () => []) })) }));

vi.mock("@/lib/auth/server", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => {
    throw new Error("no request");
  },
  getRequestHeaders: () => new Headers(),
}));

const { getServerSession } = await import("@/lib/server/auth");

describe("getServerSession", () => {
  beforeEach(() => {
    getDb.mockClear();
    getSession.mockClear();
  });

  it("only resolves the session; expired-row cleanup runs from the cron", async () => {
    await getServerSession(new Headers());
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(getDb).not.toHaveBeenCalled();
  });
});
