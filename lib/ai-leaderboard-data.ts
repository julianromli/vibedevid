export interface AIModel {
  rank: number
  name: string
  score: number
  provider: string
  providerSlug: string
  detailsUrl: string
}

export interface LeaderboardResponse {
  models: AIModel[]
  lastUpdated: string
  source: string
}

export const PROVIDER_COLORS: Record<string, string> = {
  google: '#4285F4',
  anthropic: '#D97757',
  openai: '#10A37F',
  xai: '#1D1D1F',
  moonshot: '#6366F1',
  deepseek: '#0EA5E9',
  alibaba: '#FF6A00',
  zhipu: '#00D4AA',
  mistral: '#F97316',
  meta: '#0668E1',
  minimax: '#8B5CF6',
  bytedance: '#00F0FF',
}

export const PROVIDER_LOGOS: Record<string, string> = {
  google: '/logos/ai-providers/google.svg',
  anthropic: '/logos/ai-providers/anthropic.svg',
  openai: '/logos/ai-providers/openai.svg',
  xai: '/logos/ai-providers/xai.svg',
  moonshot: '/logos/ai-providers/moonshot.svg',
  deepseek: '/logos/ai-providers/deepseek.svg',
  alibaba: '/logos/ai-providers/alibaba.svg',
  zhipu: '/logos/ai-providers/zhipu.svg',
  mistral: '/logos/ai-providers/mistral.svg',
  meta: '/logos/ai-providers/meta.svg',
  minimax: '/logos/ai-providers/minimax.svg',
  bytedance: '/logos/ai-providers/bytedance.svg',
}

export const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  xai: 'xAI',
  moonshot: 'Moonshot',
  deepseek: 'DeepSeek',
  alibaba: 'Alibaba',
  zhipu: 'Zhipu AI',
  mistral: 'Mistral',
  meta: 'Meta',
  minimax: 'MiniMax',
  bytedance: 'ByteDance',
}

export const FALLBACK_DATA: AIModel[] = [
  {
    rank: 1,
    name: 'Gemini 3 Pro Preview',
    score: 62,
    provider: 'Google',
    providerSlug: 'google',
    detailsUrl: 'https://artificialanalysis.ai/models/gemini-3-pro',
  },
  {
    rank: 2,
    name: 'Claude Opus 4.5',
    score: 60,
    provider: 'Anthropic',
    providerSlug: 'anthropic',
    detailsUrl: 'https://artificialanalysis.ai/models/claude-opus-4-5',
  },
  {
    rank: 3,
    name: 'GPT-5.1',
    score: 58,
    provider: 'OpenAI',
    providerSlug: 'openai',
    detailsUrl: 'https://artificialanalysis.ai/models/gpt-5-1',
  },
  {
    rank: 4,
    name: 'Grok 4',
    score: 55,
    provider: 'xAI',
    providerSlug: 'xai',
    detailsUrl: 'https://artificialanalysis.ai/models/grok-4',
  },
  {
    rank: 5,
    name: 'GPT-5 Codex',
    score: 53,
    provider: 'OpenAI',
    providerSlug: 'openai',
    detailsUrl: 'https://artificialanalysis.ai/models/gpt-5-codex',
  },
  {
    rank: 6,
    name: 'Kimi K2 Thinking',
    score: 52,
    provider: 'Moonshot',
    providerSlug: 'moonshot',
    detailsUrl: 'https://artificialanalysis.ai/models/kimi-k2-thinking',
  },
  {
    rank: 7,
    name: 'Claude 4.5 Sonnet',
    score: 50,
    provider: 'Anthropic',
    providerSlug: 'anthropic',
    detailsUrl: 'https://artificialanalysis.ai/models/claude-4-5-sonnet',
  },
  {
    rank: 8,
    name: 'Grok 4.1 Fast',
    score: 50,
    provider: 'xAI',
    providerSlug: 'xai',
    detailsUrl: 'https://artificialanalysis.ai/models/grok-4-1-fast',
  },
  {
    rank: 9,
    name: 'gpt-oss-120B',
    score: 50,
    provider: 'OpenAI',
    providerSlug: 'openai',
    detailsUrl: 'https://artificialanalysis.ai/models/gpt-oss-120b',
  },
  {
    rank: 10,
    name: 'Gemini 2.5 Pro',
    score: 49,
    provider: 'Google',
    providerSlug: 'google',
    detailsUrl: 'https://artificialanalysis.ai/models/gemini-2-5-pro',
  },
]

export function getProviderColor(slug: string): string {
  return PROVIDER_COLORS[slug] || '#6B7280'
}

export function getProviderLogo(slug: string): string {
  return PROVIDER_LOGOS[slug] || '/logos/ai-providers/default.svg'
}
