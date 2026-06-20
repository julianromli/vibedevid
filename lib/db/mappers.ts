import type { users, projects, posts, categories, events } from "@/lib/db/schema";
import type { CategoryDto, EventDto, PostDto, ProjectDto, UserProfileDto } from "@/types/domain";
import type { EventCategory, EventLocationType, EventStatus } from "@/types/events";

type UserRow = typeof users.$inferSelect;
type ProjectRow = typeof projects.$inferSelect;
type PostRow = typeof posts.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;
type EventRow = typeof events.$inferSelect;

const toIso = (value: Date | null | undefined) => value?.toISOString() ?? null;

export function toUserProfile(row: UserRow): UserProfileDto {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    location: row.location,
    website: row.website,
    githubUrl: row.githubUrl,
    twitterUrl: row.twitterUrl,
    xUrl: row.xUrl,
    instagramUrl: row.instagramUrl,
    threadsUrl: row.threadsUrl,
    role: row.role,
    isSuspended: row.isSuspended ?? false,
    joinedAt: toIso(row.joinedAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toProjectDto(row: ProjectRow): ProjectDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    websiteUrl: row.websiteUrl,
    imageUrl: row.imageUrl,
    imageUrls: row.imageUrls,
    imageKeys: row.imageKeys,
    tags: row.tags,
    tagline: row.tagline,
    faviconUrl: row.faviconUrl,
    authorId: row.authorId,
    featured: row.featured ?? false,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toPostDto(row: PostRow): PostDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    authorId: row.authorId,
    status: row.status,
    publishedAt: toIso(row.publishedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    readTimeMinutes: row.readTimeMinutes,
    viewCount: row.viewCount,
    featured: row.featured,
  };
}

export function toCategoryDto(row: CategoryRow): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName,
    description: row.description,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toEventDto(row: EventRow): EventDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    date: row.date,
    time: row.time,
    endDate: row.endDate ?? undefined,
    endTime: row.endTime ?? undefined,
    locationType: row.locationType as EventLocationType,
    locationDetail: row.locationDetail,
    organizer: row.organizer,
    registrationUrl: row.registrationUrl,
    coverImage: row.coverImage,
    category: row.category as EventCategory,
    status: row.status as EventStatus,
    approved: row.approved,
    submittedBy: row.submittedBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}
