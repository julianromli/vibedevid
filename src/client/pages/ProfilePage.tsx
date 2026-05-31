'use client'
import { useParams } from 'react-router-dom'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">@{username}</h1>
        <p className="mt-2 text-muted-foreground">Profile page loads via API in follow-up; username route is active.</p>
      </main>
      <Footer />
    </div>
  )
}
