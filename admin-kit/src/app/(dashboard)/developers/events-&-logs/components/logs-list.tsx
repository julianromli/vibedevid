import { useState } from "react"
import LogsTable from "./logs-table"
import LogsToolbar from "./logs-toolbar"

interface Props {
  toggleFilters: () => void
}

export default function LogsList({ toggleFilters }: Props) {
  const [searchVal, setSearchVal] = useState("")

  return (
    <div>
      <LogsToolbar
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        toggleFilters={toggleFilters}
      />
      <LogsTable searchVal={searchVal} />
    </div>
  )
}
