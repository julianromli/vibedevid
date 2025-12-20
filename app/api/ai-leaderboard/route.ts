import { NextResponse } from 'next/server'
import { type AIModel, FALLBACK_DATA, type LeaderboardResponse } from '@/lib/ai-leaderboard-data'

const ARTIFICIAL_ANALYSIS_URL = 'https://artificialanalysis.ai/?intelligence=coding-index'

function mapProviderSlug(providerName: string): string {
  const mapping: Record<string, string> = {
    google: 'google',
    anthropic: 'anthropic',
    openai: 'openai',
    xai: 'xai',
    'x.ai': 'xai',
    moonshot: 'moonshot',
    'moonshot ai': 'moonshot',
    deepseek: 'deepseek',
    alibaba: 'alibaba',
    qwen: 'alibaba',
    zhipu: 'zhipu',
    'zhipu ai': 'zhipu',
    glm: 'zhipu',
    mistral: 'mistral',
    'mistral ai': 'mistral',
    meta: 'meta',
    minimax: 'minimax',
    bytedance: 'bytedance',
    'bytedance seed': 'bytedance',
  }

  const normalized = providerName.toLowerCase().trim()
  return mapping[normalized] || 'other'
}

function inferProvider(modelName: string): { provider: string; slug: string } {
  const name = modelName.toLowerCase()

  if (name.includes('gemini')) return { provider: 'Google', slug: 'google' }
  if (name.includes('claude')) return { provider: 'Anthropic', slug: 'anthropic' }
  if (name.includes('gpt') || name.includes('o1') || name.includes('o3')) return { provider: 'OpenAI', slug: 'openai' }
  if (name.includes('grok')) return { provider: 'xAI', slug: 'xai' }
  if (name.includes('kimi')) return { provider: 'Moonshot', slug: 'moonshot' }
  if (name.includes('deepseek')) return { provider: 'DeepSeek', slug: 'deepseek' }
  if (name.includes('qwen')) return { provider: 'Alibaba', slug: 'alibaba' }
  if (name.includes('glm')) return { provider: 'Zhipu AI', slug: 'zhipu' }
  if (name.includes('mistral') || name.includes('magistral')) return { provider: 'Mistral', slug: 'mistral' }
  if (name.includes('llama')) return { provider: 'Meta', slug: 'meta' }
  if (name.includes('minimax')) return { provider: 'MiniMax', slug: 'minimax' }
  if (name.includes('doubao') || name.includes('seed')) return { provider: 'ByteDance', slug: 'bytedance' }

  return { provider: 'Unknown', slug: 'other' }
}

async function fetchFromArtificialAnalysis(): Promise<AIModel[] | null> {
  try {
    const response = await fetch(ARTIFICIAL_ANALYSIS_URL, {
      next: { revalidate: 86400 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch from Artificial Analysis:', response.status)
      return null
    }

    const html = await response.text()

    const jsonMatch = html.match(/"data":"([^"]+)"/)

    if (!jsonMatch) {
      console.error('Could not find data in Artificial Analysis page')
      return null
    }

    const csvData = jsonMatch[1]
    const lines = csvData.split('\\n').filter((line) => line.trim())

    if (lines.length < 2) {
      return null
    }

    const models: AIModel[] = []

    for (let i = 1; i < lines.length && models.length < 10; i++) {
      const parts = lines[i].split(',')
      if (parts.length >= 3) {
        const name = parts[0].trim()
        const score = parseFloat(parts[1])

        if (!isNaN(score) && score > 0) {
          const { provider, slug } = inferProvider(name)
          models.push({
            rank: models.length + 1,
            name,
            score: Math.round(score),
            provider,
            providerSlug: slug,
            detailsUrl: `https://artificialanalysis.ai/models/${name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`,
          })
        }
      }
    }

    return models.length > 0 ? models : null
  } catch (error) {
    console.error('Error fetching from Artificial Analysis:', error)
    return null
  }
}

export async function GET() {
  const models = await fetchFromArtificialAnalysis()

  const response: LeaderboardResponse = {
    models: models || FALLBACK_DATA,
    lastUpdated: new Date().toISOString(),
    source: 'https://artificialanalysis.ai',
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}
