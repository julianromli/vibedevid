"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTestimonialForm } from "@/hooks/useTestimonialForm";
import { submitTestimonialFn } from "@/lib/actions/testimonials.functions";
import { compressImageFile } from "@/lib/image-compression";
import { TESTIMONIAL_BODY_MAX } from "@/lib/testimonial-form-utils";
import { cn } from "@/lib/utils";

export function TestimonialForm() {
  const { t } = useTranslation("testimonialSubmit");
  const { formData, avatar, errors, setField, setAvatarFile, validateForm } = useTestimonialForm();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputId = useId();
  const honeypotId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!avatar) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatar);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  async function handleAvatarChange(file: File | null) {
    if (!file) {
      setAvatarFile(null);
      return;
    }
    const compressed = await compressImageFile(file, { maxDimension: 512 });
    setAvatarFile(compressed);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("fullName", formData.fullName);
      payload.append("role", formData.role);
      payload.append("body", formData.body);
      payload.append("website", formData.honeypot);
      if (avatar) {
        payload.append("avatar", avatar);
      }

      const result = await submitTestimonialFn({ data: payload });
      if (!result.success) {
        setSubmitError(result.error || t("errorGeneric"));
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError(t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-background p-8 text-center" role="status">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">{t("thanksTitle")}</h2>
        <p className="text-muted-foreground mt-2 text-pretty">{t("thanksBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          value={formData.fullName}
          onChange={(event) => setField("fullName", event.target.value)}
          placeholder={t("fullNamePlaceholder")}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
        {errors.fullName ? (
          <p id="fullName-error" className="text-destructive text-sm" role="alert">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{t("role")}</Label>
        <Input
          id="role"
          name="role"
          type="text"
          autoComplete="organization-title"
          value={formData.role}
          onChange={(event) => setField("role", event.target.value)}
          placeholder={t("rolePlaceholder")}
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={errors.role ? "role-error" : undefined}
        />
        {errors.role ? (
          <p id="role-error" className="text-destructive text-sm" role="alert">
            {errors.role}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">{t("body")}</Label>
        <Textarea
          id="body"
          name="body"
          value={formData.body}
          onChange={(event) => setField("body", event.target.value)}
          placeholder={t("bodyPlaceholder")}
          maxLength={TESTIMONIAL_BODY_MAX}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "body-error" : "body-count"}
          className="min-h-32"
        />
        <p id="body-count" className="text-muted-foreground text-xs tabular-nums">
          {formData.body.length}/{TESTIMONIAL_BODY_MAX}
        </p>
        {errors.body ? (
          <p id="body-error" className="text-destructive text-sm" role="alert">
            {errors.body}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fileInputId}>{t("avatar")}</Label>
        <p id="avatar-hint" className="text-muted-foreground text-sm">
          {t("avatarHint")}
        </p>
        <div className="flex items-center gap-4">
          <div className="bg-muted size-16 overflow-hidden rounded-full outline outline-black/8 -outline-offset-1 dark:outline-white/8">
            {previewUrl ? <img src={previewUrl} alt="" className="size-full object-cover" /> : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="active:scale-[0.98] transition-transform"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatar ? t("changePhoto") : t("choosePhoto")}
          </Button>
          <input
            id={fileInputId}
            ref={fileInputRef}
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-describedby={errors.avatar ? "avatar-error avatar-hint" : "avatar-hint"}
            aria-invalid={errors.avatar ? true : undefined}
            onChange={(event) => void handleAvatarChange(event.target.files?.[0] ?? null)}
          />
        </div>
        {errors.avatar ? (
          <p id="avatar-error" className="text-destructive text-sm" role="alert">
            {errors.avatar}
          </p>
        ) : null}
      </div>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={honeypotId}>Website</label>
        <input
          id={honeypotId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.honeypot}
          onChange={(event) => setField("honeypot", event.target.value)}
        />
      </div>

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn("w-full active:scale-[0.98] transition-transform")}
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
