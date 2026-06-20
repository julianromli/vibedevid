import { revalidatePath } from "@/lib/revalidation";
import { getDb } from "@/lib/db";
import { users, authUser } from "@/lib/db/schema";
import { requireUser } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/auth/permissions";
import { ROLES, RoleSchema, UserIdSchema } from "./schemas";
import { eq, and, asc, inArray, or, ilike, count, sql } from "drizzle-orm";

function sanitizeSearchInput(search: string): string {
  return search.replace(/[%_]/g, "\\$&");
}

type UserProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: number | null;
};

export interface PrivilegedUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role: number;
  joined_at: string;
  is_current_user: boolean;
}

export interface PrivilegedUsersResult {
  success: boolean;
  users?: PrivilegedUser[];
  adminCount?: number;
  moderatorCount?: number;
  currentUserId?: string;
  error?: string;
}

export interface UserSearchResult {
  success: boolean;
  users?: Array<{
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
    role: number;
  }>;
  error?: string;
}

async function getAdminSession() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return { userId: user.id };
}

async function getEmailMap(userIds: string[]) {
  const emailMap: Record<string, string> = {};

  if (userIds.length === 0) return emailMap;

  const db = getDb();
  const authRows = await db
    .select({ id: authUser.id, email: authUser.email })
    .from(authUser)
    .where(inArray(authUser.id, userIds));

  authRows.forEach((row) => {
    emailMap[row.id] = row.email || "";
  });

  return emailMap;
}

function formatPrivilegedUser(
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    role: number | null;
    joined_at: string;
  },
  emailMap: Record<string, string>,
  currentUserId: string,
): PrivilegedUser {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: emailMap[user.id] || "",
    avatar_url: user.avatar_url,
    role: user.role ?? ROLES.USER,
    joined_at: user.joined_at,
    is_current_user: user.id === currentUserId,
  };
}

export async function getPrivilegedUsers(): Promise<PrivilegedUsersResult> {
  try {
    const { userId } = await getAdminSession();
    const db = getDb();

    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        role: users.role,
        joinedAt: users.joinedAt,
      })
      .from(users)
      .where(inArray(users.role, [ROLES.ADMIN, ROLES.MODERATOR]))
      .orderBy(asc(users.role), asc(users.joinedAt));

    const formattedRows = rows.map((row) => ({
      id: row.id,
      username: row.username,
      display_name: row.displayName,
      avatar_url: row.avatarUrl,
      role: row.role,
      joined_at: row.joinedAt?.toISOString() ?? "",
    }));

    const emailMap = await getEmailMap(formattedRows.map((u) => u.id));
    const formatted = formattedRows.map((user) => formatPrivilegedUser(user, emailMap, userId));

    return {
      success: true,
      users: formatted,
      adminCount: formatted.filter((u) => u.role === ROLES.ADMIN).length,
      moderatorCount: formatted.filter((u) => u.role === ROLES.MODERATOR).length,
      currentUserId: userId,
    };
  } catch (error) {
    console.error("Get privileged users error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load admin users",
    };
  }
}

async function searchUsersByProfile(
  sanitized: string,
  limit: number,
): Promise<{ users: UserProfileRow[]; error?: string }> {
  const pattern = `%${sanitized}%`;
  const db = getDb();

  try {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(users)
      .where(or(ilike(users.username, pattern), ilike(users.displayName, pattern)))
      .orderBy(asc(users.displayName))
      .limit(limit);

    return {
      users: rows.map((row) => ({
        id: row.id,
        username: row.username,
        display_name: row.displayName,
        avatar_url: row.avatarUrl,
        role: row.role,
      })),
    };
  } catch (error) {
    const pgError = error as { message?: string };
    return { users: [], error: pgError.message || "Search failed" };
  }
}

async function searchUsersByEmail(query: string, limit: number): Promise<UserProfileRow[]> {
  const db = getDb();

  const authRows = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(sql`${authUser.email} ilike ${"%" + query + "%"}`)
    .limit(limit);

  const matchingIds = authRows.map((row) => row.id);
  if (matchingIds.length === 0) {
    return [];
  }

  const profileRows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
    })
    .from(users)
    .where(inArray(users.id, matchingIds));

  return profileRows.map((row) => ({
    id: row.id,
    username: row.username,
    display_name: row.displayName,
    avatar_url: row.avatarUrl,
    role: row.role,
  }));
}

export async function searchUsersForAdminGrant(query: string): Promise<UserSearchResult> {
  try {
    await getAdminSession();

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { success: true, users: [] };
    }

    const sanitized = sanitizeSearchInput(trimmed);
    const limit = 20;

    const [profileResult, emailUsers] = await Promise.all([
      searchUsersByProfile(sanitized, limit),
      searchUsersByEmail(trimmed, limit),
    ]);

    if (profileResult.error) {
      return { success: false, error: profileResult.error };
    }

    const merged = new Map<string, UserProfileRow>();
    for (const user of [...profileResult.users, ...emailUsers]) {
      merged.set(user.id, user);
    }

    const foundUsers = Array.from(merged.values())
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .slice(0, limit);

    const emailMap = await getEmailMap(foundUsers.map((u) => u.id));

    return {
      success: true,
      users: foundUsers.map((user) => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: emailMap[user.id] || "",
        avatar_url: user.avatar_url,
        role: user.role ?? ROLES.USER,
      })),
    };
  } catch (error) {
    console.error("Search users for admin grant error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search users",
    };
  }
}

async function countAdmins() {
  const db = getDb();
  const [result] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, ROLES.ADMIN));
  return result?.value || 0;
}

export async function setPrivilegedUserRole(
  userId: string,
  role: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsedUserId = UserIdSchema.parse(userId);
    const parsedRole = RoleSchema.parse(role);
    const { userId: currentUserId } = await getAdminSession();
    const db = getDb();

    const [targetUser] = await db
      .select({
        id: users.id,
        role: users.role,
        username: users.username,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, parsedUserId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    const currentRole = targetUser.role ?? ROLES.USER;
    const isDemotingAdmin = currentRole === ROLES.ADMIN && parsedRole !== ROLES.ADMIN;

    if (isDemotingAdmin) {
      if (parsedUserId === currentUserId) {
        return { success: false, error: "You cannot remove your own admin access" };
      }

      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        return { success: false, error: "Cannot remove the last admin on the platform" };
      }
    }

    await db
      .update(users)
      .set({ role: parsedRole, updatedAt: new Date() })
      .where(eq(users.id, parsedUserId));

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Set privileged user role error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function grantAdminAccess(userId: string) {
  return setPrivilegedUserRole(userId, ROLES.ADMIN);
}

export async function grantModeratorAccess(userId: string) {
  return setPrivilegedUserRole(userId, ROLES.MODERATOR);
}

export async function revokePrivilegedAccess(userId: string) {
  return setPrivilegedUserRole(userId, ROLES.USER);
}
