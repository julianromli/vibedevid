import { Image } from "@unpic/react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Option } from "@/components/ui/multiselect";

export interface ReviewStepProps {
  title: string;
  tagline: string;
  description: string;
  categoryLabel: string;
  websiteUrl: string;
  faviconUrl: string;
  tags: Option[];
  imageUrls: string[];
  /** Jump back to the step that owns a section. */
  onEdit: (step: 1 | 2) => void;
  disabled: boolean;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

function Section({
  heading,
  onEdit,
  disabled,
  children,
}: {
  heading: string;
  onEdit: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("projectSubmit");
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{heading}</h3>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          aria-label={t("form.editSection", { section: heading })}
          className="min-h-11 min-w-11 rounded-md px-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {t("form.edit")}
        </button>
      </div>
      {children}
    </section>
  );
}

export function ReviewStep({
  title,
  tagline,
  description,
  categoryLabel,
  websiteUrl,
  faviconUrl,
  tags,
  imageUrls,
  onEdit,
  disabled,
}: ReviewStepProps) {
  const { t } = useTranslation("projectSubmit");
  const notSet = <span className="text-muted-foreground">{t("form.notSet")}</span>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("form.reviewIntro")}</p>

      <Section heading={t("steps.basics")} onEdit={() => onEdit(1)} disabled={disabled}>
        <dl className="space-y-3">
          <Row label={t("form.projectTitle")}>{title}</Row>
          <Row label={t("form.tagline")}>{tagline.trim() || notSet}</Row>
          <Row label={t("form.category")}>{categoryLabel}</Row>
          <Row label={t("form.description")}>
            <span className="whitespace-pre-line">{description}</span>
          </Row>
        </dl>
      </Section>

      <Section heading={t("steps.linksMedia")} onEdit={() => onEdit(2)} disabled={disabled}>
        <dl className="space-y-3">
          <Row label={t("form.websiteUrl")}>{websiteUrl.trim() || notSet}</Row>
          <Row label={t("form.faviconUrl")}>{faviconUrl.trim() || notSet}</Row>
          <Row label={t("form.techStack")}>
            {tags.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag.value} variant="secondary">
                    {tag.label}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">{t("form.noTags")}</span>
            )}
          </Row>
        </dl>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("form.screenshot")}</p>
          <p className="text-xs text-muted-foreground">{t("form.coverLine")}</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imageUrls.map((url, index) => (
              <li key={url} className="relative">
                <Image
                  src={url}
                  alt={t("form.upload.alt", { n: index + 1 })}
                  className="aspect-video w-full rounded-lg object-cover"
                  width={300}
                  height={169}
                />
                {index === 0 && (
                  <Badge className="absolute left-2 top-2">{t("form.upload.cover")}</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}
