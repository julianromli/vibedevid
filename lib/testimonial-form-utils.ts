export const TESTIMONIAL_NAME_MIN = 2;
export const TESTIMONIAL_NAME_MAX = 80;
export const TESTIMONIAL_ROLE_MIN = 2;
export const TESTIMONIAL_ROLE_MAX = 80;
export const TESTIMONIAL_BODY_MIN = 20;
export const TESTIMONIAL_BODY_MAX = 400;
export const TESTIMONIAL_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const TESTIMONIAL_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const TESTIMONIAL_RATE_LIMIT = 3;
export const TESTIMONIAL_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface TestimonialFieldInput {
  fullName: string;
  role: string;
  body: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function isHoneypotFilled(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function validateTestimonialFields(data: Partial<TestimonialFieldInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const fullName = data.fullName?.trim() ?? "";
  const role = data.role?.trim() ?? "";
  const body = data.body?.trim() ?? "";

  if (fullName.length < TESTIMONIAL_NAME_MIN || fullName.length > TESTIMONIAL_NAME_MAX) {
    errors.fullName = `Nama lengkap harus ${TESTIMONIAL_NAME_MIN}–${TESTIMONIAL_NAME_MAX} karakter`;
  }

  if (role.length < TESTIMONIAL_ROLE_MIN || role.length > TESTIMONIAL_ROLE_MAX) {
    errors.role = `Role harus ${TESTIMONIAL_ROLE_MIN}–${TESTIMONIAL_ROLE_MAX} karakter`;
  }

  if (body.length < TESTIMONIAL_BODY_MIN || body.length > TESTIMONIAL_BODY_MAX) {
    errors.body = `Isi testimoni harus ${TESTIMONIAL_BODY_MIN}–${TESTIMONIAL_BODY_MAX} karakter`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateTestimonialAvatar(
  file: { type: string; size: number } | null | undefined,
): string | null {
  if (!file) {
    return "Foto wajib diunggah";
  }

  if (!TESTIMONIAL_AVATAR_TYPES.includes(file.type)) {
    return "Foto harus JPG, PNG, atau WebP";
  }

  if (file.size > TESTIMONIAL_AVATAR_MAX_BYTES) {
    return "Foto maksimal 2 MB";
  }

  return null;
}

export function isTestimonialStatus(value: string | null | undefined): value is TestimonialStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}
