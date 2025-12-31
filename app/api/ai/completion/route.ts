import { streamText } from 'ai'
import { getAIModel } from '@/lib/ai/openrouter'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = streamText({
      model: getAIModel(),
      messages: [
        {
          role: 'system',
          content: `You are an AI writing assistant that continues existing text based on context.
Give more weight to the later characters than the beginning ones.
Limit your response to no more than 200 characters.
Construct complete sentences.
Use Markdown formatting when appropriate.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxOutputTokens: 200,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('AI completion error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate completion' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
