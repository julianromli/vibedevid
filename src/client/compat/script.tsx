import { useEffect } from 'react'

type Props = {
  id?: string
  src?: string
  strategy?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive'
  type?: string
  children?: string
  dangerouslySetInnerHTML?: { __html: string }
}

export default function Script({ src, id, type, children, dangerouslySetInnerHTML }: Props) {
  useEffect(() => {
    if (!src) return
    const script = document.createElement('script')
    script.src = src
    if (id) script.id = id
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [src, id])

  const html = dangerouslySetInnerHTML?.__html ?? children
  if (html) {
    return (
      <script
        id={id}
        type={type}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: this compatibility shim mirrors next/script for trusted caller-provided script bodies.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return null
}
