import { revalidatePath } from "@/lib/revalidation";
import { normalizeProfileSocialUrl, normalizeProfileWebsiteUrl } from "@/lib/profile-social-links";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { toUserProfile } from "@/lib/db/mappers";
import { getServerSession, requireUser } from "@/lib/server/auth";
import { eq, and, ne } from "drizzle-orm";
import type { User } from "@/types/homepage";

interface UpdateProfileData {
  username: string;
  displayName: string;
  bio: string;
  avatar_url: string;
  location: string;
  website: string;
  github_url: string;
  x_url: string;
  instagram_url: string;
  threads_url: string;
  twitter_url?: string;
}

interface UpdateProfileResult {
  success: boolean;
  error?: string;
  data?: UpdateProfileData;
  usernameChanged?: boolean;
  newUsername?: string;
}

export async function getCurrentUser(): Promise<{ user: User | null; error?: string }> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return { user: null, error: "Not authenticated" };
    }

    const db = getDb();
    const [userData] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    if (!userData) {
      return { user: null, error: "User not found" };
    }

    const mapped = toUserProfile(userData);

    return {
      user: {
        id: mapped.id,
        username: mapped.username,
        name: mapped.displayName,
        displayName: mapped.displayName,
        email: session.user.email || "",
        avatar: mapped.avatarUrl,
        avatar_url: mapped.avatarUrl,
        role: mapped.role,
      } as User,
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return { user: null, error: "Failed to fetch user" };
  }
}

export async function updateUserProfile(
  currentUsername: string,
  profileData: UpdateProfileData,
): Promise<UpdateProfileResult> {
  try {
    const sessionUser = await requireUser();
    const db = getDb();

    const [currentUser] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.username, currentUsername))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: "Profile not found" };
    }

    if (currentUser.id !== sessionUser.id) {
      return { success: false, error: "Not authorized to edit this profile" };
    }

    const usernameChanged = profileData.username !== currentUsername;
    if (usernameChanged) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.username, profileData.username), ne(users.id, currentUser.id)))
        .limit(1);

      if (existingUser) {
        return { success: false, error: "Username is already taken" };
      }
    }

    const normalizedProfileData = {
      ...profileData,
      website: normalizeProfileWebsiteUrl(profileData.website),
      github_url: normalizeProfileSocialUrl("github", profileData.github_url),
      x_url: normalizeProfileSocialUrl("x", profileData.x_url || profileData.twitter_url),
      instagram_url: normalizeProfileSocialUrl("instagram", profileData.instagram_url),
      threads_url: normalizeProfileSocialUrl("threads", profileData.threads_url),
    };

    await db
      .update(users)
      .set({
        username: normalizedProfileData.username,
        displayName: normalizedProfileData.displayName,
        bio: normalizedProfileData.bio,
        avatarUrl: normalizedProfileData.avatar_url,
        location: normalizedProfileData.location,
        website: normalizedProfileData.website,
        githubUrl: normalizedProfileData.github_url,
        xUrl: normalizedProfileData.x_url,
        instagramUrl: normalizedProfileData.instagram_url,
        threadsUrl: normalizedProfileData.threads_url,
        twitterUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.username, currentUsername));

    revalidatePath(`/${currentUsername}`);
    if (usernameChanged) {
      revalidatePath(`/${profileData.username}`);
    }

    return {
      success: true,
      data: normalizedProfileData,
      usernameChanged,
      newUsername: usernameChanged ? normalizedProfileData.username : undefined,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
