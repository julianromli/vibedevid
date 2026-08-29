import { getRequest } from "@tanstack/react-start/server";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { requireUser } from "@/lib/server/auth";
import { readFileBytes, sniffImageMime } from "@/lib/image-sniff";
import { invalidateApprovedTestimonialsCache } from "@/lib/server/testimonials-public";
import {
  isHoneypotFilled,
  isTestimonialStatus,
  TESTIMONIAL_RATE_LIMIT,
  TESTIMONIAL_RATE_WINDOW_MS,
  type TestimonialStatus,
  validateTestimonialAvatar,
  validateTestimonialFields,
} from "@/lib/testimonial-form-utils";
import { deleteUploadthingFiles, uploadAnonymousImage } from "@/lib/uploadthing";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AdminTestimonial {
  id: string;
  fullName: string;
  role: string;
  body: string;
  avatarUrl: string;
  status: TestimonialStatus;
  approvedAt: string | null;
  createdAt: string;
}

export interface SubmitTestimonialInput {
  fullName: string;
  role: string;
  body: string;
  honeypot?: string;
  avatar: File | null;
  ipHash?: string;
}

export type SubmitTestimonialResult = { success: true } | { success: false; error: string };

export type AdminTestimonialsFilter = TestimonialStatus | "all";

function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toAdminTestimonial(row: typeof testimonials.$inferSelect): AdminTestimonial {
  return {
    id: row.id,
    fullName: row.fullName,
    role: row.role,
    body: row.body,
    avatarUrl: row.avatarUrl,
    status: isTestimonialStatus(row.status) ? row.status : "pending",
    approvedAt: toIso(row.approvedAt),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
  };
}

export async function hashClientIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getClientIp(): string {
  try {
    const headers = getRequest().headers;
    return (
      headers.get("cf-connecting-ip") ||
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

async function checkAdminAccess() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return user;
}

export async function submitTestimonial(
  input: SubmitTestimonialInput,
): Promise<SubmitTestimonialResult> {
  try {
    if (isHoneypotFilled(input.honeypot)) {
      return { success: true };
    }

    const validation = validateTestimonialFields(input);
    const avatarError = validateTestimonialAvatar(input.avatar);
    if (!validation.isValid || avatarError) {
      const messages = [...Object.values(validation.errors), avatarError].filter(Boolean);
      return { success: false, error: `Validation failed: ${messages.join(", ")}` };
    }

    const ipHash = input.ipHash ?? (await hashClientIp(getClientIp()));
    const db = getDb();
    const since = new Date(Date.now() - TESTIMONIAL_RATE_WINDOW_MS);
    const [rate] = await db
      .select({ value: count() })
      .from(testimonials)
      .where(and(eq(testimonials.ipHash, ipHash), gte(testimonials.createdAt, since)));

    if ((rate?.value ?? 0) >= TESTIMONIAL_RATE_LIMIT) {
      return { success: false, error: "Terlalu banyak kiriman. Coba lagi nanti." };
    }

    const avatarBytes = await readFileBytes(input.avatar as File);
    if (!sniffImageMime(avatarBytes)) {
      return { success: false, error: "Validation failed: Foto harus JPG, PNG, atau WebP" };
    }

    let uploadedKey: string | undefined;
    try {
      const uploaded = await uploadAnonymousImage(input.avatar as File);
      uploadedKey = uploaded.key;

      await db.insert(testimonials).values({
        fullName: input.fullName.trim(),
        role: input.role.trim(),
        body: input.body.trim(),
        avatarUrl: uploaded.url,
        avatarKey: uploaded.key,
        status: "pending",
        ipHash,
      });

      return { success: true };
    } catch (error) {
      if (uploadedKey) {
        try {
          await deleteUploadthingFiles(uploadedKey);
        } catch (cleanupError) {
          console.error("Failed to delete orphaned testimonial upload:", cleanupError);
        }
      }
      console.error("Unexpected error submitting testimonial:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  } catch (error) {
    console.error("Unexpected error submitting testimonial:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitTestimonialFromFormData(
  formData: FormData,
): Promise<SubmitTestimonialResult> {
  const avatar = formData.get("avatar");
  return submitTestimonial({
    fullName: formString(formData, "fullName"),
    role: formString(formData, "role"),
    body: formString(formData, "body"),
    honeypot: formString(formData, "website"),
    avatar: avatar instanceof File && avatar.size > 0 ? avatar : null,
  });
}

export async function listAdminTestimonials(status: AdminTestimonialsFilter = "pending"): Promise<{
  testimonials: AdminTestimonial[];
  error?: string;
}> {
  try {
    await checkAdminAccess();
    const db = getDb();
    const rows =
      status === "all"
        ? await db.select().from(testimonials).orderBy(desc(testimonials.createdAt))
        : await db
            .select()
            .from(testimonials)
            .where(eq(testimonials.status, status))
            .orderBy(desc(testimonials.createdAt));

    return { testimonials: rows.map(toAdminTestimonial) };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { testimonials: [], error: "Unauthorized" };
    }
    console.error("Unexpected error listing testimonials:", error);
    return { testimonials: [], error: "An unexpected error occurred" };
  }
}

async function setTestimonialStatus(
  testimonialId: string,
  status: TestimonialStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidUUID(testimonialId)) {
      return { success: false, error: "Invalid testimonial ID format" };
    }

    await checkAdminAccess();
    const db = getDb();
    const now = new Date();
    const updatedRows = await db
      .update(testimonials)
      .set({
        status,
        ...(status === "approved" ? { approvedAt: now } : {}),
        updatedAt: now,
      })
      .where(eq(testimonials.id, testimonialId))
      .returning({ id: testimonials.id });

    if (!updatedRows.length) {
      return { success: false, error: "Testimonial could not be updated" };
    }

    await invalidateApprovedTestimonialsCache();
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Unexpected error updating testimonial:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function approveTestimonial(testimonialId: string) {
  return setTestimonialStatus(testimonialId, "approved");
}

export async function rejectTestimonial(testimonialId: string) {
  return setTestimonialStatus(testimonialId, "rejected");
}

export async function unpublishTestimonial(testimonialId: string) {
  return setTestimonialStatus(testimonialId, "rejected");
}
