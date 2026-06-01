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
        const listItems = lines
          .map((line) => {
            const bulletMatch = line.match(/^[\s]*[•\-*]\s*(.*)$/)
            if (bulletMatch) {
              return `<li>${bulletMatch[1]}</li>`
            }
            return line.trim() ? `<p>${line}</p>` : ''
          })
          .filter(Boolean)
          .join('')

        const firstLine = lines[0]
        const isHeader = firstLine && !/^[\s]*[•\-*]\s/.test(firstLine)

        if (isHeader) {
          const headerLine = `<p class="font-semibold mt-4 mb-2">${firstLine}</p>`
          const remainingItems = lines
            .slice(1)
            .map((line) => {
              const bulletMatch = line.match(/^[\s]*[•\-*]\s*(.*)$/)
              return bulletMatch ? `<li>${bulletMatch[1]}</li>` : ''
            })
            .filter(Boolean)
            .join('')
          return `${headerLine}<ul class="list-disc list-inside space-y-1 mb-4">${remainingItems}</ul>`
        }

        return `<ul class="list-disc list-inside space-y-1 mb-4">${listItems}</ul>`
      }

      const formattedParagraph = paragraph.replace(/\n/g, '<br>')
      return `<p class="mb-4">${formattedParagraph}</p>`
    })
    .join('')
}
