'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Navigate } from 'react-router-dom'
import { PageLoadingShell } from '@/src/client/components/PageLoadingShell'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { SubmitProjectForm } from '@/components/ui/submit-project-form'
import { useAuth } from '@/hooks/useAuth'
import type { Category } from '@/lib/categories'

async function fetchSubmitContext() {
  const res = await fetch('/api/pages/project-submit', { credentials: 'include' })
  if (res.status === 401) return { unauthorized: true as const }
  if (!res.ok) throw new Error('Failed to load submit page')
  return res.json() as Promise<{ userId: string; categories: Category[] }>
}

export default function ProjectSubmitPage() {
  const t = useTranslations('projectSubmit')
  const { isLoggedIn, user } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['project-submit'], queryFn: fetchSubmitContext })

  if (isLoading) {
    return <PageLoadingShell />
  }

  if (!data || 'unauthorized' in data) {
    return (
      <Navigate
        to="/user/auth?redirectTo=/project/submit"
        replace
      />
    )
  }

  return (
    <div className="relative min-h-screen bg-grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

      <Navbar
        showNavigation={true}
        isLoggedIn={isLoggedIn}
        user={user ?? undefined}
      />

      <div className="container relative mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-3xl">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <SubmitProjectForm
            userId={data.userId}
            categories={data.categories}
            redirectTo="/project/submit"
          />
        </div>
      </div>

      <Footer />
    </div>
  )
}
