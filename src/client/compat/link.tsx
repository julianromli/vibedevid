import { forwardRef } from 'react'
import { Link as RouterLink, type LinkProps } from 'react-router-dom'

type Props = Omit<LinkProps, 'to'> & {
  href: string
}

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, ...props }, ref) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:')
  if (isExternal) {
    return <a ref={ref} href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)} />
  }
  return <RouterLink ref={ref} to={href} {...props} />
})

export default Link
