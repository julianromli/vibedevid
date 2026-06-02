type RichTextMark = {
  type?: string
  attrs?: Record<string, unknown>
}

export type RichTextNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  content?: RichTextNode[]
  marks?: RichTextMark[]
  src?: unknown
  url?: unknown
  alt?: unknown
  title?: unknown
}

export function contentToHtml(content: RichTextNode): string {
  return contentToHtmlRecursive(content)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('/')) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {
    return ''
  }

  return ''
}

function applyTextMarks(text: string, marks: RichTextMark[]): string {
  let html = escapeHtml(text)

  for (const mark of marks) {
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
      case 'link': {
        const href = sanitizeUrl(mark.attrs?.href)
        if (href) {
          html = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${html}</a>`
        }
        break
      }
      case 'strike':
        html = `<s>${html}</s>`
        break
    }
  }

  return html
}

function renderImageNode(richNode: RichTextNode): string {
  const attrs = richNode.attrs || {}
  const src = sanitizeUrl(attrs.src || attrs.url || richNode.src || richNode.url)
  const alt = escapeHtml(String(attrs.alt || richNode.alt || ''))
  const title = escapeHtml(String(attrs.title || richNode.title || ''))

  if (!src) {
    return ''
  }

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

function renderParagraphNode(richNode: RichTextNode): string {
  if (richNode.content?.length === 1 && richNode.content[0].type === 'image') {
    return contentToHtmlRecursive(richNode.content[0])
  }

  const children = richNode.content?.map(contentToHtmlRecursive).join('') ?? ''
  const content = children.trim() ? children : '&nbsp;'
  return `<p>${content}</p>`
}

export function contentToHtmlRecursive(node: unknown): string {
  if (typeof node === 'string') return escapeHtml(node)
  if (!node || typeof node !== 'object') return ''

  const richNode = node as RichTextNode
  if (!richNode.type) return ''

  switch (richNode.type) {
    case 'doc':
      return richNode.content?.map(contentToHtmlRecursive).join('') ?? ''

    case 'paragraph':
      return renderParagraphNode(richNode)

    case 'heading': {
      const level = Math.min(Math.max(Number(richNode.attrs?.level ?? 2), 1), 6)
      return `<h${level}>${richNode.content?.map(contentToHtmlRecursive).join('') ?? ''}</h${level}>`
    }

    case 'bulletList':
      return `<ul>${richNode.content?.map(contentToHtmlRecursive).join('') ?? ''}</ul>`

    case 'orderedList':
      return `<ol>${richNode.content?.map(contentToHtmlRecursive).join('') ?? ''}</ol>`

    case 'listItem':
      return `<li>${richNode.content?.map(contentToHtmlRecursive).join('') ?? ''}</li>`

    case 'codeBlock':
      return `<pre><code>${richNode.content?.map(contentToHtmlRecursive).join('') ?? ''}</code></pre>`

    case 'blockquote':
      return `<blockquote>${richNode.content?.map(contentToHtmlRecursive).join('') ?? ''}</blockquote>`

    case 'image':
      return renderImageNode(richNode)

    case 'horizontalRule':
      return '<hr />'

    case 'hardBreak':
      return '<br />'

    case 'text': {
      const text = String(richNode.text ?? '')
      return richNode.marks ? applyTextMarks(text, richNode.marks) : escapeHtml(text)
    }

    default:
      // Recursively process nodes we don't explicitly handle if they have content
      return richNode.content?.map(contentToHtmlRecursive).join('') ?? ''
  }
}
