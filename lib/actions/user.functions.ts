import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getCurrentUser as getCurrentUserAction,
  updateUserProfile as updateUserProfileAction,
} from "@/lib/actions/user";

const updateProfileSchema = z.object({
  currentUsername: z.string().min(1),
  profileData: z.object({
    username: z.string().min(1),
    displayName: z.string(),
    bio: z.string(),
    avatar_url: z.string(),
    location: z.string(),
    website: z.string(),
    github_url: z.string(),
    x_url: z.string(),
    instagram_url: z.string(),
    threads_url: z.string(),
    twitter_url: z.string().optional(),
  }),
});

export const updateUserProfileFn = createServerFn({ method: "POST" })
  .validator(updateProfileSchema)
  .handler(async ({ data }) => {
    return updateUserProfileAction(data.currentUsername, data.profileData);
  });

/**
 * Fetch the authenticated user's profile (or null). Safe to call from the
 * client; auth is resolved server-side from the request cookies.
 */
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const { user } = await getCurrentUserAction();
  return user;
});
