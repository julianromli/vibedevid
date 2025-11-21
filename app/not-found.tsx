'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Compass, Home } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function NotFound() {
  const auth = useAuth()

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar
        showNavigation={true}
        isLoggedIn={auth.isLoggedIn}
        user={auth.user ?? undefined}
      />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="flex w-full items-center justify-center py-20">
            <div className="flex items-center border-x border-border relative">
                <div className="p-10 md:p-20 relative">
                    <div className="absolute inset-x-0 top-0 h-px bg-border" />
                    <Empty className="border-none p-0 md:p-0">
                        <EmptyHeader>
                            <EmptyTitle className="font-black font-mono text-8xl md:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground/50">
                                404
                            </EmptyTitle>
                            <EmptyDescription className="text-lg text-nowrap mt-4">
                                Halaman yang lo cari mungkin udah <br />
                                dipindah atau nggak ada, bro.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent className="mt-8">
                            <div className="flex gap-4">
                                <Button asChild size="lg">
                                    <Link href="/">
                                        <Home className="mr-2 h-4 w-4" /> Balik Home
                                    </Link>
                                </Button>

                                <Button asChild variant="outline" size="lg">
                                    <Link href="/project/list">
                                        <Compass className="mr-2 h-4 w-4" /> Explore Project
                                    </Link>
                                </Button>
                            </div>
                        </EmptyContent>
                    </Empty>
                    <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
                </div>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
