"use client";

import { IconFilter, IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
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

const BOARD_TAB: DashboardTabValue = "users";

export function UserSearch() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [status, setStatus] = useState(searchParams.get("status") || "all");

  // Sync state with URL params when they change
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setRole(searchParams.get("role") || "all");
    setStatus(searchParams.get("status") || "all");
  }, [searchParams]);

  const applyFilters = () => {
    navigate({
      to: "/dashboard",
      search: {
        tab: BOARD_TAB,
        search: search || undefined,
        role: role !== "all" ? role : undefined,
        status: status !== "all" ? status : undefined,
        page: undefined,
      },
    });
  };

  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    navigate({ to: "/dashboard", search: { tab: BOARD_TAB } });
  };

  const hasFilters = search || role !== "all" || status !== "all";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
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
