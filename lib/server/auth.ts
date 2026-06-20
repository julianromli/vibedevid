import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { createUserProfile } from "@/lib/auth/profile";
import { getAuth } from "@/lib/auth/server";
import { isAdminOrModerator } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
}

export async function getServerSession(requestHeaders?: Headers) {
  const auth = getAuth();
  const headers = requestHeaders ?? getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  return session;
}

export async function getCurrentUser() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const db = getDb();
  let [profile] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

  if (!profile) {
    await createUserProfile({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
    [profile] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    if (!profile) {
      throw new Error(`Missing profile for authenticated user ${session.user.id}`);
    }
  }

  return {
    id: profile.id,
    name: profile.displayName,
    email: session.user.email,
    avatar: profile.avatarUrl || "/placeholder.svg",
    avatar_url: profile.avatarUrl || "/placeholder.svg",
    username: profile.username,
    role: profile.role,
  };
}

export async function requireUser() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdminOrModeratorUser() {
  const user = await requireUser();
  const db = getDb();
  const [profile] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!isAdminOrModerator(profile?.role)) {
    throw new Error("Unauthorized: admin or moderator access required");
  }

  return user;
}

export async function checkProjectOwnership(authorUsername: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, authorUsername))
    .limit(1);

  return row?.id === userId;
}
