import type React from 'react'
import type { ImgHTMLAttributes } from 'react'

export interface StaticImageData {
  src: string
  height: number
  width: number
  blurDataURL?: string
}

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string | StaticImageData
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  unoptimized?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  loading?: 'lazy' | 'eager'
}

type GetImagePropsInput = {
  src: string
  alt: string
  width: number
  height: number
  quality?: number
  sizes?: string
}

/** Stub replacing next/image getImageProps for art-direction helpers. */
export function getImageProps(input: GetImagePropsInput): { props: ImgHTMLAttributes<HTMLImageElement> } {
  const { src, alt, width, height } = input
  return {
    props: {
      src,
      alt,
      width,
      height,
      loading: 'lazy',
      decoding: 'async',
    },
  }
}
