"use client";

import { IconFilter, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardTabValue } from "@/lib/admin/dashboard-tabs";
import { useNavigate, useSearchParams } from "@/lib/navigation";

const BOARD_TAB: DashboardTabValue = "projects";

interface ProjectFiltersProps {
  categories: string[];
}

export function ProjectFilters({ categories }: ProjectFiltersProps) {
  const navigate = useNavigate();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [category, setCategory] = useState(searchParams.get("category") || "all");

  const applyFilters = () => {
    navigate({
      to: "/dashboard",
      search: {
        tab: BOARD_TAB,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        category: category !== "all" ? category : undefined,
        // Reset to first page on filter change
        page: undefined,
      },
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("all");
    navigate({ to: "/dashboard", search: { tab: BOARD_TAB } });
  };

  const hasFilters = search || status !== "all" || category !== "all";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="secondary" size="sm" onClick={applyFilters}>
          <IconFilter className="h-4 w-4 mr-1" />
          Filter
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
