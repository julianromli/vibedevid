import { IconFileDescription, IconFilter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default function Dashboard2Actions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline">
        <IconFilter /> Filter By
      </Button>
      <Button variant="default">
        <IconFileDescription />
        Export
      </Button>
    </div>
  )
}
