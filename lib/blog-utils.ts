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
      const children = node.content?.map(contentToHtmlRecursive).join('') ?? ''
      // Ensure empty paragraphs render as a space/line
      return `<p>${children || '<br />'}</p>`
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
      const src = attrs.src || attrs.url || ''
      const alt = attrs.alt || ''
      const title = attrs.title || ''
      if (!src) {
        console.warn('[BlogUtils] Image node missing src:', node)
        return ''
      }
      return `<img src="${src}" alt="${alt}" title="${title}" class="rounded-lg border shadow-sm my-8 mx-auto max-w-full h-auto" />`
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
