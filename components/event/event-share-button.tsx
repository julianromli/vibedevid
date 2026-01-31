'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface EventShareButtonProps {
  eventTitle: string
  eventSlug: string
}

export function EventShareButton({ eventTitle, eventSlug }: EventShareButtonProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/event/${eventSlug}`

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!', {
        description: 'Share this event with your friends',
      })
    } catch (error) {
      toast.error('Failed to copy link', {
        description: 'Please try again',
      })
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className="w-full gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share Event
    </Button>
  )
}
