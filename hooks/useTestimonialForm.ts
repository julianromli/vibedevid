import { useState } from "react";
import {
  type TestimonialFieldInput,
  validateTestimonialAvatar,
  validateTestimonialFields,
} from "@/lib/testimonial-form-utils";

export interface TestimonialFormState extends TestimonialFieldInput {
  honeypot: string;
}

export function useTestimonialForm() {
  const [formData, setFormData] = useState<TestimonialFormState>({
    fullName: "",
    role: "",
    body: "",
    honeypot: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: keyof TestimonialFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const setAvatarFile = (file: File | null) => {
    setAvatar(file);
    if (errors.avatar) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const fieldResult = validateTestimonialFields(formData);
    const avatarError = validateTestimonialAvatar(avatar);
    const nextErrors = { ...fieldResult.errors };
    if (avatarError) {
      nextErrors.avatar = avatarError;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return {
    formData,
    avatar,
    errors,
    setField,
    setAvatarFile,
    validateForm,
  };
}
