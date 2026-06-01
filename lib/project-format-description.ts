/** XSS-safe plain text → HTML for project descriptions */
export function formatProjectDescription(text: string): string {
  if (!text) return ''

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const escaped = normalized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const paragraphs = escaped.split(/\n\n+/)

  return paragraphs
    .map((paragraph) => {
      const lines = paragraph.split('\n')
      const hasBullets = lines.some((line) => /^[\s]*[•\-*]\s/.test(line))

      if (hasBullets) {
        const firstLine = lines[0]
        const isHeader = firstLine && !/^[\s]*[•\-*]\s/.test(firstLine)

        if (isHeader) {
          const headerLine = `<p class="font-semibold mt-4 mb-2">${firstLine}</p>`
          return `${headerLine}${formatLinesWithLists(lines.slice(1))}`
        }

        return formatLinesWithLists(lines)
      }

      const formattedParagraph = paragraph.replace(/\n/g, '<br>')
      return `<p class="mb-4">${formattedParagraph}</p>`
    })
    .join('')
}

function formatLinesWithLists(lines: string[]): string {
  const parts: string[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length === 0) return
    parts.push(`<ul class="list-disc list-inside space-y-1 mb-4">${listItems.join('')}</ul>`)
    listItems = []
  }

  for (const line of lines) {
    const bulletMatch = line.match(/^[\s]*[•\-*]\s*(.*)$/)
    if (bulletMatch) {
      listItems.push(`<li>${bulletMatch[1]}</li>`)
      continue
    }

    flushList()
    if (line.trim()) {
      parts.push(`<p class="mb-4">${line}</p>`)
    }
  }

  flushList()
  return parts.join('')
}
