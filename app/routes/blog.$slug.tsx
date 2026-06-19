import { createFileRoute } from '@tanstack/react-router'
import { absoluteUrl } from '@/lib/seo/site-url'
import { createClient } from '@/lib/supabase/server'
import BlogPostData from '@/app/blog/[slug]/blog-post-data'

const DEFAULT_OG_IMAGE = 'https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNWvWOsz96heqapobuABSCvEXgf9wT2xdRkGM0'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const supabase = await createClient()
    const { data: post } = await supabase
      .from('posts')
      .select(`
        title,
        excerpt,
        cover_image,
        published_at,
        status,
        author:users!posts_author_id_fkey(display_name),
        tags:blog_post_tags(post_tags(name))
      `)
      .eq('slug', params.slug)
      .single()

    return { post, slug: params.slug }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post || post.status !== 'published') {
      return {
        meta: [
          { title: 'Post Not Found' },
          { name: 'description', content: 'The blog post you are looking for does not exist.' },
        ],
      }
    }

    const postUrl = absoluteUrl(`/blog/${loaderData.slug}`)
    const ogImage = post.cover_image || DEFAULT_OG_IMAGE
    const author = post.author as unknown as { display_name: string } | null
    const authorName = author?.display_name || 'VibeDev ID'
    const tags = post.tags as unknown as Array<{ post_tags: { name: string } | null }> | null
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
  const { slug } = Route.useParams()

  return <BlogPostData params={Promise.resolve({ slug })} />
}
