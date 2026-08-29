import type { AdminTestimonial, AdminTestimonialsFilter } from "@/lib/actions/testimonials";
import { TestimonialFilters } from "./components/testimonial-filters";
import { TestimonialsTable } from "./components/testimonials-table";

export interface TestimonialsBoardProps {
  testimonials: AdminTestimonial[];
  status: AdminTestimonialsFilter;
  error?: string;
}

export default function TestimonialsPage({ testimonials, status, error }: TestimonialsBoardProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load testimonials</div>
        <div className="text-muted-foreground mt-1 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TestimonialFilters status={status} />
      <TestimonialsTable testimonials={testimonials} status={status} />
    </div>
  );
}
