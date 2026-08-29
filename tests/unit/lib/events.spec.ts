import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { submitEvent } from "@/lib/actions/events";
import type { EventFormData } from "@/types/events";

/**
 * Contract tests for the Event submission seam. Mock the db/auth/revalidation
 * modules and pin what submitEvent guarantees:
 *   - validation failure -> no insert
 *   - valid payload -> insert with approved=false, status="upcoming", submittedBy
 *   - slug collision -> retried with a suffixed slug, succeeded
 */

const USER_ID = "0f47d16c-3c2a-4e8e-b9b2-7e8d1f9a11aa";

const validFormData: EventFormData = {
  slug: "ai-workshop-jakarta",
  name: "AI Workshop Jakarta",
  date: "2026-09-15",
  time: "09:00",
  locationType: "offline",
  locationDetail: "Jakarta Hall",
  description: "Belajar Agent AI dari nol sampai production code.",
  organizer: "VibeDev ID",
  registrationUrl: "https://example.com/register",
  coverImage: "https://img.example.com/cover.png",
  category: "workshop",
  status: "upcoming",
  approved: false,
  submittedBy: USER_ID,
};

const h = vi.hoisted(() => {
  const state = {
    slugCheckRows: [] as Array<{ slug: string } | undefined>,
    insertOutcomes: [] as Array<"ok" | "conflict" | "throw">,
    attempted: [] as string[],
    inserted: [] as Record<string, unknown>[],
  };

  function makeQuery(resolveWith: () => unknown[] | Promise<unknown[]>): Record<string, unknown> {
    const q: Record<string, unknown> & { then?: unknown } = {};
    q.where = () => q;
    q.from = () => q;
    q.limit = () => q;
    q.values = () => q;
    q.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
      Promise.resolve(resolveWith()).then(resolve, reject);
    };
    return q;
  }

  return {
    state,
    createMockDb: (s = state) => ({
      select: () =>
        makeQuery(() => {
          const row = s.slugCheckRows.shift();
          return row ? [row] : [];
        }),
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          const outcome = s.insertOutcomes.shift() ?? "ok";
          s.attempted.push(String(values.slug));
          if (outcome === "throw") {
            return Promise.reject(new Error("connection lost"));
          }
          if (outcome === "conflict") {
            return Promise.reject(
              Object.assign(
                new Error('duplicate key value violates unique constraint "events_slug_unique"'),
                { code: "23505" },
              ),
            );
          }
          s.inserted.push(values);
          return Promise.resolve();
        },
      }),
      update: () => ({
        set: () => ({ where: () => Promise.resolve([{ id: "x" }]) }),
        returning: () => ({}),
      }),
      delete: () => ({ returning: () => Promise.resolve([{ id: "x" }]) }),
    }),
  };
});

vi.mock("@/lib/db", () => ({
  getDb: () => h.createMockDb(),
}));

vi.mock("@/lib/server/auth", () => ({
  requireUser: vi.fn(async () => ({ id: USER_ID })),
  requireAdminOrModeratorUser: vi.fn(async () => ({ id: USER_ID, role: 0 })),
}));

vi.mock("@/lib/revalidation", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

beforeEach(() => {
  h.state.slugCheckRows = [];
  h.state.insertOutcomes = [];
  h.state.attempted = [];
  h.state.inserted = [];
});

describe("submitEvent — event submission seam", () => {
  it("rejects invalid payloads without touching the database", async () => {
    const result = await submitEvent({ ...validFormData, name: "" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation failed");
    expect(h.state.inserted).toHaveLength(0);
  });

  it("inserts an unapproved upcoming event for the submitting user", async () => {
    const result = await submitEvent(validFormData);

    expect(result.success).toBe(true);
    expect(h.state.inserted).toHaveLength(1);

    const inserted = h.state.inserted[0];
    expect(inserted.slug).toBe("ai-workshop-jakarta");
    expect(inserted.name).toBe("AI Workshop Jakarta");
    expect(inserted.approved).toBe(false);
    expect(inserted.status).toBe("upcoming");
    expect(inserted.submittedBy).toBe(USER_ID);
    expect(inserted.category).toBe("workshop");
  });

  it("retries with a suffixed slug on a unique collision", async () => {
    h.state.insertOutcomes = ["conflict", "ok"];
    // First slug check: unique. Retry check after collision: the base is taken,
    // so the second candidate resolves unique.
    h.state.slugCheckRows = [undefined, { slug: "ai-workshop-jakarta" }, undefined];

    const result = await submitEvent(validFormData);

    expect(result.success).toBe(true);
    // First attempt fails on collision, so only the retry is recorded as inserted.
    expect(h.state.attempted).toEqual(["ai-workshop-jakarta", "ai-workshop-jakarta-2"]);
    expect(h.state.inserted).toHaveLength(1);
    expect(h.state.inserted[0].slug).toBe("ai-workshop-jakarta-2");
  });

  it("propagates non-slug failures as a generic error", async () => {
    h.state.insertOutcomes = ["throw"];

    const result = await submitEvent(validFormData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("An unexpected error occurred");
  });
});
