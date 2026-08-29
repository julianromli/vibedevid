import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  approveTestimonial,
  listAdminTestimonials,
  rejectTestimonial,
  submitTestimonialFromFormData,
  unpublishTestimonial,
  type AdminTestimonialsFilter,
} from "@/lib/actions/testimonials";

export const submitTestimonialFn = createServerFn({ method: "POST" })
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }
    return data;
  })
  .handler(async ({ data }) => submitTestimonialFromFormData(data));

const TestimonialIdSchema = z.object({
  id: z.string().uuid(),
});

const ListFilterSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
});

export const listAdminTestimonialsFn = createServerFn({ method: "GET" })
  .validator(ListFilterSchema)
  .handler(async ({ data }) => {
    return listAdminTestimonials((data.status ?? "pending") as AdminTestimonialsFilter);
  });

export const approveTestimonialFn = createServerFn({ method: "POST" })
  .validator(TestimonialIdSchema)
  .handler(async ({ data }) => approveTestimonial(data.id));

export const rejectTestimonialFn = createServerFn({ method: "POST" })
  .validator(TestimonialIdSchema)
  .handler(async ({ data }) => rejectTestimonial(data.id));

export const unpublishTestimonialFn = createServerFn({ method: "POST" })
  .validator(TestimonialIdSchema)
  .handler(async ({ data }) => unpublishTestimonial(data.id));
