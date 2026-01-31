import { Header } from "@/components/layout/header"
import Dashboard2Actions from "./components/dashboard-2-actions"
import RecentActivity from "./components/recent-activity"
import RevenueChart from "./components/revenue-chart"
import Stats from "./components/stats"
import Visitors from "./components/visitors"

export default function Dashboard2Page() {
  return (
    <>
      <Header />

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Here&apos;re the details of your analysis.
            </p>
          </div>
          <Dashboard2Actions />
        </div>

        <div className="grid grid-cols-6 gap-5 lg:grid-cols-12">
          <Stats />
          <div className="col-span-6">
            <RevenueChart />
          </div>
          <div className="col-span-6 lg:col-span-8">
            <RecentActivity />
          </div>
          <div className="col-span-6 lg:col-span-4">
            <Visitors />
          </div>
        </div>
      </div>
    </>
  )
}
