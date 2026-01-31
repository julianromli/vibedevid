import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import LongText from "@/components/long-text"
import { getLevelVariant, logEntries } from "../data/data"

interface Props {
  searchVal: string
}

export default function LogsTable({ searchVal }: Props) {
  const filteredLogs = useMemo(
    () =>
      logEntries.filter((log) =>
        log.message.toLowerCase().includes(searchVal.toLowerCase())
      ),
    [searchVal]
  )
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px] pl-4">Timestamp</TableHead>
          <TableHead className="w-[100px]">Level</TableHead>
          <TableHead>Message</TableHead>
          <TableHead className="w-[150px]">Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredLogs.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="pl-4 font-medium">
              <LongText>{entry.timestamp}</LongText>
            </TableCell>
            <TableCell>
              <Badge variant={getLevelVariant(entry.level)}>
                {entry.level}
              </Badge>
            </TableCell>
            <TableCell>
              <LongText>{entry.message}</LongText>
            </TableCell>
            <TableCell>{entry.source}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="pl-4" colSpan={3}>
            Total
          </TableCell>
          <TableCell className="text-start">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
