export function contentToHtml(content: Record<string, any>): string {
  return contentToHtmlRecursive(content)
}

export function contentToHtmlRecursive(node: any): string {
  if (typeof node === 'string') return node
  if (!node || !node.type) return ''

  switch (node.type) {
    case 'doc':
      return node.content?.map(contentToHtmlRecursive).join('') ?? ''

    case 'paragraph': {
      // Check if this paragraph ONLY contains an image
      if (node.content?.length === 1 && node.content[0].type === 'image') {
        return contentToHtmlRecursive(node.content[0])
      }

      const children = node.content?.map(contentToHtmlRecursive).join('') ?? ''
      const content = children.trim() ? children : '&nbsp;'
      return `<p>${content}</p>`
    }

    case 'heading': {
      const level = node.attrs?.level ?? 2
      return `<h${level}>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</h${level}>`
    }

    case 'bulletList':
      return `<ul>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</ul>`

    case 'orderedList':
      return `<ol>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</ol>`

    case 'listItem':
      return `<li>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</li>`

    case 'codeBlock':
      return `<pre><code>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</code></pre>`

    case 'blockquote':
      return `<blockquote>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</blockquote>`

    case 'image': {
      const attrs = node.attrs || {}
      // Support multiple attribute names for the source URL
      const src = attrs.src || attrs.url || node.src || node.url || ''
      const alt = attrs.alt || node.alt || ''
      const title = attrs.title || node.title || ''

      if (!src) {
        console.warn('[BlogUtils] Image node missing src. Node:', JSON.stringify(node))
        return ''
      }

      // Render as a figure-like block with consistent responsive styling
      return `
        <div class="not-prose my-10 flex flex-col items-center">
          <img 
            src="${src}" 
            alt="${alt}" 
            title="${title}" 
            class="rounded-2xl border border-border/40 shadow-xl max-w-full h-auto"
            loading="lazy"
          />
          ${alt ? `<p class="text-muted-foreground mt-4 text-center text-sm font-medium italic">${alt}</p>` : ''}
        </div>
      `
    }

    case 'horizontalRule':
      return '<hr />'

    case 'hardBreak':
      return '<br />'

    case 'text': {
      let html = node.text ?? ''
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              html = `<strong>${html}</strong>`
              break
            case 'italic':
              html = `<em>${html}</em>`
              break
            case 'code':
              html = `<code>${html}</code>`
              break
            case 'link':
              html = `<a href="${mark.attrs?.href ?? ''}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${html}</a>`
              break
            case 'strike':
              html = `<s>${html}</s>`
              break
          }
        })
      }
      return html
    }

    default:
      // Recursively process nodes we don't explicitly handle if they have content
      return node.content?.map(contentToHtmlRecursive).join('') ?? ''
  }
}
