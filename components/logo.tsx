import { Image } from '@unpic/react'

export function Logo({
  className = '',
  width = 18,
  height = 18,
}: {
  className?: string
  width?: number
  height?: number
}) {
  return (
    <Image
      src="/shadcnblocks-admin-logo.svg"
      width={width}
      height={height}
      className={className}
      alt="Shadcnblocks"
    />
  )
}
