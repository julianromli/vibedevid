import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { toPostDto } from "@/lib/db/mappers";
import { blogPostTags, postTags, posts, users } from "@/lib/db/schema";

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
  const tagRows = await db
    .select({
      postId: blogPostTags.postId,
      tagName: postTags.name,
    })
    .from(blogPostTags)
    .innerJoin(postTags, eq(blogPostTags.tagId, postTags.id))
    .where(inArray(blogPostTags.postId, postIds));

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
