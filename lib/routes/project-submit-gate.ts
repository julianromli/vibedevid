import { redirect } from "@tanstack/react-router";
import type { Category } from "@/lib/categories";

export const PROJECT_SUBMIT_PATH = "/project/submit";

export type ProjectSubmitLoadResult =
  | { status: "unauthenticated" }
  | { status: "ok"; userId: string; categories: Category[] };

export function resolveProjectSubmitLoaderData(data: ProjectSubmitLoadResult) {
  if (data.status === "unauthenticated") {
    throw redirect({
      to: "/user/auth",
      search: { redirectTo: PROJECT_SUBMIT_PATH },
    });
  }

  return {
    userId: data.userId,
    categories: data.categories,
    redirectTo: PROJECT_SUBMIT_PATH,
  };
}
