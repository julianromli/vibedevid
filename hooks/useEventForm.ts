import { useState } from "react";
import { generateEventSlug, validateEventForm } from "@/lib/event-form-utils";
import type { EventFormData } from "@/types/events";

export interface UseEventFormReturn {
  formData: Partial<EventFormData>;
  errors: Record<string, string>;
  isValid: boolean;
  setField: (field: keyof EventFormData, value: any) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

interface UseEventFormProps {
  userId: string;
}

export function useEventForm({ userId }: UseEventFormProps): UseEventFormReturn {
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    status: "upcoming",
    approved: false,
    submittedBy: userId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug when name changes
      if (field === "name" && typeof value === "string") {
        updated.slug = generateEventSlug(value);
      }

      // Ensure status is always 'upcoming'
      updated.status = "upcoming";

      // Ensure approved is always false
      updated.approved = false;

      // Ensure submittedBy is always set
      updated.submittedBy = userId;

      return updated;
    });

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const validation = validateEventForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const resetForm = () => {
    setFormData({
      status: "upcoming",
      approved: false,
      submittedBy: userId,
    });
    setErrors({});
  };

  const validation = validateEventForm(formData);

  return {
    formData,
    errors,
    isValid: validation.isValid,
    setField,
    validateForm,
    resetForm,
  };
}
