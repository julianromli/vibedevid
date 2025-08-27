interface AdaptiveLogoProps {
  className?: string
  alt?: string
}

export function AdaptiveLogo({ 
  className = "w-auto h-8", 
  alt = "VibeDev ID Logo" 
}: AdaptiveLogoProps) {
  return (
    <div className="relative">
      {/* Light mode logo - visible in light mode, hidden in dark mode */}
      <img 
        src="/vibedevid-logo.svg" 
        alt={alt}
        className={`${className} block dark:hidden transition-opacity duration-300`}
      />
      
      {/* Dark mode logo - hidden in light mode, visible in dark mode */}
      <img 
        src="/vibedevid-logo-white.svg" 
        alt={alt}
        className={`${className} hidden dark:block transition-opacity duration-300`}
        aria-hidden="true"
      />
    </div>
  )
}
