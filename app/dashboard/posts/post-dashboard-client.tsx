'use client'

import { Edit, Eye, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

        <div className="mt-4 rounded-md border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="mb-2 text-lg font-medium">No posts found</p>
              <p className="text-muted-foreground mb-4">You haven't created any posts in this category yet.</p>
              {activeTab !== 'all' && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                >
                  View All Posts
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/blog/editor/${post.slug}`}
                        className="font-semibold hover:underline"
                      >
                        {post.title}
                      </Link>
                      <Badge
                        variant={
                          post.status === 'published' ? 'default' : post.status === 'draft' ? 'secondary' : 'outline'
                        }
                        className="capitalize"
                      >
                        {post.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {post.status === 'published' ? 'Published' : 'Created'}:{' '}
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                      {post.status === 'published' && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {post.view_count} views
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
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
              This action cannot be undone. This will permanently delete your blog post.
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
