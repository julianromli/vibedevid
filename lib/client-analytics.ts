/**
 * Client-side analytics utilities for unique visitor tracking
 * Handles session management and view tracking
 */

export interface ViewSession {
  id: string
  createdAt: string
  lastActivity: string
}

export interface ViewAnalytics {
  totalViews: number
  uniqueViews: number
  todayViews: number
  weeklyViews: number
}

/**
 * Generate a unique session ID for visitor tracking
 */
export function generateSessionId(): string {
  // Use crypto.randomUUID if available, fallback to manual generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback: Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Get or create a session ID for the current visitor
 * Sessions expire after 30 minutes of inactivity
 */
export function getOrCreateSession(): ViewSession {
  const SESSION_KEY = 'vibedev_session'
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
  
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      const session: ViewSession = JSON.parse(stored)
      const now = new Date()
      const lastActivity = new Date(session.lastActivity)
      
      // Check if session is still valid (within timeout)
      if (now.getTime() - lastActivity.getTime() < SESSION_TIMEOUT) {
        // Update last activity and return existing session
        session.lastActivity = now.toISOString()
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        return session
      }
    }
  } catch (error) {
    console.warn('Failed to parse stored session:', error)
  }
  
  // Create new session
  const newSession: ViewSession = {
    id: generateSessionId(),
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  }
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
  } catch (error) {
    console.warn('Failed to store session:', error)
  }
  
  return newSession
}

/**
 * Track a project view with session-based analytics
 * Returns true if this is a new unique view, false if already viewed in this session
 */
export function shouldTrackView(projectId: string): boolean {
  const VIEWED_PROJECTS_KEY = 'vibedev_viewed_projects'
  const session = getOrCreateSession()
  
  try {
    const stored = localStorage.getItem(VIEWED_PROJECTS_KEY)
    const viewedProjects: Record<string, string[]> = stored ? JSON.parse(stored) : {}
    
    // Get projects viewed in current session
    const sessionViews = viewedProjects[session.id] || []
    
    // Check if project already viewed in this session
    if (sessionViews.includes(projectId)) {
      return false // Already viewed in this session
    }
    
    // Add project to session views
    viewedProjects[session.id] = [...sessionViews, projectId]
    
    // Clean up old sessions (keep only current and previous session)
    const sessionKeys = Object.keys(viewedProjects)
    if (sessionKeys.length > 2) {
      sessionKeys.forEach(key => {
        if (key !== session.id) {
          delete viewedProjects[key]
        }
      })
    }
    
    localStorage.setItem(VIEWED_PROJECTS_KEY, JSON.stringify(viewedProjects))
    return true // New unique view
  } catch (error) {
    console.warn('Failed to track view:', error)
    return true // Default to tracking if there's an error
  }
}

/**
 * Get current session ID for server-side tracking
 */
export function getCurrentSessionId(): string {
  const session = getOrCreateSession()
  return session.id
}

/**
 * Clear session data (useful for testing or logout)
 */
export function clearSession(): void {
  try {
    localStorage.removeItem('vibedev_session')
    localStorage.removeItem('vibedev_viewed_projects')
  } catch (error) {
    console.warn('Failed to clear session:', error)
  }
}

/**
 * Get analytics-friendly date string (YYYY-MM-DD)
 */
export function getAnalyticsDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

/**
 * Check if we should track this view based on user agent
 * Skip bots and crawlers
 */
export function isValidUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'facebookexternalhit', 'twitterbot', 'whatsapp'
  ]
  
  return !botPatterns.some(pattern => userAgent.includes(pattern))
}
