'use client'

import { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

export function Footer() {
  const [isPrivacyDrawerOpen, setIsPrivacyDrawerOpen] = useState(false)

  return (
    <footer className="bg-muted/50 border-border relative border-t py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="text-muted-foreground mb-4 text-sm md:mb-0">
            © 2025 VibeDev ID - Komunitas vibe coding Indonesia terbesar untuk
            developer masa depan.
          </div>
          <div className="flex space-x-6 text-sm">
            <Drawer
              open={isPrivacyDrawerOpen}
              onOpenChange={setIsPrivacyDrawerOpen}
            >
              <DrawerTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-4xl">
                  <DrawerHeader>
                    <DrawerTitle>Privacy Policy</DrawerTitle>
                    <DrawerDescription>
                      Last updated: August 2025
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground hover:scrollbar-thumb-foreground scrollbar-thumb-rounded-full scrollbar-track-rounded-full max-h-[60vh] overflow-y-auto p-4 pb-0">
                    <div className="space-y-6 text-sm">
                      <section>
                        <h3 className="mb-2 text-base font-semibold">
                          1. Information We Collect
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          At VibeDev ID, we collect information you provide
                          directly to us, such as when you create an account,
                          participate in community discussions, or contact us
                          for support.
                        </p>
                        <ul className="text-muted-foreground ml-4 list-inside list-disc space-y-1">
                          <li>
                            Account information (username, email address,
                            profile details)
                          </li>
                          <li>
                            Community contributions (posts, comments, project
                            submissions)
                          </li>
                          <li>
                            Communication data when you contact our support team
                          </li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="mb-2 text-base font-semibold">
                          2. How We Use Your Information
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          We use the information we collect to provide,
                          maintain, and improve our community platform:
                        </p>
                        <ul className="text-muted-foreground ml-4 list-inside list-disc space-y-1">
                          <li>
                            Facilitate community interactions and project
                            collaborations
                          </li>
                          <li>
                            Send important updates about platform changes or
                            community events
                          </li>
                          <li>
                            Provide customer support and respond to your
                            inquiries
                          </li>
                          <li>
                            Improve our services based on usage patterns and
                            feedback
                          </li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="mb-2 text-base font-semibold">
                          3. Information Sharing
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          We do not sell, trade, or otherwise transfer your
                          personal information to third parties without your
                          consent, except in the following circumstances:
                        </p>
                        <ul className="text-muted-foreground ml-4 list-inside list-disc space-y-1">
                          <li>
                            With your explicit consent for specific integrations
                            or features
                          </li>
                          <li>
                            To comply with legal obligations or protect our
                            rights
                          </li>
                          <li>
                            With trusted service providers who assist in
                            operating our platform
                          </li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="mb-2 text-base font-semibold">
                          4. Data Security
                        </h3>
                        <p className="text-muted-foreground">
                          We implement appropriate security measures to protect
                          your personal information against unauthorized access,
                          alteration, disclosure, or destruction. However, no
                          method of transmission over the internet is 100%
                          secure.
                        </p>
                      </section>

                      <section>
                        <h3 className="mb-2 text-base font-semibold">
                          5. Community Guidelines
                        </h3>
                        <p className="text-muted-foreground">
                          As a member of VibeDev ID, you agree to maintain
                          respectful interactions, share knowledge
                          constructively, and contribute to a positive learning
                          environment for all developers in our community.
                        </p>
                      </section>

                      <section>
                        <h3 className="mb-2 text-base font-semibold">
                          6. Your Rights
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          You have the right to:
                        </p>
                        <ul className="text-muted-foreground ml-4 list-inside list-disc space-y-1">
                          <li>Access and update your personal information</li>
                          <li>Delete your account and associated data</li>
                          <li>Opt out of non-essential communications</li>
                          <li>Request a copy of your data</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="mb-2 text-base font-semibold">
                          7. Contact Us
                        </h3>
                        <p className="text-muted-foreground">
                          If you have any questions about this Privacy Policy or
                          our data practices, please contact us at
                          privacy@vibedev.id or through our community support
                          channels.
                        </p>
                      </section>
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </footer>
  )
}
