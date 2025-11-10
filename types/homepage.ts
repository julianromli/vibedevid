/**
 * Type definitions for Homepage components
 */

export interface User {
  id?: string
  name: string
  email: string
  avatar?: string
  avatar_url?: string
  username?: string
}

export interface Project {
  id: string
  slug: string
  title: string
  description?: string
  image: string | null
  category: string
  author: {
    name: string
    username: string
    avatar: string
  }
  likes: number
  views: number
  url?: string
  createdAt: string
}

export interface Testimonial {
  text: string
  image: string
  name: string
  role: string
}

export interface Framework {
  id: number
  name: string
  designation: string
  image: string
}

export interface FAQ {
  question: string
  answer: string
}

export interface AuthState {
  isLoggedIn: boolean
  user: User | null
  authReady: boolean
  loading: boolean
}

export interface ProjectFilters {
  selectedFilter: string
  selectedTrending: string
  visibleProjects: number
  filterOptions: string[]
}

export type SortBy = 'trending' | 'top' | 'newest'
