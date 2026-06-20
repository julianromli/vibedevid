import type { getPrivilegedUsers } from "@/lib/actions/admin/admins";
import { AdminManagementBoard } from "./components/admin-management-board";

type PrivilegedUsersResult = Awaited<ReturnType<typeof getPrivilegedUsers>>;

export interface AdminManagementBoardProps {
  result: PrivilegedUsersResult;
}

export default function AdminManagementPage({ result }: AdminManagementBoardProps) {
  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load admin management</div>
        <div className="text-muted-foreground mt-1 text-sm">{result.error || "Unknown error"}</div>
      </div>
    );
  }

  return (
    <AdminManagementBoard
      initialUsers={result.users ?? []}
      adminCount={result.adminCount || 0}
      moderatorCount={result.moderatorCount || 0}
    />
  );
}
