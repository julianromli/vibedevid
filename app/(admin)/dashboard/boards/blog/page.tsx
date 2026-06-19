import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { getAllPosts, getAllTags } from '@/lib/actions/admin/posts'
import { PostFilters } from './components/post-filters'
import { PostsTable } from './components/posts-table'
import { TagsManager } from './components/tags-manager'

type PostsResult = Awaited<ReturnType<typeof getAllPosts>>
type TagsResult = Awaited<ReturnType<typeof getAllTags>>

export interface BlogBoardProps {
  posts: PostsResult['posts']
  totalCount: PostsResult['totalCount']
  error?: PostsResult['error']
  tags: TagsResult['tags']
  page: number
}

export default function BlogPage({ posts, totalCount, error, tags, page }: BlogBoardProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load posts</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    )
  }

  return (
    <Tabs
      defaultValue="posts"
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>

      <TabsContent
        value="posts"
        className="space-y-4"
      >
        <PostFilters />
        <PostsTable
          posts={posts}
          totalCount={totalCount}
          currentPage={page}
        />
      </TabsContent>

      <TabsContent value="tags">
        <TagsManager tags={tags || []} />
      </TabsContent>
    </Tabs>
  )
}
