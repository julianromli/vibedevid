import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "@/lib/server/auth";

export const getProfileFn = createServerFn({ method: "GET" }).handler(async () => {
  return getCurrentUser();
});
