import { Image } from "@unpic/react";
import type { Option } from "@/components/ui/multiselect";

export interface ReviewStepProps {
  title: string;
  tagline: string;
  description: string;
  categoryLabel: string;
  websiteUrl: string;
  tags: Option[];
  imageUrls: string[];
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

export function ReviewStep({
  title,
  tagline,
  description,
  categoryLabel,
  websiteUrl,
  tags,
  imageUrls,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Check everything below. Use Back to change anything before you submit.
      </p>
      <dl className="space-y-4">
        <Row label="Title">{title}</Row>
        {tagline.trim() && <Row label="Tagline">{tagline}</Row>}
        <Row label="Category">{categoryLabel}</Row>
        <Row label="Description">
          <span className="whitespace-pre-line">{description}</span>
        </Row>
        {websiteUrl.trim() && <Row label="Website">{websiteUrl}</Row>}
        <Row label="Tags">{tags.map((tag) => tag.label).join(", ")}</Row>
      </dl>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Screenshots</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imageUrls.map((url, index) => (
            <Image
              key={url}
              src={url}
              alt={`Screenshot ${index + 1}`}
              className="aspect-video w-full rounded-lg object-cover"
              width={300}
              height={169}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
