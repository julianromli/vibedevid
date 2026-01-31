import { IconFilter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import DatePicker from "@/components/date-picker"

export default function Dashboard3Actions() {
  return (
    <div className="flex items-center gap-2">
      <DatePicker />
      <Button>
        <IconFilter /> Filter By
      </Button>
    </div>
  )
}
