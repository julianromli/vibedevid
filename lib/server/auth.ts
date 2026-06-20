import { getRequest, getRequestHeaders } from "@tanstack/react-start/server";
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

type ServerSession = Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>;

/**
 * Request-scoped cache for the resolved session. The homepage (and most pages)
 * resolve the session multiple times per request — root `beforeLoad`, route
 * loaders, and data helpers like `getBatchLikeStatus` all call
 * `getServerSession()`. Each call is an auth roundtrip, so on Cloudflare Workers
 * the duplicates add up to hundreds of ms of server response time.
 *
 * We key the cache on the per-request `Request` object (stable within a request,
 * garbage-collected after), so there is no cross-request leakage. Callers that
 * pass explicit `requestHeaders` bypass the cache, since they intentionally
 * resolve a session for a different header set.
 */
const sessionCache = new WeakMap<Request, Promise<ServerSession>>();

async function resolveSession(headers: Headers): Promise<ServerSession> {
  const auth = getAuth();
  return auth.api.getSession({ headers });
}

export async function getServerSession(requestHeaders?: Headers) {
  if (requestHeaders) {
    return resolveSession(requestHeaders);
  }

  let request: Request | undefined;
  try {
    request = getRequest();
  } catch {
    request = undefined;
  }

  if (!request) {
    // Outside a request context (should not happen server-side) — resolve directly.
    return resolveSession(getRequestHeaders());
  }

  const cached = sessionCache.get(request);
  if (cached) {
    return cached;
  }

  const pending = resolveSession(getRequestHeaders());
  sessionCache.set(request, pending);
  return pending;
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
