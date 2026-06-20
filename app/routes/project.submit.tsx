import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { SubmitProjectForm } from "@/components/ui/submit-project-form";
import type { Category } from "@/lib/categories";
import { getCategories } from "@/lib/categories";
import { NOINDEX_META } from "@/lib/seo/site-url";
import { getCurrentUser } from "@/lib/server/auth";

const loadSubmitData = createServerFn({ method: "GET" }).handler(async () => {
  const redirectTo = "/project/submit";
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw redirect({ to: "/user/auth", search: { redirectTo } });
  }

  const categories = await getCategories();

  return {
    userId: currentUser.id,
    categories: categories as Category[],
    redirectTo,
  };
});

export const Route = createFileRoute("/project/submit")({
  loader: async () => loadSubmitData(),
  head: () => ({
    meta: [{ title: "Submit Project | VibeDev ID" }, NOINDEX_META],
  }),
  component: ProjectSubmitRoute,
});

function ProjectSubmitRoute() {
  const { userId, categories, redirectTo } = Route.useLoaderData();
  const { t } = useTranslation("projectSubmit");

  return (
    <div className="relative min-h-screen bg-grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

      <div className="container relative mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-3xl">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          <SubmitProjectForm userId={userId} categories={categories} redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
