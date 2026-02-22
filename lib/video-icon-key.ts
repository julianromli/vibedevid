import type { VideoIconKey } from '@/types/homepage'

export function getVideoIconKey(title: string, description: string): VideoIconKey {
  const content = `${title} ${description}`.toLowerCase()

  if (content.includes('live') || content.includes('coding') || content.includes('session')) {
    return 'play'
  }

  if (content.includes('talk') || content.includes('diskusi') || content.includes('discussion')) {
    return 'users'
  }

  if (content.includes('workshop') || content.includes('tutorial') || content.includes('server')) {
    return 'code'
  }

  if (content.includes('challenge') || content.includes('algorithm')) {
    return 'video'
  }

  return 'code'
}
