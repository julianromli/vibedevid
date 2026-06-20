import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { toUserProfile } from "@/lib/db/mappers";
import {
  blogPostTags,
  comments,
  likes,
  postTags,
  posts,
  projects,
  users,
  views,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/server/auth";

export interface ProfileUser {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  github_url: string | null;
  x_url: string | null;
  instagram_url: string | null;
  threads_url: string | null;
  twitter_url: string | null;
  joined_at: string;
  role?: number | null;
}

export interface UserProject {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  website_url: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  url: string | null;
  author_id: string;
  created_at: string;
  updated_at: string | null;
  likes: number;
  views_count: number;
  comments_count: number;
}

interface BlogPostTag {
  post_tags: { name: string } | null;
}

export interface UserBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  read_time_minutes: number | null;
  tags?: BlogPostTag[];
}

export interface ProfileAuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  username?: string;
  role?: number | null;
}

export interface ProfilePageData {
  user: ProfileUser | null;
  currentUser: ProfileAuthUser | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  projects: UserProject[];
  posts: UserBlogPost[];
  stats: { projects: number; posts: number; likes: number; views: number };
}

function getPrimaryProjectImage(
  imageUrls: unknown,
  imageUrl: string | null | undefined,
): string | null {
  if (Array.isArray(imageUrls)) {
    const firstImageUrl = imageUrls.find(
      (url): url is string => typeof url === "string" && url.trim().length > 0,
    );
    if (firstImageUrl) {
      return firstImageUrl;
    }
  }
  return imageUrl || null;
}

function tallyByProjectId(rows: { projectId: number | null }[]) {
  return rows.reduce<Record<number, number>>((acc, row) => {
    if (row.projectId != null) {
      acc[row.projectId] = (acc[row.projectId] || 0) + 1;
    }
    return acc;
  }, {});
}

async function fetchUserProjects(username: string): Promise<UserProject[]> {
  const db = getDb();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) return [];

  const projectRows = await db
    .select()
    .from(projects)
    .where(eq(projects.authorId, user.id))
    .orderBy(desc(projects.createdAt))
    .limit(10);

  if (projectRows.length === 0) return [];

  const projectIds = projectRows.map((project) => project.id);
  const [likesData, viewsData, commentsData] = await Promise.all([
    db
      .select({ projectId: likes.projectId })
      .from(likes)
      .where(inArray(likes.projectId, projectIds)),
    db
      .select({ projectId: views.projectId })
      .from(views)
      .where(inArray(views.projectId, projectIds)),
    db
      .select({ projectId: comments.projectId })
      .from(comments)
      .where(inArray(comments.projectId, projectIds)),
  ]);

  const likeCounts = tallyByProjectId(likesData);
  const viewCounts = tallyByProjectId(viewsData);
  const commentCounts = tallyByProjectId(commentsData);

  return projectRows.map((project) => {
    const primaryImage = getPrimaryProjectImage(project.imageUrls, project.imageUrl);
    return {
      id: String(project.id),
      slug: project.slug,
      title: project.title,
      description: project.description,
      category: project.category,
      website_url: project.websiteUrl,
      image_url: primaryImage,
      thumbnail_url: primaryImage,
      url: project.websiteUrl,
      author_id: project.authorId,
      created_at: project.createdAt?.toISOString() ?? "",
      updated_at: project.updatedAt?.toISOString() ?? null,
      likes: likeCounts[project.id] || 0,
      views_count: viewCounts[project.id] || 0,
      comments_count: commentCounts[project.id] || 0,
    };
  });
}

async function fetchUserProfileWithStats(username: string) {
  const db = getDb();

  const [userRow] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!userRow) {
    return { user: null as ProfileUser | null, stats: { projects: 0, likes: 0, views: 0 } };
  }

  const profile = toUserProfile(userRow);
  const user: ProfileUser = {
    id: profile.id,
    username: profile.username,
    display_name: profile.displayName,
    bio: profile.bio,
    avatar_url: profile.avatarUrl,
    location: profile.location,
    website: profile.website,
    github_url: profile.githubUrl,
    x_url: profile.xUrl,
    instagram_url: profile.instagramUrl,
    threads_url: profile.threadsUrl,
    twitter_url: profile.twitterUrl,
    joined_at: profile.joinedAt ?? "",
    role: profile.role,
  };

  const [projectCountResult, projectIdRows, postIdRows] = await Promise.all([
    db.select({ count: count() }).from(projects).where(eq(projects.authorId, user.id)),
    db.select({ id: projects.id }).from(projects).where(eq(projects.authorId, user.id)),
    db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), eq(posts.status, "published"))),
  ]);

  const projectCount = projectCountResult[0]?.count ?? 0;
  const projectIds = projectIdRows.map((row) => row.id);
  const postIds = postIdRows.map((row) => row.id);

  if (projectIds.length === 0 && postIds.length === 0) {
    return { user, stats: { projects: projectCount, likes: 0, views: 0 } };
  }

  const [likesResult, projectViewsResult, blogViewsResult] = await Promise.all([
    projectIds.length > 0
      ? db.select({ count: count() }).from(likes).where(inArray(likes.projectId, projectIds))
      : Promise.resolve([{ count: 0 }]),
    projectIds.length > 0
      ? db.select({ count: count() }).from(views).where(inArray(views.projectId, projectIds))
      : Promise.resolve([{ count: 0 }]),
    postIds.length > 0
      ? db.select({ count: count() }).from(views).where(inArray(views.postId, postIds))
      : Promise.resolve([{ count: 0 }]),
  ]);

  const totalViews = (projectViewsResult[0]?.count ?? 0) + (blogViewsResult[0]?.count ?? 0);

  return {
    user,
    stats: { projects: projectCount, likes: likesResult[0]?.count ?? 0, views: totalViews },
  };
}

async function fetchUserBlogPosts(userId: string): Promise<UserBlogPost[]> {
  const db = getDb();

  const postRows = await db
    .select()
    .from(posts)
    .where(
      and(eq(posts.authorId, userId), eq(posts.status, "published"), isNotNull(posts.publishedAt)),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(10);

  if (postRows.length === 0) return [];

  const postIds = postRows.map((post) => post.id);
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

  return postRows.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    cover_image: post.coverImage,
    published_at: post.publishedAt?.toISOString() ?? null,
    read_time_minutes: post.readTimeMinutes,
    tags: tagsByPostId.get(post.id) ?? [],
  }));
}

export async function loadProfilePageData(username: string): Promise<ProfilePageData> {
  const [currentUserResult, { user: profileUser, stats }] = await Promise.all([
    getCurrentUser(),
    fetchUserProfileWithStats(username),
  ]);

  const currentUser: ProfileAuthUser | null = currentUserResult
    ? {
        id: currentUserResult.id,
        name: currentUserResult.name,
        email: currentUserResult.email,
        avatar: currentUserResult.avatar,
        avatar_url: currentUserResult.avatar_url,
        username: currentUserResult.username,
        role: currentUserResult.role,
      }
    : null;

  const isOwner = currentUser?.username === username;

  if (!profileUser) {
    return {
      user: null,
      currentUser,
      isLoggedIn: !!currentUserResult,
      isOwner: false,
      projects: [],
      posts: [],
      stats: { projects: 0, posts: 0, likes: 0, views: 0 },
    };
  }

  const [projectsData, postsData] = await Promise.all([
    fetchUserProjects(username),
    fetchUserBlogPosts(profileUser.id),
  ]);

  return {
    user: profileUser,
    currentUser,
    isLoggedIn: !!currentUserResult,
    isOwner,
    projects: projectsData,
    posts: postsData,
    stats: { ...stats, posts: postsData.length },
  };
}
