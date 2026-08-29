import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { takeActionOnReport as takeActionOnReportAction } from "@/lib/actions/admin/comments";
import { ReportActionSchema, ReportIdSchema } from "@/lib/actions/admin/schemas";

export const takeActionOnReportFn = createServerFn({ method: "POST" })
  .validator(z.object({ reportId: ReportIdSchema, action: ReportActionSchema }))
  .handler(async ({ data }) => takeActionOnReportAction(data.reportId, data.action));
