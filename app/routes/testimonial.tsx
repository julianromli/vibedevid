import { createFileRoute } from "@tanstack/react-router";
import { TestimonialPageClient } from "@/app/testimonial/testimonial-page-client";
import { NOINDEX_META } from "@/lib/seo/site-url";

export const Route = createFileRoute("/testimonial")({
  head: () => ({
    meta: [{ title: "Kirim testimoni | VibeDev ID" }, NOINDEX_META],
  }),
  component: TestimonialRoute,
});

function TestimonialRoute() {
  return <TestimonialPageClient />;
}
