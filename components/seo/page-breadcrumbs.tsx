import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { breadcrumbListSchema } from '@/lib/seo/schema-templates'
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url'
import { cn } from '@/lib/utils'

export interface BreadcrumbEntry {
  name: string
  /** Site path, including `/` for the homepage. */
  href: string
}

function crumbUrl(href: string): string {
  if (href === '/') return getSiteUrl()
  return absoluteUrl(href)
}

/**
 * Visible breadcrumb trail plus a BreadcrumbList built from the same items.
 */
export function PageBreadcrumbs({ items, className }: { items: BreadcrumbEntry[]; className?: string }) {
  if (items.length === 0) return null

  const schema = breadcrumbListSchema(items.map((item) => ({ name: item.name, url: crumbUrl(item.href) })))

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <Breadcrumb className={cn('mb-6', className)}>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <Fragment key={`${item.href}-${item.name}`}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href}>{item.name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {isLast ? null : <BreadcrumbSeparator />}
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}
