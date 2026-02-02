import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAllPosts, getAllTags } from '@/lib/actions/admin/posts'
import { PostFilters } from './components/post-filters'
import { PostsTable } from './components/posts-table'
import { TagsManager } from './components/tags-manager'

interface SearchParams {
  status?: string
  search?: string
  page?: string
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const filters = {
    status: params.status as 'all' | 'draft' | 'published' | 'archived' | undefined,
    search: params.search,
  }

  const page = params.page ? parseInt(params.page, 10) : 1

  const [{ posts, totalCount, error }, { tags, error: tagsError }] = await Promise.all([
    getAllPosts(filters, page, 20),
    getAllTags(),
  ])

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
