"use client";

import { IconQuote } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveTestimonialFn,
  rejectTestimonialFn,
  unpublishTestimonialFn,
} from "@/lib/actions/testimonials.functions";
import type { AdminTestimonial, AdminTestimonialsFilter } from "@/lib/actions/testimonials";
import { useRouter } from "@/lib/navigation";

function statusBadge(status: AdminTestimonial["status"]) {
  if (status === "pending") {
    return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
  }
  if (status === "approved") {
    return <Badge className="bg-green-500/10 text-green-600">Approved</Badge>;
  }
  return <Badge variant="outline">Rejected</Badge>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function TestimonialsTable({
  testimonials,
  status,
}: {
  testimonials: AdminTestimonial[];
  status: AdminTestimonialsFilter;
}) {
  const router = useRouter();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  async function runAction(
    id: string,
    action: typeof approveTestimonialFn,
    successMessage: string,
  ) {
    setProcessingIds((prev) => new Set(prev).add(id));
    const result = await action({ data: { id } });
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (result.success) {
      toast.success(successMessage);
      void router.refresh();
      return;
    }
    toast.error(result.error || "The update failed");
  }

  const title =
    status === "all"
      ? "All testimonials"
      : status === "approved"
        ? "Approved testimonials"
        : status === "rejected"
          ? "Rejected testimonials"
          : "Pending testimonials";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {testimonials.length} testimonial{testimonials.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {testimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconQuote size={48} className="text-muted-foreground mb-4" />
            <div className="text-muted-foreground font-medium">No testimonials</div>
            <div className="text-muted-foreground mt-1 text-sm">
              New submissions from /testimonial appear here
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Testimonial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((item) => {
                  const isProcessing = processingIds.has(item.id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={item.avatarUrl} alt={item.fullName} />
                            <AvatarFallback>{initials(item.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{item.fullName}</div>
                            <div className="text-muted-foreground text-xs">{item.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <p className="line-clamp-3 text-sm" title={item.body}>
                          {item.body}
                        </p>
                      </TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                className="active:scale-[0.98] transition-transform"
                                onClick={() =>
                                  void runAction(
                                    item.id,
                                    approveTestimonialFn,
                                    "Testimonial approved",
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isProcessing}
                                className="active:scale-[0.98] transition-transform"
                                onClick={() =>
                                  void runAction(
                                    item.id,
                                    rejectTestimonialFn,
                                    "Testimonial rejected",
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                          {item.status === "approved" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              className="active:scale-[0.98] transition-transform"
                              onClick={() =>
                                void runAction(
                                  item.id,
                                  unpublishTestimonialFn,
                                  "Testimonial unpublished",
                                )
                              }
                            >
                              Unpublish
                            </Button>
                          ) : null}
                          {item.status === "rejected" ? (
                            <Button
                              size="sm"
                              disabled={isProcessing}
                              className="active:scale-[0.98] transition-transform"
                              onClick={() =>
                                void runAction(
                                  item.id,
                                  approveTestimonialFn,
                                  "Testimonial approved",
                                )
                              }
                            >
                              Approve
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
