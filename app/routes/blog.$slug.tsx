import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { getComments } from '@/lib/actions/comments'
import { absoluteUrl } from '@/lib/seo/site-url'
import { createClient } from '@/lib/supabase/server'
import BlogPostData, { type BlogPostDataProps } from '@/app/blog/[slug]/blog-post-data'

const DEFAULT_OG_IMAGE = 'https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNWvWOsz96heqapobuABSCvEXgf9wT2xdRkGM0'

/**
 * Server-only data fetching for a blog post. Wrapped in `createServerFn` so the
 * cookie-aware Supabase server client never executes (or gets bundled) on the
 * client when the loader re-runs during client-side navigation.
 */
const loadBlogPostData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }): Promise<BlogPostDataProps & { slug: string }> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userData: BlogPostDataProps['userData'] = null
    let commentUser: BlogPostDataProps['commentUser'] = null
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, username, role')
        .eq('id', user.id)
        .single()

      if (profile) {
        userData = {
          id: profile.id,
          name: profile.display_name,
          email: user.email || '',
          avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
          username: profile.username,
          role: profile.role ?? null,
        }
        commentUser = {
          id: profile.id,
          name: profile.display_name,
          avatar: profile.avatar_url || undefined,
        }
      }
    }

    const { data: post, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url, bio, role),
        tags:blog_post_tags(post_tags(name))
      `,
      )
      .eq('slug', slug)
      .single()

    if (error || !post || post.status !== 'published') {
      throw notFound()
    }

    const [{ count: viewCount }, { comments: initialComments }] = await Promise.all([
      supabase.from('views').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      getComments('post', post.id),
    ])

    return {
      post,
      viewCount: viewCount ?? 0,
      initialComments,
      isLoggedIn: !!user,
      userData,
      commentUser,
      slug,
    }
  })

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }): Promise<BlogPostDataProps & { slug: string }> => {
    return loadBlogPostData({ data: { slug: params.slug } })
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) {
      return {
        meta: [
          { title: 'Post Not Found' },
          { name: 'description', content: 'The blog post you are looking for does not exist.' },
        ],
      }
    }

    const postUrl = absoluteUrl(`/blog/${loaderData.slug}`)
    const ogImage = post.cover_image || DEFAULT_OG_IMAGE
    const author = post.author as { display_name: string } | null
    const authorName = author?.display_name || 'VibeDev ID'
    const tags = post.tags as Array<{ post_tags: { name: string } | null }> | null
    const postTags = tags?.map((t) => t.post_tags?.name).filter((name): name is string => Boolean(name)) ?? []
    const description = post.excerpt || `Baca artikel ${post.title} di VibeDev ID Blog`

    return {
      meta: [
        { title: post.title },
        { name: 'description', content: description },
        ...(postTags.length > 0 ? [{ name: 'keywords', content: postTags.join(', ') }] : []),
        { name: 'author', content: authorName },
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: postUrl },
        { property: 'og:site_name', content: 'VibeDev ID' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:type', content: 'article' },
        ...(post.published_at ? [{ property: 'article:published_time', content: post.published_at }] : []),
        { property: 'og:image', content: ogImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: post.title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
        { name: 'twitter:site', content: '@vibedevid' },
        { name: 'twitter:creator', content: '@vibedevid' },
      ],
      links: [{ rel: 'canonical', href: postUrl }],
    }
  },
  component: BlogPostRoute,
})

function BlogPostRoute() {
  const { post, viewCount, initialComments, isLoggedIn, userData, commentUser } = Route.useLoaderData()

  return (
    <BlogPostData
      post={post}
      viewCount={viewCount}
      initialComments={initialComments}
      isLoggedIn={isLoggedIn}
      userData={userData}
      commentUser={commentUser}
    />
  )
}
