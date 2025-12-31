'use client'

import { Edit, Eye, MoreHorizontal, Plus, Trash2, Calendar, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deleteBlogPost, getAuthorPosts } from '@/lib/actions/blog'

interface Post {
  id: string
  title: string
  slug: string
  status: 'published' | 'draft' | 'archived'
  created_at: string
  published_at: string | null
  view_count: number
  excerpt?: string
  cover_image?: string
}

export function PostDashboardClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { success, data, error } = await getAuthorPosts(1, activeTab as any)
      if (success && data) {
        setPosts(data as unknown as Post[])
      } else {
        toast.error(error || 'Failed to fetch posts')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const result = await deleteBlogPost(deleteId)
      if (result.success) {
        toast.success('Post deleted')
        fetchPosts() // Refresh list
      } else {
        toast.error(result.error || 'Failed to delete')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setDeleteId(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Posts</h1>
          <p className="text-muted-foreground">Manage your blog posts and track their performance.</p>
        </div>
        <Link href="/blog/editor">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </Link>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mb-2 text-lg font-medium">No posts found</p>
              <p className="mb-4 text-muted-foreground">You haven't created any posts in this category yet.</p>
              {activeTab !== 'all' && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                >
                  View All Posts
                </Button>
              )}
              {activeTab === 'all' && (
                <Link href="/blog/editor">
                  <Button variant="outline">Create your first post</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col divide-y rounded-md border bg-card">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group flex flex-col gap-4 p-6 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:gap-6"
                >
                  {/* Content Section */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/blog/editor/${post.slug}`}
                        className="font-bold text-xl hover:text-primary transition-colors line-clamp-2"
                      >
                        {post.title}
                      </Link>
                      <Badge
                        variant={getStatusColor(post.status)}
                        className="capitalize shrink-0"
                      >
                        {post.status}
                      </Badge>
                    </div>

                    {post.excerpt ? (
                      <p className="text-muted-foreground line-clamp-2 md:line-clamp-3">{post.excerpt}</p>
                    ) : (
                      <p className="text-muted-foreground/60 italic text-sm">No description provided.</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {post.status === 'published' ? 'Published' : 'Created'}:{' '}
                        <span className="font-medium text-foreground">
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                      </span>

                      {post.status === 'published' && (
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">{post.view_count}</span> views
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Section */}
                  {post.cover_image && (
                    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-48 border">
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 200px"
                      />
                    </div>
                  )}

                  {/* Actions Section */}
                  <div className="flex items-center gap-1 self-start sm:ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Link href={`/blog/editor/${post.slug}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {post.status === 'published' && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Live
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Tabs>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your blog post and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
