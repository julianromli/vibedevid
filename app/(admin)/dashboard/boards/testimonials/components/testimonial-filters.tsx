"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminTestimonialsFilter } from "@/lib/actions/testimonials";
import { useNavigate } from "@/lib/navigation";

const FILTERS: Array<{ value: AdminTestimonialsFilter; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export function TestimonialFilters({ status }: { status: AdminTestimonialsFilter }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={(value) => {
          void navigate({
            to: "/dashboard",
            search: {
              tab: "testimonials",
              status: value === "pending" ? undefined : value,
            },
          });
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {FILTERS.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {status !== "pending" ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigate({ to: "/dashboard", search: { tab: "testimonials" } });
          }}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
