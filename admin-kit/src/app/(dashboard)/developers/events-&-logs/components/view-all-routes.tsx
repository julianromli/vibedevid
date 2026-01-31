"use client"

import { useState, useMemo } from "react"
import { IconMaximize } from "@tabler/icons-react"
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockRoutes } from "../data/data"

export default function ViewAllRouteDialog() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const itemsPerPage = 5

  const filteredAndSortedRoutes = useMemo(() => {
    return mockRoutes.filter((route) =>
      route.route.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const paginatedRoutes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedRoutes.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedRoutes, currentPage])

  const totalPages = Math.ceil(filteredAndSortedRoutes.length / itemsPerPage)

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
      <DialogContent className="sm:max-w-[890px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            All Route Views
          </DialogTitle>
          <DialogDescription>
            Detail information about all route views, including their purpose.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%] cursor-pointer">Route</TableHead>
                <TableHead className="cursor-pointer text-right">
                  View Count
                </TableHead>
                <TableHead className="cursor-pointer text-right">
                  Avg. Time (s)
                </TableHead>
                <TableHead className="cursor-pointer text-right">
                  Bounce Rate
                </TableHead>
                <TableHead className="cursor-pointer text-right">
                  Last Visited
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoutes.map((route) => (
                <TableRow key={route.route}>
                  <TableCell className="font-medium">{route.route}</TableCell>
                  <TableCell className="text-right">
                    {route.viewCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {route.avgTimeOnPage}
                  </TableCell>
                  <TableCell className="text-right">
                    {route.bounceRate}%
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(route.lastVisited).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  onClick={() => setCurrentPage(index + 1)}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </DialogContent>
    </Dialog>
  )
}
