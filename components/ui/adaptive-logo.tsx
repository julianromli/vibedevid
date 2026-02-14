import Image from 'next/image'

interface AdaptiveLogoProps {
  className?: string
  alt?: string
}

export function AdaptiveLogo({ className = 'h-7 w-auto md:h-8', alt = 'VibeDev ID Logo' }: AdaptiveLogoProps) {
  return (
    <div className="relative">
      {/* Light mode logo - visible in light mode, hidden in dark mode */}
      <Image
        src="/vibedevid_final_black.svg"
        alt={alt}
        className={`${className} block transition-opacity duration-300 dark:hidden`}
        width={704}
        height={120}
        priority={true}
      />

      {/* Dark mode logo - hidden in light mode, visible in dark mode */}
      <Image
        src="/vibedevid_final_white.svg"
        alt={alt}
        className={`${className} hidden transition-opacity duration-300 dark:block`}
        aria-hidden="true"
        width={704}
        height={120}
        priority={true}
      />
    </div>
  )
}
