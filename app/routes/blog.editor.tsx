import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NOINDEX_META } from "@/lib/seo/site-url";

export const Route = createFileRoute("/blog/editor")({
  head: () => ({
    meta: [{ title: "Blog Editor | VibeDev ID" }, NOINDEX_META],
  }),
  component: BlogEditorLayout,
});

function BlogEditorLayout() {
  return <Outlet />;
}
