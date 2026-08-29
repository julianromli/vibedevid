import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  grantAdminAccess as grantAdminAccessAction,
  grantModeratorAccess as grantModeratorAccessAction,
  revokePrivilegedAccess as revokePrivilegedAccessAction,
  searchUsersForAdminGrant as searchUsersForAdminGrantAction,
} from "@/lib/actions/admin/admins";
import { UserIdSchema } from "@/lib/actions/admin/schemas";

const UserIdInput = z.object({ userId: UserIdSchema });
const SearchQueryInput = z.object({ query: z.string().min(1).max(100) });

export const searchUsersForAdminGrantFn = createServerFn({ method: "GET" })
  .validator(SearchQueryInput)
  .handler(async ({ data }) => searchUsersForAdminGrantAction(data.query));

export const grantAdminAccessFn = createServerFn({ method: "POST" })
  .validator(UserIdInput)
  .handler(async ({ data }) => grantAdminAccessAction(data.userId));

export const grantModeratorAccessFn = createServerFn({ method: "POST" })
  .validator(UserIdInput)
  .handler(async ({ data }) => grantModeratorAccessAction(data.userId));

export const revokePrivilegedAccessFn = createServerFn({ method: "POST" })
  .validator(UserIdInput)
  .handler(async ({ data }) => revokePrivilegedAccessAction(data.userId));
