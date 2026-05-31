import { useEffect } from 'react'

type Props = {
  id?: string
  src?: string
  strategy?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive'
  children?: string
}

export default function Script({ src, id, children }: Props) {
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

  if (children) {
    return <script id={id} dangerouslySetInnerHTML={{ __html: children }} />
  }

  return null
}
