import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import BlogPostData, { type BlogPostDataProps } from '@/app/blog/[slug]/blog-post-data'
import { getComments } from '@/lib/actions/comments'
import { publicPageHead } from '@/lib/seo/page-meta'
import { blogPostingSchema } from '@/lib/seo/schema-templates'
import { getCurrentUser } from '@/lib/server/auth'
import { fetchPostDetailBySlug } from '@/lib/server/blog-public'

const loadBlogPostData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }): Promise<BlogPostDataProps & { slug: string }> => {
    const currentUser = await getCurrentUser()

    let userData: BlogPostDataProps['userData'] = null
    let commentUser: BlogPostDataProps['commentUser'] = null
    if (currentUser) {
      userData = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        username: currentUser.username,
        role: currentUser.role ?? null,
      }
      commentUser = {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar_url || undefined,
      }
    }

    const detail = await fetchPostDetailBySlug(slug)
    if (!detail) {
      throw notFound()
    }

    const { comments: initialComments } = await getComments('post', detail.post.id)

    return {
      post: detail.post,
      viewCount: detail.viewCount,
      initialComments,
      isLoggedIn: !!currentUser,
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

    const authorName = post.author?.display_name || 'VibeDev ID'
    const postTagsList = post.tags.map((tag) => tag.post_tags?.name).filter((name): name is string => Boolean(name))
    const description = post.excerpt || `Baca artikel ${post.title} di blog VibeDev ID.`
    const page = publicPageHead({
      title: `${post.title} | VibeDev ID`,
      description,
      path: `/blog/${loaderData.slug}`,
      image: post.cover_image,
      type: 'article',
    })

    return {
      meta: [
        ...page.meta,
        ...(postTagsList.length > 0 ? [{ name: 'keywords', content: postTagsList.join(', ') }] : []),
        { name: 'author', content: authorName },
        ...(post.published_at ? [{ property: 'article:published_time', content: post.published_at }] : []),
      ],
      links: page.links,
    }
  },
  component: BlogPostRoute,
})

function BlogPostRoute() {
  const { post, viewCount, initialComments, isLoggedIn, userData, commentUser, slug } = Route.useLoaderData()

  const blogPosting = blogPostingSchema(post, slug)

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(blogPosting)}</script>
      <BlogPostData
        post={post}
        viewCount={viewCount}
        initialComments={initialComments}
        isLoggedIn={isLoggedIn}
        userData={userData}
        commentUser={commentUser}
      />
    </>
  )
}
