'use client'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => fetch(`/api/pages/blog/${slug}`).then((r) => r.json()),
    enabled: !!slug,
  })
  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  const post = data?.post
  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="container mx-auto max-w-3xl px-4 py-10 prose dark:prose-invert">
        {!post ? <p>Post not found. <Link to="/blog">Back</Link></p> : <>
          <h1>{post.title}</h1>
          <p className="text-muted-foreground">{post.excerpt}</p>
        </>}
      </article>
      <Footer />
    </div>
  )
}
