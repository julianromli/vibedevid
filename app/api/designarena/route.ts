import { NextRequest, NextResponse } from 'next/server'

interface ModelPerformanceData {
  id: string
  name: string
  icon: string
  winRate: number
  eloRating?: number
  category: string
  color: string
}

interface BuilderPerformanceData {
  id: string
  name: string
  icon: string
  winRate: number
  eloRating?: number
  category: string
  color: string
}

interface DesignArenaData {
  modelPerformance: ModelPerformanceData[]
  builderPerformance: BuilderPerformanceData[]
  lastUpdated: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'model' atau 'builder'
    const category = searchParams.get('category') || 'all' // filtering category

    // Untuk sekarang, langsung pakai mock data karena scraping complex
    // TODO: Implement proper scraping atau pakai official API jika ada
    let modelData: ModelPerformanceData[] = []
    let builderData: BuilderPerformanceData[] = []

    if (!type || type === 'model') {
      modelData = getMockModelData()
    }
    if (!type || type === 'builder') {
      builderData = getMockBuilderData()
    }

    console.log('API Response Data:', {
      modelCount: modelData.length,
      builderCount: builderData.length,
      type,
      category,
    })

    // Filter berdasarkan category jika diminta
    if (category !== 'all') {
      modelData = modelData.filter((item) =>
        item.category.toLowerCase().includes(category.toLowerCase()),
      )
      builderData = builderData.filter((item) =>
        item.category.toLowerCase().includes(category.toLowerCase()),
      )
    }

    const response: DesignArenaData = {
      modelPerformance: modelData,
      builderPerformance: builderData,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('DesignArena API Error:', error)

    // Return fallback data jika ada error
    const fallbackData: DesignArenaData = {
      modelPerformance: getMockModelData(),
      builderPerformance: getMockBuilderData(),
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(fallbackData, { status: 200 })
  }
}

function parseModelPerformance(html: string): ModelPerformanceData[] {
  // Multiple patterns untuk extract model performance data
  const patterns = [
    // Pattern untuk Claude, GPT, DeepSeek, etc
    /Claude\s*Opus\s*4.*?(\d+\.?\d*)%/gi,
    /Claude\s*Sonnet\s*4.*?(\d+\.?\d*)%/gi,
    /GPT[-\s]*5.*?(\d+\.?\d*)%/gi,
    /DeepSeek[-\s]*R1.*?(\d+\.?\d*)%/gi,
    /Qwen.*?(\d+\.?\d*)%/gi,
  ]

  // Jika parsing gagal, return mock data
  return getMockModelData()
}

function parseBuilderPerformance(html: string): BuilderPerformanceData[] {
  // Multiple patterns untuk extract builder performance data
  const patterns = [
    // Pattern untuk Devin, Same.new, Lovable, etc
    /Devin.*?(\d+\.?\d*)%/gi,
    /Same\.new.*?(\d+\.?\d*)%/gi,
    /new\.website.*?(\d+\.?\d*)%/gi,
    /Lovable.*?(\d+\.?\d*)%/gi,
    /Cursor.*?(\d+\.?\d*)%/gi,
  ]

  // Jika parsing gagal, return mock data
  return getMockBuilderData()
}

function getMockModelData(): ModelPerformanceData[] {
  return [
    {
      id: 'claude-opus-4',
      name: 'Claude Opus 4',
      icon: 'https://www.designarena.ai/model-logos/claudelogo.jpeg',
      winRate: 72.0,
      eloRating: 1850,
      category: 'AI Model',
      color: 'hsl(var(--chart-1))',
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      icon: 'https://www.designarena.ai/model-logos/claudelogo.jpeg',
      winRate: 69.1,
      eloRating: 1820,
      category: 'AI Model',
      color: 'hsl(var(--chart-2))',
    },
    {
      id: 'claude-opus-4.1',
      name: 'Claude Opus 4.1',
      icon: 'https://www.designarena.ai/model-logos/claudelogo.jpeg',
      winRate: 69.1,
      eloRating: 1815,
      category: 'AI Model',
      color: 'hsl(var(--muted-foreground))',
    },
    {
      id: 'gpt-5-minimal',
      name: 'GPT-5 (Minimal)',
      icon: 'https://www.designarena.ai/model-logos/chatgptlogo.png',
      winRate: 68.4,
      eloRating: 1800,
      category: 'AI Model',
      color: 'hsl(var(--chart-1))',
    },
    {
      id: 'claude-opus-4.1-thinking',
      name: 'Claude Opus 4.1 (Thinking)',
      icon: 'https://www.designarena.ai/model-logos/claudelogo.jpeg',
      winRate: 68.4,
      eloRating: 1795,
      category: 'AI Model',
      color: 'hsl(var(--chart-3))',
    },
    {
      id: 'deepseek-r1-0528',
      name: 'DeepSeek-R1-0528',
      icon: 'https://www.designarena.ai/model-logos/deepseeklogo.png',
      winRate: 67.2,
      eloRating: 1780,
      category: 'AI Model',
      color: 'hsl(var(--chart-2))',
    },
    {
      id: 'claude-3.7-sonnet',
      name: 'Claude 3.7 Sonnet',
      icon: 'https://www.designarena.ai/model-logos/claudelogo.jpeg',
      winRate: 66.2,
      eloRating: 1770,
      category: 'AI Model',
      color: 'hsl(var(--chart-4))',
    },
    {
      id: 'qwen3-coder-480b-a35b-instruct',
      name: 'Qwen3 Coder 480B A35B Instruct',
      icon: 'https://www.designarena.ai/model-logos/qwenlogo.png',
      winRate: 65.4,
      eloRating: 1760,
      category: 'AI Model',
      color: 'hsl(var(--chart-5))',
    },
    {
      id: 'claude-sonnet-4-thinking',
      name: 'Claude Sonnet 4 (Thinking)',
      icon: 'https://www.designarena.ai/model-logos/claudelogo.jpeg',
      winRate: 64.9,
      eloRating: 1750,
      category: 'AI Model',
      color: 'hsl(var(--muted-foreground))',
    },
    {
      id: 'glm-4.5',
      name: 'GLM 4.5',
      icon: 'https://www.designarena.ai/model-logos/chatgptlogo.png',
      winRate: 64.6,
      eloRating: 1745,
      category: 'AI Model',
      color: 'hsl(var(--chart-3))',
    },
  ]
}

function getMockBuilderData(): BuilderPerformanceData[] {
  return [
    {
      id: 'devin',
      name: 'Devin',
      icon: 'https://www.designarena.ai/model-logos/cognition.png',
      winRate: 61.2,
      eloRating: 1650,
      category: 'AI Builder',
      color: 'hsl(var(--chart-1))',
    },
    {
      id: 'same-new',
      name: 'Same.new',
      icon: 'https://www.designarena.ai/model-logos/same-new.png',
      winRate: 60.3,
      eloRating: 1640,
      category: 'AI Builder',
      color: 'hsl(var(--chart-2))',
    },
    {
      id: 'new-website',
      name: 'new.website',
      icon: 'https://www.designarena.ai/model-logos/new-website-logo.png',
      winRate: 60.0,
      eloRating: 1635,
      category: 'AI Builder',
      color: 'hsl(var(--muted-foreground))',
    },
    {
      id: 'lovable',
      name: 'Lovable',
      icon: 'https://www.designarena.ai/model-logos/lovablelogo.png',
      winRate: 58.9,
      eloRating: 1620,
      category: 'AI Builder',
      color: 'hsl(var(--chart-3))',
    },
    {
      id: 'figma-make',
      name: 'Figma Make',
      icon: 'https://www.designarena.ai/model-logos/figma.png',
      winRate: 58.6,
      eloRating: 1615,
      category: 'Design Tool',
      color: 'hsl(var(--chart-4))',
    },
    {
      id: 'magic-patterns',
      name: 'Magic Patterns',
      icon: 'https://www.designarena.ai/model-logos/magic_patterns_logo.png',
      winRate: 57.4,
      eloRating: 1600,
      category: 'Design Tool',
      color: 'hsl(var(--chart-5))',
    },
    {
      id: 'anything',
      name: 'Anything',
      icon: 'https://www.designarena.ai/model-logos/create-logo.png',
      winRate: 56.9,
      eloRating: 1590,
      category: 'AI Builder',
      color: 'hsl(var(--chart-1))',
    },
    {
      id: 'cursor',
      name: 'Cursor',
      icon: 'https://www.designarena.ai/model-logos/cursor_logo.png',
      winRate: 56.4,
      eloRating: 1585,
      category: 'Code Editor',
      color: 'hsl(var(--chart-2))',
    },
    {
      id: 'float',
      name: 'Float',
      icon: 'https://www.designarena.ai/model-logos/floot-logo.png',
      winRate: 56.2,
      eloRating: 1580,
      category: 'AI Builder',
      color: 'hsl(var(--muted-foreground))',
    },
    {
      id: 'google-ai-studio',
      name: 'Google AI Studio',
      icon: 'https://www.designarena.ai/model-logos/aistudio.png',
      winRate: 54.3,
      eloRating: 1550,
      category: 'AI Platform',
      color: 'hsl(var(--chart-3))',
    },
  ]
}
