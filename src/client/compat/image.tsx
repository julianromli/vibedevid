import type { CSSProperties, ImgHTMLAttributes } from 'react'

export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  unoptimized?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export default function Image({
  alt,
  fill,
  priority,
  unoptimized: _unoptimized,
  sizes: _sizes,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  style,
  ...props
}: ImageProps) {
  const mergedStyle: CSSProperties | undefined = fill
    ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : style

  return (
    <img
      {...props}
      alt={alt}
      loading={priority ? 'eager' : (props.loading ?? 'lazy')}
      style={mergedStyle}
      decoding="async"
    />
  )
}

export function getImageProps({ src, alt, width, height, ...rest }: ImageProps) {
  return {
    props: {
      src,
      alt,
      width,
      height,
      ...rest,
    },
  }
}
