import { describe, expect, it } from "vite-plus/test";
import {
  isHoneypotFilled,
  validateTestimonialAvatar,
  validateTestimonialFields,
} from "@/lib/testimonial-form-utils";

const validFields = {
  fullName: "Rizki Pratama",
  role: "Frontend Developer, Tokopedia",
  body: "VibeDev ID ngubah cara gue belajar coding bareng komunitas.",
};

describe("validateTestimonialFields", () => {
  it("accepts valid fields", () => {
    expect(validateTestimonialFields(validFields).isValid).toBe(true);
  });

  it("rejects a short name and short body", () => {
    const result = validateTestimonialFields({ fullName: "A", role: "Dev", body: "short" });
    expect(result.isValid).toBe(false);
    expect(result.errors.fullName).toBeDefined();
    expect(result.errors.body).toBeDefined();
  });
});

describe("validateTestimonialAvatar", () => {
  it("requires a file", () => {
    expect(validateTestimonialAvatar(null)).toBe("Foto wajib diunggah");
  });

  it("rejects a large or non-image file", () => {
    expect(validateTestimonialAvatar({ type: "application/pdf", size: 100 })).toBeTruthy();
    expect(validateTestimonialAvatar({ type: "image/png", size: 3 * 1024 * 1024 })).toBeTruthy();
  });

  it("accepts a 2 MB jpeg", () => {
    expect(validateTestimonialAvatar({ type: "image/jpeg", size: 2 * 1024 * 1024 })).toBeNull();
  });
});

describe("isHoneypotFilled", () => {
  it("treats whitespace as empty", () => {
    expect(isHoneypotFilled("   ")).toBe(false);
    expect(isHoneypotFilled("http://spam.test")).toBe(true);
  });
});
