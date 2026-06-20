import { createFileRoute, Outlet } from '@tanstack/react-router'

/**
 * Layout route for `/blog`. It only renders an `<Outlet />` so that child
 * routes (`/blog` index and `/blog/$slug`) render in its place. The blog list
 * lives in `blog.index.tsx`; the post detail lives in `blog.$slug.tsx`.
 *
 * Without this Outlet, navigating to `/blog/$slug` rendered the blog list
 * because the detail route is nested under this layout.
 */
export const Route = createFileRoute('/blog')({
  component: BlogLayout,
})

function BlogLayout() {
  return <Outlet />
}
