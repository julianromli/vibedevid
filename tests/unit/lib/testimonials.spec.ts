import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  approveTestimonial,
  rejectTestimonial,
  submitTestimonial,
} from "@/lib/actions/testimonials";
import { deleteUploadthingFiles, uploadAnonymousImage } from "@/lib/uploadthing";

const TESTIMONIAL_ID = "0f47d16c-3c2a-4e8e-b9b2-7e8d1f9a11aa";

function makeFile(bytes: Uint8Array, type: string, name: string): File {
  const copy = bytes.slice();
  return {
    type,
    size: copy.byteLength,
    name,
    arrayBuffer: async () => copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength),
  } as File;
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0, 0, 0, 0]);
const validAvatar = makeFile(PNG_BYTES, "image/png", "avatar.png");

const validInput = {
  fullName: "Rizki Pratama",
  role: "Frontend Developer, Tokopedia",
  body: "VibeDev ID ngubah cara gue belajar coding bareng komunitas.",
  honeypot: "",
  avatar: validAvatar,
  ipHash: "abc123",
};

const h = vi.hoisted(() => {
  const state = {
    rateCount: 0,
    insertOutcome: "ok" as "ok" | "throw",
    inserted: [] as Record<string, unknown>[],
    updated: [] as Record<string, unknown>[],
  };

  return {
    state,
    createMockDb: (s = state) => ({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([{ value: s.rateCount }]),
        }),
      }),
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          if (s.insertOutcome === "throw") {
            return Promise.reject(new Error("insert failed"));
          }
          s.inserted.push(values);
          return Promise.resolve();
        },
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: () => ({
            returning: () => {
              s.updated.push(values);
              return Promise.resolve([{ id: TESTIMONIAL_ID }]);
            },
          }),
        }),
      }),
    }),
  };
});

vi.mock("@/lib/db", () => ({
  getDb: () => h.createMockDb(),
}));

vi.mock("@/lib/server/auth", () => ({
  requireUser: vi.fn(async () => ({ id: TESTIMONIAL_ID })),
}));

vi.mock("@/lib/auth/permissions", () => ({
  requireAdmin: vi.fn(async () => undefined),
}));

vi.mock("@/lib/uploadthing", () => ({
  uploadAnonymousImage: vi.fn(async () => ({
    url: "https://utfs.io/avatar.webp",
    key: "avatar-key",
  })),
  deleteUploadthingFiles: vi.fn(async () => ({
    success: true,
    deletedCount: 1,
  })),
}));

vi.mock("@/lib/server/testimonials-public", () => ({
  invalidateApprovedTestimonialsCache: vi.fn(async () => undefined),
}));

beforeEach(() => {
  h.state.rateCount = 0;
  h.state.insertOutcome = "ok";
  h.state.inserted = [];
  h.state.updated = [];
  vi.mocked(uploadAnonymousImage).mockClear();
  vi.mocked(deleteUploadthingFiles).mockClear();
});

describe("submitTestimonial", () => {
  it("rejects invalid payloads without inserting", async () => {
    const result = await submitTestimonial({ ...validInput, fullName: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Validation failed");
    }
    expect(h.state.inserted).toHaveLength(0);
  });

  it("returns success and skips insert when the honeypot is filled", async () => {
    const result = await submitTestimonial({ ...validInput, honeypot: "http://bot.test" });

    expect(result.success).toBe(true);
    expect(h.state.inserted).toHaveLength(0);
  });

  it("inserts a pending testimonial", async () => {
    const result = await submitTestimonial(validInput);

    expect(result.success).toBe(true);
    expect(h.state.inserted).toHaveLength(1);
    expect(h.state.inserted[0]?.status).toBe("pending");
    expect(h.state.inserted[0]?.fullName).toBe("Rizki Pratama");
    expect(h.state.inserted[0]?.avatarUrl).toBe("https://utfs.io/avatar.webp");
    expect(h.state.inserted[0]?.ipHash).toBe("abc123");
  });

  it("rejects a spoofed image MIME without uploading", async () => {
    const result = await submitTestimonial({
      ...validInput,
      avatar: makeFile(PDF_BYTES, "image/png", "avatar.png"),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Foto harus JPG, PNG, atau WebP");
    }
    expect(uploadAnonymousImage).not.toHaveBeenCalled();
    expect(h.state.inserted).toHaveLength(0);
  });

  it("deletes the uploaded file when insert fails", async () => {
    h.state.insertOutcome = "throw";

    const result = await submitTestimonial(validInput);

    expect(result.success).toBe(false);
    expect(h.state.inserted).toHaveLength(0);
    expect(deleteUploadthingFiles).toHaveBeenCalledWith("avatar-key");
  });

  it("blocks a fourth submit in the rate window", async () => {
    h.state.rateCount = 3;
    const result = await submitTestimonial(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Terlalu banyak");
    }
    expect(h.state.inserted).toHaveLength(0);
  });
});

describe("approve and reject", () => {
  it("sets approved with a new approvedAt", async () => {
    const result = await approveTestimonial(TESTIMONIAL_ID);

    expect(result.success).toBe(true);
    expect(h.state.updated[0]?.status).toBe("approved");
    expect(h.state.updated[0]?.approvedAt).toBeInstanceOf(Date);
  });

  it("sets rejected and keeps the row", async () => {
    const result = await rejectTestimonial(TESTIMONIAL_ID);

    expect(result.success).toBe(true);
    expect(h.state.updated[0]?.status).toBe("rejected");
    expect(h.state.updated[0]?.approvedAt).toBeUndefined();
  });
});
