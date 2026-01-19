'use client'

import { Compass, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center">
        <div className="flex w-full items-center justify-center py-20">
          <div className="border-border relative flex items-center border-x">
            <div className="relative p-10 md:p-20">
              <div className="bg-border absolute inset-x-0 top-0 h-px" />
              <Empty className="border-none p-0 md:p-0">
                <EmptyHeader>
                  <EmptyTitle className="from-foreground to-muted-foreground/50 bg-gradient-to-b bg-clip-text font-mono text-8xl font-black text-transparent md:text-9xl">
                    404
                  </EmptyTitle>
                  <EmptyDescription className="mt-4 text-lg text-nowrap">Page not found</EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="mt-8">
                  <div className="flex gap-4">
                    <Button
                      asChild
                      size="lg"
                    >
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" /> Home
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                    >
                      <Link href="/project/list">
                        <Compass className="mr-2 h-4 w-4" /> Explore Projects
                      </Link>
                    </Button>
                  </div>
                </EmptyContent>
              </Empty>
              <div className="bg-border absolute inset-x-0 bottom-0 h-px" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
