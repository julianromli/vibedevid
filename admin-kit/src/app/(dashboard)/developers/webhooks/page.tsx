import { Frown } from "lucide-react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AddWebhook } from "./components/add-webhook"
import { columns } from "./components/webhooks-columns"
import { WebhooksTable } from "./components/webhooks-table"
import { webhookListSchema } from "./data/schema"
import { getWebhookData } from "./data/webhook-data"

export default function WebhooksPage() {
  const webhookData = getWebhookData()
  const webhookList = webhookListSchema.parse(webhookData)
  return (
    <div className="flex w-full flex-1 flex-col gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Developers</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Webhooks</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-muted-foreground text-sm">
            Setup, integrate and monitor webhooks.
          </p>
        </div>
        <AddWebhook />
      </div>

      <div className="h-full flex-1">
        {webhookList && webhookList.length > 0 ? (
          <WebhooksTable data={webhookList} columns={columns} />
        ) : (
          <div className="border-border mt-6 flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-10">
            <Frown className="size-32" />
            <h2 className="text-lg font-semibold">No Webhooks Yet</h2>
            <p className="text-muted-foreground text-center">
              Get started by creating a webhook to{" "}
              <br className="hidden sm:block" /> integrate and automate your
              workflows.
            </p>
            <AddWebhook />
          </div>
        )}
      </div>
    </div>
  )
}
