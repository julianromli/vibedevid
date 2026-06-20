import { revalidatePath } from "@/lib/revalidation";
import { getDb } from "@/lib/db";
import { posts, users, postTags, blogPostTags, comments, likes, views } from "@/lib/db/schema";
import { toPostDto } from "@/lib/db/mappers";
import { requireUser } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/auth/permissions";
import { eq, and, gte, lte, desc, count, or, ilike, inArray } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;

export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  content: object;
  excerpt: string | null;
  cover_image: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  view_count: number;
  read_time_minutes: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  tags: string[];
}

export interface GetAllPostsResult {
  posts: AdminPost[];
  totalCount: number;
  error?: string;
}

export interface PostFilters {
  status?: "all" | "draft" | "published" | "archived";
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  featured?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

async function checkAdminAccess() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return user;
}

function sanitizeSearchInput(search: string): string {
  return search.replace(/[%_]/g, "\\$&");
}

export async function getAllPosts(
  filters: PostFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetAllPostsResult> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const conditions = [];

    if (filters.status && filters.status !== "all") {
      conditions.push(eq(posts.status, filters.status));
    }
    if (filters.authorId) {
      conditions.push(eq(posts.authorId, filters.authorId));
    }
    if (filters.featured !== undefined) {
      conditions.push(eq(posts.featured, filters.featured));
    }
    if (filters.dateFrom) {
      conditions.push(gte(posts.createdAt, new Date(filters.dateFrom)));
    }
    if (filters.dateTo) {
      conditions.push(lte(posts.createdAt, new Date(filters.dateTo)));
    }
    if (filters.search) {
      const sanitized = sanitizeSearchInput(filters.search);
      const pattern = `%${sanitized}%`;
      conditions.push(or(ilike(posts.title, pattern), ilike(posts.excerpt, pattern)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [totalResult, postRows] = await Promise.all([
      db.select({ value: count() }).from(posts).where(whereClause),
      db
        .select({
          post: posts,
          authorUsername: users.username,
          authorDisplayName: users.displayName,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(posts.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const postIds = postRows.map((row) => row.post.id);

    const tagRows =
      postIds.length > 0
        ? await db
            .select({ postId: blogPostTags.postId, tagName: postTags.name })
            .from(blogPostTags)
            .innerJoin(postTags, eq(blogPostTags.tagId, postTags.id))
            .where(inArray(blogPostTags.postId, postIds))
        : [];

    const tagsByPost = new Map<string, string[]>();
    tagRows.forEach((row) => {
      const existing = tagsByPost.get(row.postId) || [];
      if (row.tagName) existing.push(row.tagName);
      tagsByPost.set(row.postId, existing);
    });

    const formattedPosts: AdminPost[] = postRows.map((row) => {
      const mapped = toPostDto(row.post);
      return {
        id: mapped.id,
        slug: mapped.slug,
        title: mapped.title,
        content: mapped.content as object,
        excerpt: mapped.excerpt,
        cover_image: mapped.coverImage,
        status: mapped.status as AdminPost["status"],
        featured: mapped.featured || false,
        view_count: mapped.viewCount || 0,
        read_time_minutes: mapped.readTimeMinutes,
        published_at: mapped.publishedAt,
        created_at: mapped.createdAt ?? "",
        updated_at: mapped.updatedAt ?? "",
        author_id: mapped.authorId,
        author: {
          username: row.authorUsername || "unknown",
          display_name: row.authorDisplayName || "Unknown",
          avatar_url: row.authorAvatarUrl,
        },
        tags: tagsByPost.get(mapped.id) || [],
      };
    });

    return {
      posts: formattedPosts,
      totalCount: totalResult[0]?.value || 0,
    };
  } catch (error) {
    console.error("Get all posts error:", error);
    return {
      posts: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : "Failed to load posts",
    };
  }
}

export async function adminUpdatePost(
  postId: string,
  updates: Partial<AdminPost>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const updateData: {
      title?: string;
      excerpt?: string | null;
      coverImage?: string | null;
      status?: string;
      featured?: boolean;
      readTimeMinutes?: number | null;
      content?: object;
      publishedAt?: Date;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
    if (updates.cover_image !== undefined) updateData.coverImage = updates.cover_image;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.featured !== undefined) updateData.featured = updates.featured;
    if (updates.read_time_minutes !== undefined)
      updateData.readTimeMinutes = updates.read_time_minutes;
    if (updates.content !== undefined) updateData.content = updates.content;

    if (updates.status === "published") {
      const [currentPost] = await db
        .select({ publishedAt: posts.publishedAt })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!currentPost?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updatedRows = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, postId))
      .returning({ id: posts.id });

    if (!updatedRows.length) {
      return { success: false, error: "Post not found or no changes applied" };
    }

    if (updates.tags !== undefined) {
      await updatePostTags(postId, updates.tags);
    }

    revalidatePath("/blog/[slug]");
    revalidatePath("/blog");
    revalidatePath("/admin/dashboard/boards/blog");

    return { success: true };
  } catch (error) {
    console.error("Admin update post error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post",
    };
  }
}

async function updatePostTags(postId: string, tagNames: string[]) {
  const db = getDb();

  await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));

  if (tagNames.length === 0) return;

  const tagIds: string[] = [];

  for (const tagName of tagNames) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const [existingTag] = await db
      .select({ id: postTags.id })
      .from(postTags)
      .where(eq(postTags.slug, slug))
      .limit(1);

    if (existingTag) {
      tagIds.push(existingTag.id);
    } else {
      const [newTag] = await db
        .insert(postTags)
        .values({ name: tagName, slug })
        .returning({ id: postTags.id });

      if (newTag) {
        tagIds.push(newTag.id);
      }
    }
  }

  if (tagIds.length > 0) {
    await db.insert(blogPostTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}

export async function adminDeletePost(
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const deletedRows = await db
      .delete(posts)
      .where(eq(posts.id, postId))
      .returning({ id: posts.id });

    if (!deletedRows.length) {
      return { success: false, error: "Post could not be deleted" };
    }

    await Promise.all([
      db.delete(comments).where(eq(comments.postId, postId)),
      db.delete(likes).where(eq(likes.postId, postId)),
      db.delete(views).where(eq(views.postId, postId)),
      db.delete(blogPostTags).where(eq(blogPostTags.postId, postId)),
    ]);

    revalidatePath("/blog");
    revalidatePath("/admin/dashboard/boards/blog");

    return { success: true };
  } catch (error) {
    console.error("Admin delete post error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
}

export async function togglePostFeatured(
  postId: string,
  featured: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const updatedRows = await db
      .update(posts)
      .set({ featured, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning({ id: posts.id });

    if (!updatedRows.length) {
      return { success: false, error: "Post not found" };
    }

    revalidatePath("/blog");
    revalidatePath("/admin/dashboard/boards/blog");

    return { success: true };
  } catch (error) {
    console.error("Toggle post featured error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle featured status",
    };
  }
}

export async function getAllTags(): Promise<{ tags: Tag[]; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const tagRows = await db.select().from(postTags).orderBy(postTags.name);

    return {
      tags: tagRows.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        created_at: tag.createdAt?.toISOString() ?? "",
      })),
    };
  } catch (error) {
    return {
      tags: [],
      error: error instanceof Error ? error.message : "Failed to load tags",
    };
  }
}

export async function createTag(
  name: string,
): Promise<{ success: boolean; tag?: Tag; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      const [tag] = await db.insert(postTags).values({ name, slug }).returning();

      if (!tag) {
        return { success: false, error: "Failed to create tag" };
      }

      return {
        success: true,
        tag: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          created_at: tag.createdAt?.toISOString() ?? "",
        },
      };
    } catch (error) {
      const pgError = error as { code?: string; message?: string };
      if (pgError.code === "23505") {
        return { success: false, error: "Tag already exists" };
      }
      return { success: false, error: pgError.message || "Failed to create tag" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tag",
    };
  }
}

export async function deleteTag(tagId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();

    await db.delete(blogPostTags).where(eq(blogPostTags.tagId, tagId));

    const deletedRows = await db
      .delete(postTags)
      .where(eq(postTags.id, tagId))
      .returning({ id: postTags.id });

    if (!deletedRows.length) {
      return { success: false, error: "Tag not found" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete tag",
    };
  }
}
