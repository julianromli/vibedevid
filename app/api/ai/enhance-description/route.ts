import { generateText } from 'ai'
import { getAIModel } from '@/lib/ai/openrouter'

export const runtime = 'edge'

interface EnhanceRequest {
  description: string
  title?: string
  tagline?: string
  tags?: string[]
}

const SYSTEM_PROMPT = `Kamu adalah AI writer untuk VibeDev Indonesia community - komunitas developer Indonesia.

TUGAS:
- Jika diberikan description mentah: Rapikan dan enhance menjadi description yang profesional
- Jika description kosong tapi ada title/tags: Generate description baru berdasarkan context

ATURAN PENULISAN:
1. Gunakan bahasa Indonesia yang santai tapi profesional (boleh campur bahasa Inggris untuk istilah teknis)
2. Struktur yang jelas dan mudah dibaca
3. Highlight fitur utama dengan bullet points jika ada banyak fitur
4. JANGAN tambahkan informasi yang tidak ada di input (jangan mengarang)
5. JANGAN gunakan markdown headers (# atau ##)
6. Boleh gunakan emoji secukupnya untuk highlight (🚀 💻 ✨ dll)
7. Maksimal 4000 karakter
8. Langsung tulis description-nya saja, tanpa pembuka seperti "Berikut adalah..." atau "Ini adalah..."

FORMAT OUTPUT (contoh):
[Nama Project] adalah [deskripsi singkat apa ini].

🚀 Fitur Utama:
• [Fitur 1]
• [Fitur 2]
• [Fitur 3]

💻 Tech Stack:
[List teknologi yang digunakan]

[Closing statement singkat - untuk siapa project ini cocok]`

export async function POST(req: Request) {
  try {
    const body: EnhanceRequest = await req.json()
    const { description, title, tagline, tags } = body

    // Validate: minimal harus ada title atau description
    if (!description?.trim() && !title?.trim()) {
      return new Response(JSON.stringify({ error: 'Minimal harus ada title atau description' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build context untuk AI
    const contextParts: string[] = []
    if (title?.trim()) contextParts.push(`Title: ${title.trim()}`)
    if (tagline?.trim()) contextParts.push(`Tagline: ${tagline.trim()}`)
    if (tags?.length) contextParts.push(`Tech Stack/Tags: ${tags.join(', ')}`)

    // Build user prompt
    let userPrompt: string
    if (description?.trim()) {
      // Mode: Enhance existing description
      userPrompt = `${contextParts.join('\n')}

Description (tolong rapikan dan enhance):
${description.trim()}`
    } else {
      // Mode: Generate new description from context
      userPrompt = `${contextParts.join('\n')}

Tolong buatkan description yang menarik untuk project ini berdasarkan informasi di atas.`
    }

    const result = await generateText({
      model: getAIModel(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxOutputTokens: 2500, // ~4000+ karakter untuk bahasa Indonesia
    })

    const enhancedDescription = result.text?.trim() || ''

    if (!enhancedDescription) {
      return new Response(JSON.stringify({ error: 'AI tidak menghasilkan output' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ description: enhancedDescription }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('AI enhance description error:', error)
    return new Response(JSON.stringify({ error: 'Gagal generate description. Coba lagi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
