"use client"

import { useState, useMemo } from "react"
import { IconMaximize, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { referrers } from "../data/data"

export default function ViewAllReferrersDialog() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAndSortedReferrers = useMemo(() => {
    return referrers.filter((referrer) =>
      referrer.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full px-3 pt-[2px] pb-[2px] text-xs"
        >
          View All
          <IconMaximize className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            All Referrers
          </DialogTitle>
          <DialogDescription>
            displays insights about referrers, including sources driving traffic
          </DialogDescription>
        </DialogHeader>
        <div className="relative mb-4">
          <Input
            placeholder="Search referrers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <IconSearch
            className="absolute top-1/2 left-3 -translate-y-1/2 transform text-neutral-400"
            size={16}
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70%]">
                  <Button
                    variant="ghost"
                    className="p-0 font-semibold hover:text-neutral-900"
                  >
                    Referrer
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    className="p-0 font-semibold hover:text-neutral-900"
                  >
                    Visitors
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedReferrers.map((referrer) => (
                <TableRow key={referrer.name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <referrer.icon size={16} className="text-neutral-500" />
                      <span>{referrer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {referrer.visitors.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
