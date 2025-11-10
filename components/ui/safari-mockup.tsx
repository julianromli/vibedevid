/**
 * Safari Browser Mockup Component
 * Reusable browser chrome mockup with customizable URL
 */

interface SafariMockupProps {
  children: React.ReactNode
  url?: string
}

export function SafariMockup({ children, url = 'vibedevid.com' }: SafariMockupProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100 shadow-2xl">
      {/* Browser Chrome */}
      <div className="flex items-center justify-between border-b border-gray-300 bg-gray-200 px-4 py-3">
        {/* Traffic Lights */}
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        {/* Address Bar */}
        <div className="mx-4 flex-1">
          <div className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600">
            <span className="text-green-600">🔒</span> {url}
          </div>
        </div>
        {/* Browser Controls */}
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded bg-gray-300"></div>
          <div className="h-6 w-6 rounded bg-gray-300"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white">{children}</div>
    </div>
  )
}
