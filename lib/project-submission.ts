import { z } from "zod";
import { normalizeProjectWebsiteUrl } from "@/lib/project-url";

/**
 * Project submission validation — one truth for the whole submitted-form seam.
 *
 * This module is dependency-light (zod + pure helpers only) so it is importable
 * from both the server actions and the client forms. It owns:
 *   - PROJECT_FORM_FIELDS: the cross-seam FormData field names + wire error keys
 *   - PROJECT_LIMITS: every min/max constant
 *   - the per-field schemas, composed by buildProjectSubmissionSchema()
 *   - the zod-issue -> wire fieldErrors flattening and display formatting
 *
 * Rule focus: the server is authoritative; the client can now run the same
 * schema so its warnings match the rules that will actually be enforced.
 */

export const PROJECT_FORM_FIELDS = {
  title: "title",
  tagline: "tagline",
  description: "description",
  category: "category",
  websiteUrl: "website_url",
  imageUrls: "image_urls",
  imageKeys: "image_keys",
  tags: "tags",
} as const;

export type ProjectFormFieldName = (typeof PROJECT_FORM_FIELDS)[keyof typeof PROJECT_FORM_FIELDS];

export const PROJECT_LIMITS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 120,
  MIN_TAGLINE_LENGTH: 10,
  MAX_TAGLINE_LENGTH: 160,
  MIN_DESCRIPTION_LENGTH: 30,
  MAX_DESCRIPTION_LENGTH: 1600,
  MIN_DESCRIPTION_WORDS: 5,
  MAX_TAG_COUNT: 10,
  MAX_TAG_LENGTH: 32,
  MAX_IMAGE_COUNT: 10,
} as const;

export type ProjectScreenshotFieldErrors = Partial<Record<ProjectFormFieldName, string[]>>;

const hasLettersOrNumbers = (value: string): boolean => /[a-z0-9]/i.test(value);

const hasMeaningfulDescription = (value: string): boolean => {
  const words = value.match(/[a-z0-9][a-z0-9''+.#/-]*/gi) ?? [];
  return words.length >= PROJECT_LIMITS.MIN_DESCRIPTION_WORDS;
};

const addFieldIssue = (ctx: z.RefinementCtx, message: string, path: string) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path: [path],
  });
};

/**
 * Per-field schemas. The `.superRefine` consumers use snake_case KNOWN paths so
 * `buildProjectFieldErrors` can map them to wire names directly.
 */

const titleSchema = z
  .string()
  .trim()
  .min(
    PROJECT_LIMITS.MIN_TITLE_LENGTH,
    `Title must be at least ${PROJECT_LIMITS.MIN_TITLE_LENGTH} characters`,
  )
  .max(
    PROJECT_LIMITS.MAX_TITLE_LENGTH,
    `Title must be ${PROJECT_LIMITS.MAX_TITLE_LENGTH} characters or fewer`,
  )
  .refine(hasLettersOrNumbers, "Title must include letters or numbers");

const taglineSchema = z
  .string()
  .trim()
  .max(
    PROJECT_LIMITS.MAX_TAGLINE_LENGTH,
    `Tagline must be ${PROJECT_LIMITS.MAX_TAGLINE_LENGTH} characters or fewer`,
  )
  .refine(
    (value) => value.length === 0 || value.length >= PROJECT_LIMITS.MIN_TAGLINE_LENGTH,
    `Tagline must be at least ${PROJECT_LIMITS.MIN_TAGLINE_LENGTH} characters or left empty`,
  )
  .refine(
    (value) => value.length === 0 || hasLettersOrNumbers(value),
    "Tagline must include letters or numbers",
  );

const descriptionSchema = z
  .string()
  .trim()
  .min(
    PROJECT_LIMITS.MIN_DESCRIPTION_LENGTH,
    `Description must be at least ${PROJECT_LIMITS.MIN_DESCRIPTION_LENGTH} characters`,
  )
  .max(
    PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH,
    `Description must be ${PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH} characters or fewer`,
  )
  .refine(hasMeaningfulDescription, "Description must clearly explain what your project does");

const categorySchema = z.string().trim().min(1, "Category is required");

export const websiteUrlSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;

    const normalized = normalizeProjectWebsiteUrl(value);
    if (!normalized) {
      addFieldIssue(ctx, "Enter a valid website URL", PROJECT_FORM_FIELDS.websiteUrl);
      return z.NEVER;
    }

    return normalized;
  });
const parseImageArray = (value: string, ctx: z.RefinementCtx): string[] | typeof z.NEVER => {
  const path = PROJECT_FORM_FIELDS.imageUrls;

  if (!value) {
    addFieldIssue(ctx, "At least one project screenshot is required", path);
    return z.NEVER;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    addFieldIssue(ctx, "Invalid image URLs format", path);
    return z.NEVER;
  }

  if (!Array.isArray(parsed)) {
    addFieldIssue(ctx, "Image URLs must be a valid list", path);
    return z.NEVER;
  }

  if (parsed.length === 0) {
    addFieldIssue(ctx, "At least one project screenshot is required", path);
    return z.NEVER;
  }

  if (parsed.length > PROJECT_LIMITS.MAX_IMAGE_COUNT) {
    addFieldIssue(ctx, `Maximum ${PROJECT_LIMITS.MAX_IMAGE_COUNT} images allowed`, path);
    return z.NEVER;
  }

  const filtered = parsed.filter((raw): raw is string => {
    if (typeof raw !== "string" || raw.trim().length === 0) {
      addFieldIssue(ctx, "Invalid image URLs format", path);
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    addFieldIssue(ctx, "At least one project screenshot is required", path);
    return z.NEVER;
  }

  return filtered;
};

const imageUrlsSchema = z.string().transform(parseImageArray);

const imageKeysSchema = z.string().transform((value) => {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((key): key is string => typeof key === "string" && key.trim().length > 0);
  } catch {
    return [];
  }
});

const parseTags = (value: string, ctx: z.RefinementCtx): string[] | typeof z.NEVER => {
  const path = PROJECT_FORM_FIELDS.tags;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    addFieldIssue(ctx, "Tags must be a valid list", path);
    return z.NEVER;
  }

  if (!Array.isArray(parsed)) {
    addFieldIssue(ctx, "Tags must be a valid list", path);
    return z.NEVER;
  }

  if (parsed.length === 0) {
    addFieldIssue(ctx, "Add at least one tag", path);
    return z.NEVER;
  }

  if (parsed.length > PROJECT_LIMITS.MAX_TAG_COUNT) {
    addFieldIssue(ctx, `Use ${PROJECT_LIMITS.MAX_TAG_COUNT} tags or fewer`, path);
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const raw of parsed) {
    if (typeof raw !== "string") {
      addFieldIssue(ctx, "Each tag must be text", path);
      continue;
    }

    const tag = raw.trim().toLowerCase();
    if (!tag) {
      addFieldIssue(ctx, "Tags cannot be blank", path);
      continue;
    }

    if (!hasLettersOrNumbers(tag)) {
      addFieldIssue(ctx, "Tags must include letters or numbers", path);
      continue;
    }

    if (tag.length > PROJECT_LIMITS.MAX_TAG_LENGTH) {
      addFieldIssue(
        ctx,
        `Each tag must be ${PROJECT_LIMITS.MAX_TAG_LENGTH} characters or fewer`,
        path,
      );
      continue;
    }

    if (seen.has(tag)) continue;
    seen.add(tag);
    normalized.push(tag);
  }

  if (normalized.length === 0 && path) {
    addFieldIssue(ctx, "Add at least one tag", path);
    return z.NEVER;
  }

  return normalized;
};

const tagsSchema = z.string().transform(parseTags);

/** The raw input the schema expects: all FormData values are strings. */
export interface ProjectFormRawInput {
  title: string;
  tagline: string;
  description: string;
  category: string;
  websiteUrl: string;
  imageUrls: string;
  imageKeys: string;
  tags: string;
}

/** The shape the client stores per-field schemas consumed per step. */
export const PROJECT_FIELD_SCHEMAS = {
  title: titleSchema,
  tagline: taglineSchema,
  description: descriptionSchema,
  category: categorySchema,
  websiteUrl: websiteUrlSchema,
  imageUrls: imageUrlsSchema,
  imageKeys: imageKeysSchema,
  tags: tagsSchema,
} as const;

/**
 * Compose the per-field schemas into the whole-form schema. When
 * `categoryNames` is provided (active categories), categories must be members.
 */
export function buildProjectSubmissionSchema(categoryNames?: readonly string[]) {
  const objectSchema = z.object({
    title: PROJECT_FIELD_SCHEMAS.title,
    tagline: PROJECT_FIELD_SCHEMAS.tagline,
    description: PROJECT_FIELD_SCHEMAS.description,
    category: PROJECT_FIELD_SCHEMAS.category,
    websiteUrl: PROJECT_FIELD_SCHEMAS.websiteUrl,
    imageUrls: PROJECT_FIELD_SCHEMAS.imageUrls,
    imageKeys: PROJECT_FIELD_SCHEMAS.imageKeys,
    tags: PROJECT_FIELD_SCHEMAS.tags,
  });

  if (!categoryNames || categoryNames.length === 0) {
    return objectSchema;
  }
  return objectSchema.superRefine((input, ctx) => {
    if (!categoryNames.includes(input.category)) {
      addFieldIssue(ctx, "Choose an active category", PROJECT_FORM_FIELDS.category);
    }
  });
}

/** CamelCase zod paths -> snake_case wire names. */
const WIRE_FIELD_NAME_BY_SCHEMA_KEY: Record<string, ProjectFormFieldName> = {
  title: PROJECT_FORM_FIELDS.title,
  tagline: PROJECT_FORM_FIELDS.tagline,
  description: PROJECT_FORM_FIELDS.description,
  category: PROJECT_FORM_FIELDS.category,
  websiteUrl: PROJECT_FORM_FIELDS.websiteUrl,
  imageUrls: PROJECT_FORM_FIELDS.imageUrls,
  imageKeys: PROJECT_FORM_FIELDS.imageKeys,
  tags: PROJECT_FORM_FIELDS.tags,
};

/** Flatten a zod error into the snake_case wire fieldErrors payload. */
export function buildProjectFieldErrors(error: z.ZodError): ProjectScreenshotFieldErrors {
  const fieldErrors: ProjectScreenshotFieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path !== "string") continue;

    const fieldName = WIRE_FIELD_NAME_BY_SCHEMA_KEY[path] ?? path;
    const messages = fieldErrors[fieldName] ?? [];

    if (!messages.includes(issue.message)) {
      messages.push(issue.message);
    }

    fieldErrors[fieldName] = messages;
  }

  return fieldErrors;
}

/** Join fieldErrors into the single human-readable error string postables/ancients show. */
export function formatProjectFieldErrors(fieldErrors: ProjectScreenshotFieldErrors): string {
  const messages = Object.entries(fieldErrors)
    .filter(([, errors]) => errors && errors.length > 0)
    .map(([field, errors]) => {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
      return `${fieldName}: ${errors?.join(", ")}`;
    });

  return messages.join(". ");
}

/** Read the FormData into the raw shape the schema consumes. */
export function readProjectFormData(formData: FormData): ProjectFormRawInput {
  const getValue = (fieldName: string): string => {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value.trim() : "";
  };

  return {
    title: getValue(PROJECT_FORM_FIELDS.title),
    tagline: getValue(PROJECT_FORM_FIELDS.tagline),
    description: getValue(PROJECT_FORM_FIELDS.description),
    category: getValue(PROJECT_FORM_FIELDS.category),
    websiteUrl: getValue(PROJECT_FORM_FIELDS.websiteUrl),
    imageUrls: getValue(PROJECT_FORM_FIELDS.imageUrls),
    imageKeys: getValue(PROJECT_FORM_FIELDS.imageKeys),
    tags: getValue(PROJECT_FORM_FIELDS.tags),
  };
}
