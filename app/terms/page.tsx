'use client'

import { AlertTriangle, ArrowLeft, CheckCircle, FileText, Globe, Lock, Mail, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/ui/navbar'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

export default function TermsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setIsLoggedIn(true)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setIsLoggedIn(true)
      } else {
        setUser(null)
        setIsLoggedIn(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const sections = [
    { id: 'acceptance', title: 'Acceptance of Terms', icon: CheckCircle },
    { id: 'service', title: 'Description of Service', icon: Globe },
    { id: 'accounts', title: 'User Accounts', icon: Users },
    { id: 'content', title: 'Content & Conduct', icon: FileText },
    { id: 'community', title: 'Community Guidelines', icon: Users },
    { id: 'privacy', title: 'Privacy & Data', icon: Lock },
    { id: 'prohibited', title: 'Prohibited Uses', icon: AlertTriangle },
    { id: 'termination', title: 'Termination', icon: Shield },
  ]

  const scrollToSection = (sectionId: string) => {
    // Handle internal sections first
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // For homepage sections, redirect
    if (['projects', 'features', 'reviews', 'faq'].includes(sectionId)) {
      router.push(`/#${sectionId}`)
    }
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <div className="bg-background min-h-screen">
        <Navbar
          showNavigation={true}
          isLoggedIn={isLoggedIn}
          user={user}
          scrollToSection={scrollToSection}
        />

        <main className="pt-20 pb-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Shield className="text-primary h-8 w-8" />
                <h1 className="text-4xl font-bold">Terms and Conditions</h1>
              </div>
              <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                Syarat dan Ketentuan penggunaan platform VibeDev ID
              </p>
              <div className="mt-6 flex items-center justify-center gap-4">
                <Badge variant="outline">Effective: January 2025</Badge>
                <Badge variant="outline">Updated: September 2025</Badge>
              </div>
            </div>

            {/* Quick Navigation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {sections.map((section) => {
                    const IconComponent = section.icon
                    return (
                      <Button
                        key={section.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollToSection(section.id)}
                        className="hover:bg-accent/50 h-auto justify-start p-3"
                      >
                        <IconComponent className="mr-2 h-4 w-4" />
                        <span className="text-sm">{section.title}</span>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Terms Content */}
            <div className="space-y-8">
              {/* Section 1: Acceptance of Terms */}
              <Card id="acceptance">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    1. Acceptance of Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <p>
                    Welcome to VibeDev ID ("we," "our," or "us"). By accessing or using our platform at any domain
                    associated with VibeDev ID (the "Service"), you ("User" or "you") agree to be bound by these Terms
                    and Conditions ("Terms").
                  </p>
                  <p className="text-muted-foreground bg-accent/30 rounded-lg p-4 text-sm">
                    <strong>Important:</strong> If you do not agree to these Terms, please do not use our Service.
                  </p>
                </CardContent>
              </Card>

              {/* Section 2: Description of Service */}
              <Card id="service">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    2. Description of Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <p>
                    VibeDev ID is a community platform for Indonesian developers, AI enthusiasts, and tech innovators.
                    Our Service allows users to:
                  </p>
                  <ul className="grid list-none grid-cols-1 gap-2 md:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      Create developer profiles
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      Showcase projects and portfolios
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      Connect and collaborate
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      Participate in discussions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      Share knowledge and resources
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      Discover community projects
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Section 3: User Accounts */}
              <Card id="accounts">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    3. User Accounts and Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">Account Creation</h4>
                      <ul>
                        <li>Provide accurate, current information</li>
                        <li>Maintain confidentiality of credentials</li>
                        <li>Must be at least 13 years old</li>
                        <li>One account per person</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">Account Security</h4>
                      <ul>
                        <li>Responsible for all account activities</li>
                        <li>Report unauthorized use immediately</li>
                        <li>We may suspend violating accounts</li>
                        <li>Keep login credentials secure</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: Content & Conduct */}
              <Card id="content">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    4. User Content and Conduct
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-3 text-lg font-semibold text-green-600">✅ Allowed Content</h4>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Badge
                          variant="outline"
                          className="justify-center"
                        >
                          Project descriptions
                        </Badge>
                        <Badge
                          variant="outline"
                          className="justify-center"
                        >
                          Code snippets
                        </Badge>
                        <Badge
                          variant="outline"
                          className="justify-center"
                        >
                          Profile information
                        </Badge>
                        <Badge
                          variant="outline"
                          className="justify-center"
                        >
                          Community discussions
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="mb-3 text-lg font-semibold text-red-600">❌ Prohibited Content</h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {[
                          'Illegal or harmful content',
                          'Hate speech or harassment',
                          'Copyright infringement',
                          'Malicious code or viruses',
                          'Spam or fraudulent content',
                          'Adult or explicit material',
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded bg-red-50 p-2 dark:bg-red-900/20"
                          >
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 5: Community Guidelines */}
              <Card id="community">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    5. Community Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-blue-900/20 dark:to-purple-900/20">
                    <h4 className="mb-4 text-lg font-semibold">🤝 VibeDev Community Values</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                          <div>
                            <strong>Respectful Interaction</strong>
                            <p className="text-muted-foreground text-sm">
                              Treat all members with respect and professionalism
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                          <div>
                            <strong>Constructive Feedback</strong>
                            <p className="text-muted-foreground text-sm">Provide helpful and constructive criticism</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                          <div>
                            <strong>Inclusive Environment</strong>
                            <p className="text-muted-foreground text-sm">
                              Respect diverse backgrounds and skill levels
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                          <div>
                            <strong>Knowledge Sharing</strong>
                            <p className="text-muted-foreground text-sm">Share knowledge and help others learn</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 6: Privacy & Data */}
              <Card id="privacy">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-green-600" />
                    6. Privacy and Data Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Data Collection</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-600" />
                          Secure authentication via Supabase
                        </li>
                        <li className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-600" />
                          Profile data as per Privacy Policy
                        </li>
                        <li className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-600" />
                          Public visibility based on settings
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Data Security</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          Industry-standard security measures
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          User responsibility for account security
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          No absolute security guarantee
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 7: Prohibited Uses */}
              <Card id="prohibited">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    7. Prohibited Uses
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
                    <p className="mb-4 font-semibold text-red-800 dark:text-red-200">
                      ⚠️ You may not use our Service to:
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        'Violate laws or regulations',
                        'Impersonate others',
                        'Gain unauthorized system access',
                        'Interfere with service functionality',
                        'Harvest user information',
                        'Use automated access systems',
                        'Reverse engineer our platform',
                        'Distribute malicious content',
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2"
                        >
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 8: Termination */}
              <Card id="termination">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-600" />
                    8. Termination
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">By You</h4>
                      <p>
                        You may terminate your account at any time. Termination does not relieve you of obligations
                        incurred before termination.
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">By Us</h4>
                      <p>
                        We may terminate accounts for Terms violations, prohibited conduct, security risks, or extended
                        inactivity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal & Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Legal Information & Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">Governing Law</h4>
                      <p>
                        These Terms are governed by the laws of the Republic of Indonesia. Disputes should be resolved
                        through Indonesian courts.
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">Contact Us</h4>
                      <div className="space-y-2">
                        <Link
                          href="mailto:support@vibedev.id"
                          className="flex items-center gap-2 hover:underline"
                          target="_blank"
                        >
                          <Mail className="h-4 w-4" />
                          support@vibedev.id
                        </Link>
                        <Link
                          href="https://s.id/vibedev"
                          className="flex items-center gap-2 hover:underline"
                          target="_blank"
                        >
                          <Globe className="h-4 w-4" />
                          Contact Us
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Indonesian Summary */}
              <Card className="border-primary/20 from-primary/5 to-primary/10 bg-gradient-to-r">
                <CardHeader>
                  <CardTitle className="text-center">🇮🇩 Ringkasan Bahasa Indonesia</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="mb-4 text-lg">Dengan menggunakan platform VibeDev ID, Anda setuju untuk:</p>
                  <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Mengikuti pedoman komunitas yang sopan
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Tidak memposting konten yang melanggar
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Menghormati hak kekayaan intelektual
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Berkontribusi positif pada komunitas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final Agreement */}
              <Card className="border-primary border-2">
                <CardContent className="py-8 text-center">
                  <h3 className="mb-4 text-xl font-bold">
                    By using VibeDev ID, you acknowledge that you have read, understood, and agree to be bound by these
                    Terms and Conditions.
                  </h3>
                  <p className="text-muted-foreground">Last updated: September 2025 • Effective: January 2025</p>
                </CardContent>
              </Card>
            </div>

            {/* Back to Top */}
            <div className="mt-12 text-center">
              <Button
                variant="outline"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4 rotate-90" />
                Back to Top
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
