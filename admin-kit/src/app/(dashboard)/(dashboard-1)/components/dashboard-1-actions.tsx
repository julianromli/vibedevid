import { IconDownload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import DatePicker from "@/components/date-picker"

export default function Dashboard1Actions() {
  return (
    <div className="flex items-center space-x-2">
      <Button>
        <IconDownload />
        Download
      </Button>
      <DatePicker />
    </div>
  )
}
