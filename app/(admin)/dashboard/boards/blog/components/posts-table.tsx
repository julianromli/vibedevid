'use client'

import { IconClock, IconEye } from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminPost } from '@/lib/actions/admin/posts'
import { PostActions } from './post-actions'
import { PostEditDialog } from './post-edit-dialog'

interface PostsTableProps {
  posts: AdminPost[]
  totalCount: number
  currentPage: number
}

export function PostsTable({ posts, totalCount, currentPage }: PostsTableProps) {
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null)

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-muted-foreground">No posts found</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-600">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={post.cover_image || ''}
                        alt={post.title}
                      />
                      <AvatarFallback>{post.title[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{post.excerpt}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.author.avatar_url || ''} />
                      <AvatarFallback>{post.author.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{post.author.display_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(post.status)}
                    {post.featured && <Badge className="bg-yellow-500/10 text-yellow-600">Featured</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconEye className="h-3.5 w-3.5" />
                      {post.view_count}
                    </span>
                    {post.read_time_minutes && (
                      <span className="flex items-center gap-1">
                        <IconClock className="h-3.5 w-3.5" />
                        {post.read_time_minutes}m
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <PostActions
                    post={post}
                    onEdit={() => setEditingPost(post)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {posts.length} of {totalCount} posts
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.set('page', String(currentPage - 1))
              window.location.search = params.toString()
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={posts.length < 20}
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.set('page', String(currentPage + 1))
              window.location.search = params.toString()
            }}
          >
            Next
          </Button>
        </div>
      </div>

      {editingPost && (
        <PostEditDialog
          post={editingPost}
          open={!!editingPost}
          onOpenChange={(open: boolean) => !open && setEditingPost(null)}
        />
      )}
    </>
  )
}
