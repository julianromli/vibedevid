import { Navbar } from '@/components/ui/navbar'

export function PageLoadingShell() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

        <Navbar showNavigation={true} />

        <div className="flex min-h-[50vh] items-center justify-center pt-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    </div>
  )
}
