import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { UserPrimaryActions } from "./components/user-primary-actions"
import { columns } from "./components/users-columns"
import { UsersStats } from "./components/users-stats"
import { UsersTable } from "./components/users-table"
import { userListSchema } from "./data/schema"
import { getUsers } from "./data/users"

export default async function UsersPage() {
  const users = getUsers()
  const userList = userListSchema.parse(users)
  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            User List
          </h2>
          <UserPrimaryActions />
        </div>
        <UsersStats />
      </div>
      <div className="flex-1">
        <UsersTable data={userList} columns={columns} />
      </div>
    </>
  )
}
