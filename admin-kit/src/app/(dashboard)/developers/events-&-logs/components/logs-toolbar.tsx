import { Dispatch, SetStateAction } from "react"
import {
  IconFilter,
  IconPlaystationTriangle,
  IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SearchInput } from "@/components/search-input"
import LogsAction from "./logs-actions"
import MobileFilterSheet from "./mobile-filter-sheet"

interface Props {
  toggleFilters: () => void
  searchVal: string
  setSearchVal: Dispatch<SetStateAction<string>>
}

export default function LogsToolbar({
  toggleFilters,
  searchVal,
  setSearchVal,
}: Props) {
  return (
    <div className="border-muted flex items-center gap-2 border-b p-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleFilters}
              className="hidden shrink-0 lg:block"
              variant="outline"
              size="icon"
            >
              <IconFilter className="m-auto" size={20} strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Toggle Filter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <MobileFilterSheet />

      <SearchInput
        value={searchVal}
        onChange={(e) => setSearchVal(e)}
        className="flex-1"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="shrink-0" variant="outline" size="icon">
              <IconRefresh size={20} strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Refresh</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button variant="outline" className="shrink-0 px-3">
        <IconPlaystationTriangle
          className="rotate-90"
          size={20}
          strokeWidth={1.5}
        />
        <p className="text-sm">Live</p>
      </Button>
      <LogsAction />
    </div>
  )
}
