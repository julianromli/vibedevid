import type { AIEvent } from "@/types/events";

export interface UserProfileDto {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  website: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  xUrl: string | null;
  instagramUrl: string | null;
  threadsUrl: string | null;
  role: number;
  isSuspended: boolean;
  joinedAt: string | null;
  updatedAt: string | null;
}

export interface ProjectDto {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  websiteUrl: string | null;
  imageUrl: string | null;
  imageUrls: string[] | null;
  imageKeys: string[] | null;
  tags: string[];
  tagline: string | null;
  faviconUrl: string | null;
  authorId: string;
  featured: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PostDto {
  id: string;
  title: string;
  slug: string;
  content: unknown;
  excerpt: string | null;
  coverImage: string | null;
  authorId: string;
  status: string;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  readTimeMinutes: number | null;
  viewCount: number | null;
  featured: boolean | null;
}

export interface CategoryDto {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type EventDto = AIEvent & {
  approved: boolean;
  submittedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
