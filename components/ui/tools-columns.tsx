"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Code } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    <div className={cn("flex flex-col space-y-4 overflow-hidden", className)}>
      <div
        className="flex flex-col space-y-4 animate-scroll-up"
        style={{
          animation: `scrollUp ${duration}s linear infinite`,
        }}
      >
        {[...tools, ...tools].map((tool, index) => (
          <Card key={index} className="p-6 w-80 flex-shrink-0">
            <div className="relative">
              <div className="flex items-start space-x-4 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tool.gradient}`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium mb-2">{tool.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-dashed pt-4">
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="gap-1 pr-2 shadow-none text-xs"
                >
                  <Link href={tool.link} target="_blank" rel="noopener noreferrer">
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
