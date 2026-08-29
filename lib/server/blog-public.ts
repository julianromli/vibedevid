import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { toPostDto, toUserProfile } from "@/lib/db/mappers";
import { blogPostTags, posts, postTags, users, views } from "@/lib/db/schema";

export interface BlogAuthor {
  display_name: string;
  avatar_url: string | null;
}

export interface BlogPostTag {
  post_tags: { name: string } | null;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  read_time_minutes: number | null;
  author: BlogAuthor | null;
  author_id?: string;
  tags?: BlogPostTag[];
}

export interface BlogPostDetail {
  post: PublishedPostDetail;
  viewCount: number;
}

/** Detail-read wire shape shared with app/blog/[slug]/blog-post-data.tsx. */
export interface PublishedPostDetail {
  id: string;
  title: string;
  slug: string;
  // `string | object` deliberately: serializer only accepts closed shapes and
  // legacy posts carry either a JSON tree or plain text.
  content: string | object;
  excerpt: string | null;
  cover_image: string | null;
  author_id: string | null;
  status: string;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  read_time_minutes: number | null;
  featured: boolean;
  author: PublishedPostAuthor | null;
  tags: BlogPostTag[];
}

export interface PublishedPostAuthor {
  username: string;
  display_name: string;
  avatar_url: string;
  role: number | null;
}

/**
 * Fetch tag names for one or more posts. Single source for the nested
 * `post_tags` wire shape consumed by both the list and the detail read.
 */
async function fetchTagsByPostIds(postIds: string[]) {
  const db = getDb();
  return db
    .select({
      postId: blogPostTags.postId,
      tagName: postTags.name,
    })
    .from(blogPostTags)
    .innerJoin(postTags, eq(blogPostTags.tagId, postTags.id))
    .where(inArray(blogPostTags.postId, postIds));
}

/**
 * Blog read (detail): published post + author + tags + view count.
 * Returns null only when the post is missing or not published — database
 * failures propagate so routes can distinguish 404 from 500.
 */
export async function fetchPostDetailBySlug(slug: string): Promise<BlogPostDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({
      post: posts,
      author: users,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!row || row.post.status !== "published") {
    return null;
  }

  const tagRows = await fetchTagsByPostIds([row.post.id]);

  const mappedPost = toPostDto(row.post);
  const author = row.author ? toUserProfile(row.author) : null;

  const post: PublishedPostDetail = {
    id: mappedPost.id,
    title: mappedPost.title,
    slug: mappedPost.slug,
    content:
      typeof mappedPost.content === "object" && mappedPost.content !== null
        ? mappedPost.content
        : "",
    excerpt: mappedPost.excerpt,
    cover_image: mappedPost.coverImage,
    author_id: mappedPost.authorId,
    status: mappedPost.status,
    published_at: mappedPost.publishedAt,
    created_at: mappedPost.createdAt,
    updated_at: mappedPost.updatedAt,
    read_time_minutes: mappedPost.readTimeMinutes,
    featured: mappedPost.featured ?? false,
    author: author
      ? {
          username: author.username,
          display_name: author.displayName,
          avatar_url: author.avatarUrl || "/placeholder.svg",
          role: author.role,
        }
      : null,
    tags: tagRows.map((tag) => ({ post_tags: { name: tag.tagName } })),
  };

  const [viewResult] = await db
    .select({ count: count() })
    .from(views)
    .where(eq(views.postId, row.post.id));

  return {
    post,
    viewCount: viewResult?.count ?? 0,
  };
}

export async function fetchPublishedPosts(): Promise<BlogPostListItem[]> {
  const db = getDb();

  const rows = await db
    .select({
      post: posts,
      authorDisplayName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt)))
    .orderBy(desc(posts.publishedAt));

  if (rows.length === 0) {
    return [];
  }

  const postIds = rows.map((row) => row.post.id);
  const tagRows = await fetchTagsByPostIds(postIds);

  const tagsByPostId = new Map<string, BlogPostTag[]>();
  for (const tagRow of tagRows) {
    const existing = tagsByPostId.get(tagRow.postId) ?? [];
    existing.push({ post_tags: { name: tagRow.tagName } });
    tagsByPostId.set(tagRow.postId, existing);
  }

  return rows.map((row) => {
    const mapped = toPostDto(row.post);
    return {
      id: mapped.id,
      title: mapped.title,
      slug: mapped.slug,
      excerpt: mapped.excerpt,
      cover_image: mapped.coverImage,
      published_at: mapped.publishedAt,
      read_time_minutes: mapped.readTimeMinutes,
      author_id: mapped.authorId,
      author: row.authorDisplayName
        ? {
            display_name: row.authorDisplayName,
            avatar_url: row.authorAvatarUrl,
          }
        : null,
      tags: tagsByPostId.get(row.post.id) ?? [],
    };
  });
}
