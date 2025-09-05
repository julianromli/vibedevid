import Image from "next/image";

interface AdaptiveLogoProps {
  className?: string;
  alt?: string;
}

export function AdaptiveLogo({
  className = "w-auto h-8",
  alt = "VibeDev ID Logo",
}: AdaptiveLogoProps) {
  return (
    <div className="relative">
      {/* Light mode logo - visible in light mode, hidden in dark mode */}
      <Image
        src="/vibedevid-logo.svg"
        alt={alt}
        className={`${className} block dark:hidden transition-opacity duration-300`}
        width={120}
        height={40}
      />

      {/* Dark mode logo - hidden in light mode, visible in dark mode */}
      <Image
        src="/vibedevid-logo-white.svg"
        alt={alt}
        className={`${className} hidden dark:block transition-opacity duration-300`}
        aria-hidden="true"
        width={120}
        height={40}
      />
    </div>
  );
}
