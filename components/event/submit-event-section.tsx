'use client'

import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { SubmitEventModal } from '@/components/event/submit-event-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/types/homepage'

interface SubmitEventSectionProps {
  isLoggedIn: boolean
  user: User | null
}

export function SubmitEventSection({ isLoggedIn, user }: SubmitEventSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)

  // Determine auth ready state - if we have props passed down, we consider auth "ready"
  // For the purpose of this section, we just rely on the passed props
  const authReady = true

  const handleSubmitClick = () => {
    if (!isLoggedIn || !user?.id) {
      return
    }
    setModalOpen(true)
  }

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h2 className="mb-4 font-bold text-3xl">Punya Event AI?</h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Bagikan event AI kamu dengan komunitas! Submit event kamu dan jangkau lebih banyak peserta.
          </p>

          {!authReady ? (
            // Loading state - shouldn't really be hit now as we assume ready from props
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-11 w-40" />
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking login status...</span>
              </div>
            </div>
          ) : isLoggedIn && user?.id ? (
            <>
              <Button
                size="lg"
                onClick={handleSubmitClick}
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Submit Event
              </Button>

              <SubmitEventModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                userId={user.id}
              />
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">Silakan login terlebih dahulu untuk submit event</p>
              <Button
                size="lg"
                asChild
              >
                <Link href="/user/auth">Login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
