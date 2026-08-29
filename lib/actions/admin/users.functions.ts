import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { RoleSchema, SuspensionReasonSchema, UserIdSchema } from "@/lib/actions/admin/schemas";
import {
  suspendUser as suspendUserAction,
  updateUserRole as updateUserRoleAction,
} from "@/lib/actions/admin/users";

export const updateUserRoleFn = createServerFn({ method: "POST" })
  .validator(z.object({ userId: UserIdSchema, role: RoleSchema }))
  .handler(async ({ data }) => updateUserRoleAction(data.userId, data.role));

export const suspendUserFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: UserIdSchema,
      suspended: z.boolean(),
      reason: SuspensionReasonSchema,
    }),
  )
  .handler(async ({ data }) => suspendUserAction(data.userId, data.suspended, data.reason));
