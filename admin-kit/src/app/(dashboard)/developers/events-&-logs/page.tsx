import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import ImportDialog from "./components/import-dialog"
import Logs from "./components/logs"
import Referrers from "./components/referrers"
import RouteView from "./components/route-view"

export default function EventsAndLogsPage() {
  return (
    <>
      <div className="flex w-full flex-col gap-2">
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
              <BreadcrumbPage>Events & Logs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Events & Logs</h2>
            <p className="text-muted-foreground text-sm">
              Track, analyze, and act on application behaviors efficiently.
            </p>
          </div>
          <ImportDialog />
        </div>
      </div>

      <div className="mt-6 mb-4 grid grid-cols-6 gap-5">
        <div className="col-span-6">
          <Logs />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <RouteView />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <Referrers />
        </div>
      </div>
    </>
  )
}
