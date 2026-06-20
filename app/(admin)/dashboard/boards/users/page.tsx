import type { getAllUsers } from "@/lib/actions/admin/users";
import { UserSearch } from "./components/user-search";
import { UsersTable } from "./components/users-table";

type UsersResult = Awaited<ReturnType<typeof getAllUsers>>;

export interface UsersBoardProps {
  users: UsersResult["users"];
  totalCount: UsersResult["totalCount"];
  error?: UsersResult["error"];
  page: number;
}

export default function UsersPage({ users, totalCount, error, page }: UsersBoardProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load users</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UserSearch />
      <UsersTable users={users} totalCount={totalCount} currentPage={page} />
    </div>
  );
}
