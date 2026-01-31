import Payments from "./components/payments"
import Sales from "./components/sales"
import Stats from "./components/stats"
import Subscription from "./components/subscriptions"
import TeamMembers from "./components/team-members"
import TotalRevenue from "./components/total-revenue"

export default function Overview() {
  return (
    <div className="grid auto-rows-auto grid-cols-3 gap-5 md:grid-cols-6 lg:grid-cols-9">
      <Stats />
      <div className="col-span-3">
        <TotalRevenue />
      </div>

      <div className="col-span-3 md:col-span-6">
        <Sales />
      </div>
      <div className="col-span-3 md:col-span-6 lg:col-span-3">
        <Subscription />
      </div>
      <div className="col-span-3 md:col-span-6 lg:col-span-5 xl:col-span-6">
        <Payments />
      </div>
      <div className="col-span-3 md:col-span-6 lg:col-span-4 xl:col-span-3">
        <TeamMembers />
      </div>
    </div>
  )
}
