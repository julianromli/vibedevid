import { dashboard1Stats } from "../data/data"
import StatsCard from "./stats-card"

export default function Stats() {
  return (
    <div className="col-span-6 grid grid-cols-6 gap-4">
      {dashboard1Stats.map((stats) => (
        <div key={stats.label} className="col-span-3">
          <StatsCard key={stats.label} {...stats} />
        </div>
      ))}
    </div>
  )
}
