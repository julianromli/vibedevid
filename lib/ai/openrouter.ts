/**
 * OpenRouter AI Configuration
 *
 * Maintainable: Change model by updating AI_MODEL constant
 * Docs: https://openrouter.ai/docs
 */
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// ============================================
// 🔧 CONFIGURABLE: Change model here
// ============================================
export const AI_MODEL = 'google/gemini-3-flash-preview'

// Alternative models (for future reference):
// - 'google/gemini-2.5-flash-preview-09-2025' (cheaper)
// - 'anthropic/claude-3.5-sonnet' (better quality)
// - 'openai/gpt-4o' (OpenAI alternative)

export const createAIClient = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  })
}

export const getAIModel = () => {
  const client = createAIClient()
  return client.chat(AI_MODEL)
}
