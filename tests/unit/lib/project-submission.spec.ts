import { describe, expect, it } from "vite-plus/test";
import {
  buildProjectFieldErrors,
  buildProjectSubmissionSchema,
  formatProjectFieldErrors,
  PROJECT_FORM_FIELDS,
  PROJECT_LIMITS,
  readProjectFormData,
} from "@/lib/project-submission";

/**
 * Shape-regression tests for the shared Project submission validation module.
 * Pure zod — no database, no React. These lock the wire contract that both
 * the submit and edit flows (client and server) consume.
 */

function formDataOf(overrides: Partial<Record<string, string>>): FormData {
  const formData = new FormData();
  const defaults: Record<string, string> = {
    title: "Pijar Mahir",
    tagline: "",
    description:
      "A learning platform for Indonesian students that helps them prepare for national exams with video lessons and practice questions.",
    category: "education",
    websiteUrl: "",
    image_urls: JSON.stringify(["https://img.example.com/1.png"]),
    image_keys: JSON.stringify(["key-1"]),
    tags: JSON.stringify(["edtech"]),
  };

  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    if (value !== undefined) formData.set(key, value);
  }

  return formData;
}

describe("PROJECT_LIMITS — one truth for field bounds", () => {
  it("exposes the limits both clients and server previously duplicated", () => {
    expect(PROJECT_LIMITS.MAX_TITLE_LENGTH).toBe(120);
    expect(PROJECT_LIMITS.MIN_TITLE_LENGTH).toBe(3);
    expect(PROJECT_LIMITS.MAX_TAGLINE_LENGTH).toBe(160);
    expect(PROJECT_LIMITS.MIN_TAGLINE_LENGTH).toBe(10);
    expect(PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH).toBe(1600);
    expect(PROJECT_LIMITS.MIN_DESCRIPTION_LENGTH).toBe(30);
    expect(PROJECT_LIMITS.MIN_DESCRIPTION_WORDS).toBe(5);
    expect(PROJECT_LIMITS.MAX_TAG_COUNT).toBe(10);
    expect(PROJECT_LIMITS.MAX_TAG_LENGTH).toBe(32);
    expect(PROJECT_LIMITS.MAX_IMAGE_COUNT).toBe(10);
  });
});

describe("buildProjectSubmissionSchema — per-field rules", () => {
  it("accepts a valid submission", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({})));
    expect(result.success).toBe(true);
  });

  it("rejects short titles with the server message", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({ title: "ab" })));
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.title).toContain("Title must be at least 3 characters");
  });

  it("rejects taglines in the forbidden mid-range (1-9 chars)", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({ tagline: "short" })));
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.tagline).toContain("Tagline must be at least 10 characters or left empty");
  });

  it("accepts an empty tagline", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({ tagline: "" })));
    expect(result.success).toBe(true);
  });

  it("rejects descriptions with too few meaningful words", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(
      readProjectFormData(
        formDataOf({ description: "hello world !!! ... ... ... ... ... ... ..." }),
      ),
    );
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.description).toContain(
      "Description must clearly explain what your project does",
    );
  });

  it("rejects a website url the normalizer cannot canonicalize", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({ website_url: "not a url" })));
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.website_url).toContain("Enter a valid website URL");
  });

  it("normalizes a bare host into https when valid", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(
      readProjectFormData(formDataOf({ website_url: "example.com" })),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.websiteUrl).toBe("https://example.com");
    }
  });

  it("rejects empty image lists", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(
      readProjectFormData(formDataOf({ image_urls: JSON.stringify([]) })),
    );
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.image_urls).toContain("At least one project screenshot is required");
  });

  it("rejects non-array image values", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({ image_urls: "not-json" })));
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.image_urls).toContain("Invalid image URLs format");
  });

  it("normalizes and dedupes tags", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(
      readProjectFormData(formDataOf({ tags: JSON.stringify(["EdTech", "edtech", "  AI  "]) })),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["edtech", "ai"]);
    }
  });

  it("rejects too many tags", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const manyTags = Array.from({ length: 11 }, (_, index) => `tag-${index}`);
    const result = schema.safeParse(
      readProjectFormData(formDataOf({ tags: JSON.stringify(manyTags) })),
    );
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.tags).toContain("Use 10 tags or fewer");
  });

  it("rejects inactive categories when category names are provided", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({ category: "obsolete" })));
    expect(result.success).toBe(false);
    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.category).toContain("Choose an active category");
  });

  it("accepts any category when no category names are provided (edit path)", () => {
    const schema = buildProjectSubmissionSchema();
    const result = schema.safeParse(readProjectFormData(formDataOf({ category: "anything" })));
    expect(result.success).toBe(true);
  });
});

describe("buildProjectFieldErrors + formatProjectFieldErrors — wire contract", () => {
  it("maps camelCase schema keys to snake_case wire names", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(readProjectFormData(formDataOf({ website_url: "not a url" })));
    expect(result.success).toBe(false);

    const fieldErrors = buildProjectFieldErrors(result.error!);
    expect(fieldErrors.website_url).toContain("Enter a valid website URL");
    expect(fieldErrors).not.toHaveProperty("websiteUrl");
  });

  it("formats field errors into a single human-readable string", () => {
    const schema = buildProjectSubmissionSchema(["education"]);
    const result = schema.safeParse(
      readProjectFormData(
        formDataOf({
          title: "ab",
          image_urls: "not-json",
        }),
      ),
    );
    expect(result.success).toBe(false);

    const formatted = formatProjectFieldErrors(buildProjectFieldErrors(result.error!));
    expect(formatted).toContain("Title: Title must be at least 3 characters");
    expect(formatted).toContain("Image urls: Invalid image URLs format");
  });
});

describe("PROJECT_FORM_FIELDS — seam contract names", () => {
  it("uses the same field names across flows", () => {
    expect(PROJECT_FORM_FIELDS.title).toBe("title");
    expect(PROJECT_FORM_FIELDS.websiteUrl).toBe("website_url");
    expect(PROJECT_FORM_FIELDS.imageUrls).toBe("image_urls");
    expect(PROJECT_FORM_FIELDS.imageKeys).toBe("image_keys");
    expect(PROJECT_FORM_FIELDS.tags).toBe("tags");
  });
});
