'use client'

import { Code, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface Tool {
  title: string
  description: string
  link: string
  icon: React.ReactNode
  gradient: string
}

interface ToolsColumnsProps {
  tools: Tool[]
  duration?: number
  className?: string
}

export function ToolsColumns({ tools, duration = 20, className }: ToolsColumnsProps) {
  return (
    <div className={cn('flex flex-col space-y-4 overflow-hidden', className)}>
      <div
        className="animate-scroll-up flex flex-col space-y-4"
        style={{
          animation: `scrollUp ${duration}s linear infinite`,
        }}
      >
        {[...tools, ...tools].map((tool, index) => (
          <Card
            key={index}
            className="w-80 flex-shrink-0 p-6"
          >
            <div className="relative">
              <div className="mb-4 flex items-start space-x-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tool.gradient}`}>
                  {tool.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 text-base font-medium">{tool.title}</h3>
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{tool.description}</p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-dashed pt-4">
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="gap-1 pr-2 text-xs shadow-none"
                >
                  <Link
                    href={tool.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Try It
                    <ExternalLink className="ml-0 !size-3 opacity-50" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <style jsx>{`
        @keyframes scrollUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .animate-scroll-up {
          animation: scrollUp ${duration}s linear infinite;
        }
      `}</style>
    </div>
  )
}
