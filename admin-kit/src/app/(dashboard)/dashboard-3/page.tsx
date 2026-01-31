import { Header } from "@/components/layout/header"
import Budgets from "./components/budget"
import Dashboard3Actions from "./components/dashboard-3-actions"
import RadarCard from "./components/radar-card"
import StackBar from "./components/stack-bar"
import Stats from "./components/stats"
import Visitors from "./components/visitors"

export default function Dashboard3Page() {
  return (
    <>
      <Header />

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Overview Dashboard
            </h2>
            <p className="text-muted-foreground">
              Here, take a look at your sales.
            </p>
          </div>
          <Dashboard3Actions />
        </div>

        <div className="grid auto-rows-auto grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-8">
            <Budgets />
          </div>
          <div className="col-span-12 lg:col-span-6 xl:col-span-4">
            <Visitors />
          </div>
          <div className="col-span-12 grid grid-cols-4 gap-5 lg:col-span-6 xl:col-span-5">
            <Stats />
          </div>
          <div className="col-span-12 lg:col-span-6 xl:col-span-4">
            <RadarCard />
          </div>
          <div className="col-span-12 lg:col-span-6 xl:col-span-3">
            <StackBar />
          </div>
        </div>
      </div>
    </>
  )
}
