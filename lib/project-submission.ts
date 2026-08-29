import { z } from "zod";
import { normalizeProjectWebsiteUrl } from "@/lib/project-url";

/**
 * Project submission validation — one truth for the whole submitted-form seam.
 *
 * This module is dependency-light (zod + pure helpers only) so it is importable
 * from both the server actions and the client forms. It owns:
 *   - PROJECT_FORM_FIELDS: the cross-seam FormData field names + wire error keys
 *   - PROJECT_LIMITS: every min/max constant
 *   - the typed submission model and the zod schema that consumes it
 *   - parseProjectFormData(): the ONLY place FormData strings -> typed model
 *   - the zod-issue -> wire fieldErrors flattening and display formatting
 *
 * The schema consumes the typed submission object (string[] tags/images,
 * websiteUrl string|null). FormData stays on the wire: the two server entry
 * points call parseProjectFormData(); clients validate the same typed object
 * directly — no one mimes FormData to run the schema.
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

export type ProjectFieldErrors = Partial<Record<ProjectFormFieldName, string[]>>;

/** The validated submission model shared by submit, edit, and client pre-checks. */
export interface ProjectSubmissionInput {
  title: string;
  tagline: string;
  description: string;
  category: string;
  websiteUrl: string | null;
  imageUrls: string[];
  imageKeys: string[];
  tags: string[];
}

/** Raw FormData-string payload crossing the seam. */
export interface ProjectSubmissionRaw {
  title: string;
  tagline: string;
  description: string;
  category: string;
  websiteUrl: string;
  imageUrls: string;
  imageKeys: string;
  tags: string;
}

const hasLettersOrNumbers = (value: string): boolean => /[a-z0-9]/i.test(value);

const hasMeaningfulDescription = (value: string): boolean => {
  const words = value.match(/[a-z0-9][a-z0-9''+.#/-]*/gi) ?? [];
  return words.length >= PROJECT_LIMITS.MIN_DESCRIPTION_WORDS;
};

const addFieldIssue = (ctx: z.RefinementCtx, message: string, path: ProjectFormFieldName) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path: [path],
  });
};

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

/**
 * Accepts either a raw string (unchecked, from a FormData seam) or an
 * already-normalized nullable string (typed client path).
 */
const websiteUrlSchema = z
  .string()
  .or(z.null())
  .transform((value, ctx) => {
    if (!value) return null;

    const normalized = normalizeProjectWebsiteUrl(value);
    if (!normalized) {
      addFieldIssue(ctx, "Enter a valid website URL", PROJECT_FORM_FIELDS.websiteUrl);
      return z.NEVER;
    }

    return normalized;
  });

const imageUrlsSchema = z
  .array(z.string())
  .min(1, "At least one project screenshot is required")
  .max(PROJECT_LIMITS.MAX_IMAGE_COUNT, `Maximum ${PROJECT_LIMITS.MAX_IMAGE_COUNT} images allowed`)
  .refine((urls) => urls.every((url) => url.trim().length > 0), "Image URLs cannot be blank");

const imageKeysSchema = z.array(z.string());

const tagsSchema = z
  .array(z.string())
  .min(1, "Add at least one tag")
  .max(PROJECT_LIMITS.MAX_TAG_COUNT, `Use ${PROJECT_LIMITS.MAX_TAG_COUNT} tags or fewer`)
  .refine((tags) => tags.every((tag) => tag.trim().length > 0), "Tags cannot be blank")
  .refine(
    (tags) => tags.every((tag) => hasLettersOrNumbers(tag)),
    "Tags must include letters or numbers",
  )
  .refine(
    (tags) => tags.every((tag) => tag.trim().length <= PROJECT_LIMITS.MAX_TAG_LENGTH),
    `Each tag must be ${PROJECT_LIMITS.MAX_TAG_LENGTH} characters or fewer`,
  )
  .transform((tags) =>
    Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))),
  );
const TYPED_SCHEMA = {
  title: titleSchema,
  tagline: taglineSchema,
  description: descriptionSchema,
  category: categorySchema,
  websiteUrl: websiteUrlSchema,
  imageUrls: imageUrlsSchema,
  imageKeys: imageKeysSchema,
  tags: tagsSchema,
} as const;

/** The shape the client stores per-field schemas consumed per step. */
export const PROJECT_FIELD_SCHEMAS: {
  [K in keyof ProjectSubmissionInput]: (typeof TYPED_SCHEMA)[K];
} = TYPED_SCHEMA;

/** Compose the per-field schemas into the whole-form schema over the typed input. */
export function buildProjectSubmissionSchema(categoryNames?: readonly string[]) {
  const objectSchema = z.object(TYPED_SCHEMA);

  if (!categoryNames || categoryNames.length === 0) {
    return objectSchema;
  }
  return objectSchema.superRefine((input, ctx) => {
    if (!categoryNames.includes(input.category)) {
      addFieldIssue(ctx, "Choose an active category", PROJECT_FORM_FIELDS.category);
    }
  });
}

/**
 * Read the FormData into the raw string payload. Trims text fields; list
 * fields stay as their raw JSON strings for parseProjectFormData.
 */
export function readProjectFormDataRaw(formData: FormData): ProjectSubmissionRaw {
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

function parseJsonStringArray(value: string): string[] | null {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return null;
  }
}

export interface ProjectFormParseIssue {
  path: ProjectFormFieldName;
  message: string;
}

export type ProjectFormParseResult =
  | { ok: true; input: ProjectSubmissionInput }
  | { ok: false; issues: ProjectFormParseIssue[] };

const LIST_FIELD_PARSE_MESSAGES: Record<ProjectFormFieldName, string> = {
  title: "Invalid title format",
  tagline: "Invalid tagline format",
  description: "Invalid description format",
  category: "Invalid category format",
  website_url: "Enter a valid website URL",
  image_urls: "Invalid image URLs format",
  image_keys: "Invalid image keys format",
  tags: "Tags must be a valid list",
};

/**
 * Parse + lightly type-convert a FormData payload into the typed model.
 * Returns `{ ok: false, issues }` only for malformed list JSON; field-rule
 * validation still runs through buildProjectSubmissionSchema (typed input).
 */
export function parseProjectFormData(formData: FormData): ProjectFormParseResult {
  const raw = readProjectFormDataRaw(formData);

  const imageUrls = parseJsonStringArray(raw.imageUrls);
  const imageKeys = parseJsonStringArray(raw.imageKeys);
  const tags = parseJsonStringArray(raw.tags);

  const issues: ProjectFormParseIssue[] = [];
  if (imageUrls === null) {
    issues.push({
      path: PROJECT_FORM_FIELDS.imageUrls,
      message: LIST_FIELD_PARSE_MESSAGES[PROJECT_FORM_FIELDS.imageUrls],
    });
  }
  if (imageKeys === null) {
    issues.push({
      path: PROJECT_FORM_FIELDS.imageKeys,
      message: LIST_FIELD_PARSE_MESSAGES[PROJECT_FORM_FIELDS.imageKeys],
    });
  }
  if (tags === null) {
    issues.push({
      path: PROJECT_FORM_FIELDS.tags,
      message: LIST_FIELD_PARSE_MESSAGES[PROJECT_FORM_FIELDS.tags],
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    input: {
      title: raw.title,
      tagline: raw.tagline,
      description: raw.description,
      category: raw.category,
      websiteUrl: raw.websiteUrl, // raw string; schema normalizes + validates
      imageUrls: imageUrls ?? [],
      imageKeys: imageKeys ?? [],
      tags: tags ?? [],
    },
  };
}

/** Convert the parse-issue list into the same wire payload zod errors use. */
export function parseResultToFieldErrors(issues: ProjectFormParseIssue[]): ProjectFieldErrors {
  const fieldErrors: ProjectFieldErrors = {};
  for (const issue of issues) {
    fieldErrors[issue.path] = [issue.message];
  }
  return fieldErrors;
}

/** Wire-name key -> the camelCase zod path that issues it. */
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

/** Flatten a zod error into the wire fieldErrors payload (snake_case keys). */
export function buildProjectFieldErrors(error: z.ZodError): ProjectFieldErrors {
  const fieldErrors: ProjectFieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path !== "string") continue;

    const fieldName = WIRE_FIELD_NAME_BY_SCHEMA_KEY[path] ?? (path as ProjectFormFieldName);
    const messages = fieldErrors[fieldName] ?? [];

    if (!messages.includes(issue.message)) {
      messages.push(issue.message);
    }

    fieldErrors[fieldName] = messages;
  }

  return fieldErrors;
}

/** Join fieldErrors into a single human-readable error string. */
export function formatProjectFieldErrors(fieldErrors: ProjectFieldErrors): string {
  const messages = Object.entries(fieldErrors)
    .filter(([, errors]) => errors && errors.length > 0)
    .map(([field, errors]) => {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
      return `${fieldName}: ${errors?.join(", ")}`;
    });

  return messages.join(". ");
}
