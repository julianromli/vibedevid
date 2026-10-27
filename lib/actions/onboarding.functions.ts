import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  checkUsernameAvailability,
  claimUsername,
  getOnboardingState,
} from "@/lib/actions/onboarding";

const usernameSchema = z.object({ username: z.string().max(64) });

export const checkUsernameAvailabilityFn = createServerFn({ method: "POST" })
  .validator(usernameSchema)
  .handler(async ({ data }) => {
    return checkUsernameAvailability({ username: data.username, headers: getRequestHeaders() });
  });

export const claimUsernameFn = createServerFn({ method: "POST" })
  .validator(usernameSchema)
  .handler(async ({ data }) => claimUsername({ username: data.username }));

export const getOnboardingStateFn = createServerFn({ method: "GET" }).handler(async () =>
  getOnboardingState(),
);
