import { revalidatePath, revalidateTag } from "@/lib/revalidation";
import { slugifyTitle } from "@/lib/slug";
import { getDb } from "@/lib/db";
import { posts, postTags, blogPostTags, users } from "@/lib/db/schema";
import { toPostDto } from "@/lib/db/mappers";
import { USER_ROLE } from "@/lib/auth/permissions";
import { getServerSession } from "@/lib/server/auth";
import { eq, and, desc, ilike, like, count } from "drizzle-orm";

function normalizeEditorContent(content: unknown): Record<string, unknown> {
  if (!content) return { type: "doc", content: [] };

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { type: "doc", content: [] };
    }
  }

  if (typeof content === "object") {
    return content as Record<string, unknown>;
  }

  return { type: "doc", content: [] };
}

export async function createBlogPost(data: {
  title: string;
  content: Record<string, unknown> | string;
  excerpt?: string;
  cover_image?: string;
  status?: "published" | "draft";
  tags?: string[];
}) {
  const session = await getServerSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!data.title || data.title.length < 5) {
    return { success: false, error: "Title must be at least 5 characters" };
  }

  const normalizedContent = normalizeEditorContent(data.content);

  const minLength = data.status === "draft" ? 10 : 100;
  const contentStr = JSON.stringify(normalizedContent);
  if (!normalizedContent || contentStr.length < minLength) {
    return { success: false, error: "Content is too short" };
  }

  const db = getDb();
  const baseSlug = slugifyTitle(data.title);
  const existing = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(like(posts.slug, `${baseSlug}%`));

  let slug = baseSlug;
  if (existing.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const readTime = Math.ceil(contentStr.split(" ").length / 200);

  console.log("[createBlogPost] Content to save:", JSON.stringify(normalizedContent, null, 2));

  try {
    const [post] = await db
      .insert(posts)
      .values({
        title: data.title,
        slug,
        content: normalizedContent,
        excerpt: data.excerpt,
        coverImage: data.cover_image,
        authorId: session.user.id,
        readTimeMinutes: readTime,
        status: data.status || "published",
        publishedAt: data.status === "published" ? new Date() : null,
      })
      .returning({ id: posts.id, slug: posts.slug });

    if (!post) {
      return { success: false, error: "Failed to create post" };
    }

    if (data.tags && data.tags.length > 0) {
      await syncPostTags(post.id, data.tags);
    }

    revalidatePath("/blog");
    revalidatePath("/dashboard/posts");
    revalidateTag("blog-list-posts", "max");
    return { success: true, slug };
  } catch (error) {
    console.error("Create post error:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function updateBlogPost(
  id: string,
  data: Partial<{
    title: string;
    content: Record<string, unknown> | string;
    excerpt: string;
    cover_image: string;
    status: "published" | "draft" | "archived";
    tags: string[];
  }>,
) {
  const session = await getServerSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const db = getDb();
  const [post] = await db
    .select({ authorId: posts.authorId, status: posts.status, slug: posts.slug })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  if (post.authorId !== session.user.id) {
    return { success: false, error: "Not authorized" };
  }

  const { tags, ...updateDataRaw } = data;
  const updateData: {
    title?: string;
    slug?: string;
    content?: Record<string, unknown>;
    excerpt?: string;
    coverImage?: string;
    status?: string;
    readTimeMinutes?: number;
    publishedAt?: Date;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (updateDataRaw.title) {
    updateData.title = updateDataRaw.title;
    updateData.slug = slugifyTitle(updateDataRaw.title);
  }

  if (data.excerpt !== undefined) {
    updateData.excerpt = data.excerpt;
  }

  if (data.cover_image !== undefined) {
    updateData.coverImage = data.cover_image;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (typeof data.content !== "undefined") {
    const normalizedContent = normalizeEditorContent(data.content);
    updateData.content = normalizedContent;
    updateData.readTimeMinutes = Math.ceil(
      JSON.stringify(normalizedContent).split(" ").length / 200,
    );
  }

  if (data.status === "published" && post.status !== "published") {
    updateData.publishedAt = new Date();
  }

  try {
    await db.update(posts).set(updateData).where(eq(posts.id, id));
  } catch (error) {
    console.error("Update post error:", error);
    return { success: false, error: "Failed to update post" };
  }

  if (tags) {
    await syncPostTags(id, tags);
  }

  const finalSlug = updateData.slug || post.slug;

  revalidatePath("/blog");
  revalidatePath(`/blog/${finalSlug}`);
  revalidatePath("/dashboard/posts");
  revalidateTag("blog-list-posts", "max");
  return { success: true, slug: finalSlug };
}

async function syncPostTags(postId: string, tagNames: string[]) {
  const db = getDb();
  const tagIds: string[] = [];

  for (const name of tagNames) {
    const slug = slugifyTitle(name);
    const [tag] = await db
      .insert(postTags)
      .values({ name, slug })
      .onConflictDoUpdate({ target: postTags.slug, set: { name } })
      .returning({ id: postTags.id });

    if (tag) tagIds.push(tag.id);
  }

  await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));

  if (tagIds.length > 0) {
    await db.insert(blogPostTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}

export async function getTags(query = "") {
  const db = getDb();

  const rows = query
    ? await db
        .select({ id: postTags.id, name: postTags.name, slug: postTags.slug })
        .from(postTags)
        .where(ilike(postTags.name, `%${query}%`))
        .limit(20)
    : await db
        .select({ id: postTags.id, name: postTags.name, slug: postTags.slug })
        .from(postTags)
        .limit(20);

  return rows;
}

export async function getAuthorPosts(
  page = 1,
  status: "published" | "draft" | "archived" | "all" = "all",
) {
  const session = await getServerSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized", data: [], total: 0 };
  }

  const db = getDb();
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const whereClause =
    status === "all"
      ? eq(posts.authorId, session.user.id)
      : and(eq(posts.authorId, session.user.id), eq(posts.status, status));

  const [{ value: totalPosts }] = await db
    .select({ value: count() })
    .from(posts)
    .where(whereClause);

  const data = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      createdAt: posts.createdAt,
      publishedAt: posts.publishedAt,
      viewCount: posts.viewCount,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
    })
    .from(posts)
    .where(whereClause)
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    success: true,
    data: data.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status as "draft" | "published" | "archived",
      created_at: row.createdAt?.toISOString() ?? "",
      published_at: row.publishedAt?.toISOString() ?? null,
      view_count: row.viewCount ?? 0,
      excerpt: row.excerpt ?? undefined,
      cover_image: row.coverImage ?? undefined,
    })),
    total: totalPosts,
  };
}

export async function getPostForEdit(slug: string) {
  const session = await getServerSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const db = getDb();
  const [postRow] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);

  if (!postRow) {
    return { success: false, error: "Post not found" };
  }

  if (postRow.authorId !== session.user.id) {
    return { success: false, error: "Not authorized" };
  }

  const tagRows = await db
    .select({ name: postTags.name })
    .from(blogPostTags)
    .innerJoin(postTags, eq(blogPostTags.tagId, postTags.id))
    .where(eq(blogPostTags.postId, postRow.id));

  const post = toPostDto(postRow);
  const tags = tagRows.map((t) => t.name).filter(Boolean);

  return {
    success: true,
    data: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content as object,
      excerpt: post.excerpt,
      cover_image: post.coverImage,
      author_id: post.authorId,
      status: post.status,
      published_at: post.publishedAt,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      read_time_minutes: post.readTimeMinutes,
      view_count: post.viewCount,
      featured: post.featured,
      tags,
    },
  };
}

export async function deleteBlogPost(id: string) {
  const session = await getServerSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const db = getDb();
  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  const [profile] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const isAuthor = post.authorId === session.user.id;
  const isAdmin = profile?.role === USER_ROLE.ADMIN;

  if (!isAuthor && !isAdmin) {
    return { success: false, error: "Not authorized" };
  }

  try {
    await db.delete(posts).where(eq(posts.id, id));
  } catch (error) {
    console.error("Delete post error:", error);
    return { success: false, error: "Failed to delete post" };
  }

  revalidatePath("/blog");
  revalidateTag("blog-list-posts", "max");
  return { success: true };
}
