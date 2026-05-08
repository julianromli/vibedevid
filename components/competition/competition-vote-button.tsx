'use client'

import { Heart, Loader2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleCompetitionVote } from '@/lib/actions/competition'

interface CompetitionVoteButtonProps {
  entryId: string
  initialVoteCount: number
  initialHasVoted: boolean
  isLoggedIn: boolean
  isOwner: boolean
  isCompetitionOpen: boolean
}

export function CompetitionVoteButton({
  entryId,
  initialVoteCount,
  initialHasVoted,
  isLoggedIn,
  isOwner,
  isCompetitionOpen,
}: CompetitionVoteButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [voteCount, setVoteCount] = useState(initialVoteCount)

  const disabled = isPending || isOwner || !isCompetitionOpen

  return (
    <Button
      type="button"
      variant={hasVoted ? 'default' : 'outline'}
      disabled={disabled}
      onClick={() => {
        if (!isLoggedIn) {
          router.push(`/user/auth?redirectTo=${encodeURIComponent(pathname)}`)
          return
        }

        startTransition(async () => {
          const previousHasVoted = hasVoted
          const previousVoteCount = voteCount
          const optimisticHasVoted = !previousHasVoted
          const optimisticVoteCount = optimisticHasVoted ? previousVoteCount + 1 : Math.max(previousVoteCount - 1, 0)

          setHasVoted(optimisticHasVoted)
          setVoteCount(optimisticVoteCount)

          const result = await toggleCompetitionVote(entryId)

          if (!result.success) {
            setHasVoted(previousHasVoted)
            setVoteCount(previousVoteCount)
            toast.error(result.error ?? 'Gagal memperbarui vote')
            return
          }

          setHasVoted(Boolean(result.hasVoted))
          setVoteCount(result.voteCount ?? optimisticVoteCount)
        })
      }}
      className="gap-2"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
      <span>{voteCount}</span>
    </Button>
  )
}
