import { AIProvider, AnthropicProvider, MockProvider } from './ai-provider'

let cachedProvider: AIProvider | null = null

export function getProvider(): AIProvider {
  if (cachedProvider) return cachedProvider
  if (process.env.ANTHROPIC_API_KEY) {
    cachedProvider = new AnthropicProvider()
  } else {
    console.warn(
      '[ai-provider] ANTHROPIC_API_KEY is not set — falling back to MockProvider. Extractions will mirror the form data instead of reading the image.',
    )
    cachedProvider = new MockProvider()
  }
  return cachedProvider
}

// Test-only — allow tests/dev to inject a provider without env mutation.
export function setProvider(p: AIProvider | null) {
  cachedProvider = p
}
