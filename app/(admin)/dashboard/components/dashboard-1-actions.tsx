import { IconDownload } from '@tabler/icons-react'
import DatePicker from '@/components/date-picker'
import { Button } from '@/components/ui/button'

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
