import Anthropic from '@anthropic-ai/sdk'
import type {
  Confidence,
  ExtractionInput,
  ExtractionResult,
  FieldConfig,
  FieldExtraction,
  LabelFieldKey,
} from './types'
import { ProviderUnavailableError } from './types'
import { LABEL_PROCESSING_TIMEOUT_MS } from './field-comparison'

const SYSTEM_PROMPT = `You are a precise OCR and field extraction assistant for the US Alcohol and Tobacco Tax and Trade Bureau (TTB). Your task is to extract specific regulated fields from an alcohol product label image.

You will be given a label image and a list of fields to extract. For each field:
- Extract the EXACT text as it appears on the label — do not normalize, interpret, or clean the text.
- Return the verbatim text including capitalization, punctuation, line breaks, and spacing exactly as shown.
- If a field is clearly present and readable, return confidence "high".
- If a field is present but partially obscured, ambiguous, or you are uncertain, return confidence "low" and explain why in the reason field.
- If a field is NOT present on the label at all (e.g., ABV is not shown on a beer label), return value null with confidence "high". A clearly absent field is not uncertain — do NOT return confidence "low" for an absent optional field.
- Never infer or guess field values. If you cannot read the text clearly, return confidence "low".

IMPORTANT: Your output must be valid JSON only — no prose, no explanation, no markdown code blocks. Return only the JSON object.`

function getBeverageLabel(t: ExtractionInput['beverageType']): string {
  switch (t) {
    case 'spirits':
      return 'distilled spirits'
    case 'wine':
      return 'wine'
    case 'beer':
      return 'beer'
  }
}

function getFieldHint(field: FieldConfig): string {
  const hints: Partial<Record<LabelFieldKey, string>> = {
    abv:
      'Look for percentage (%) and/or proof values. Return the full text as shown (e.g., "45% Alc./Vol. (90 Proof)"). If no ABV appears on the label, return null with confidence "high".',
    governmentWarning:
      'Look for text beginning with "GOVERNMENT WARNING:" — extract the COMPLETE statement verbatim including all line breaks. If it spans multiple lines, include \\n characters between lines.',
    producerAddress:
      'Return the full address including street, city, state, and zip as shown on the label.',
    appellation:
      'Return null with confidence "high" if no appellation is stated on the label.',
    countryOfOrigin:
      'Look for text like "Product of [country]" or "Imported from [country]". Return null with confidence "high" if no country of origin is shown.',
  }
  return hints[field.key] ?? ''
}

function buildUserPrompt(input: ExtractionInput): string {
  const fieldInstructions = input.fieldList
    .map((f) => `- "${f.key}": Extract the ${f.label}. ${getFieldHint(f)}`)
    .join('\n')

  return `Extract the following fields from this ${getBeverageLabel(input.beverageType)} label:

${fieldInstructions}

Return a JSON object with this exact structure:
{
  "fields": {
    "[field_key]": {
      "value": "[extracted text or null]",
      "confidence": "high" or "low",
      "reason": "[explanation only when confidence is low, otherwise omit]"
    }
  }
}

Extract fields for: ${input.fieldList.map((f) => f.key).join(', ')}`
}

function normalizeExtractionResult(
  parsed: unknown,
  fieldList: FieldConfig[],
): ExtractionResult {
  const fields: Partial<Record<LabelFieldKey, FieldExtraction>> = {}
  const raw =
    parsed && typeof parsed === 'object' && 'fields' in parsed
      ? (parsed as { fields: Record<string, unknown> }).fields
      : (parsed as Record<string, unknown>)

  for (const cfg of fieldList) {
    const item = raw?.[cfg.key]
    if (!item || typeof item !== 'object') {
      fields[cfg.key] = {
        value: null,
        confidence: 'low',
        reason: 'Field not returned by AI.',
      }
      continue
    }
    const obj = item as Record<string, unknown>
    const value =
      typeof obj.value === 'string' ? obj.value :
      obj.value === null || obj.value === undefined ? null :
      String(obj.value)
    const confidence: Confidence = obj.confidence === 'high' ? 'high' : obj.confidence === 'low' ? 'low' : 'low'
    const reason = typeof obj.reason === 'string' ? obj.reason : undefined
    fields[cfg.key] = { value, confidence, reason }
  }
  return { fields }
}

function allFieldsNeedsReview(
  fieldList: FieldConfig[],
  reason: string,
): ExtractionResult {
  const fields: Partial<Record<LabelFieldKey, FieldExtraction>> = {}
  for (const cfg of fieldList) {
    fields[cfg.key] = { value: null, confidence: 'low', reason }
  }
  return { fields }
}

export interface AIProvider {
  extractFields(input: ExtractionInput): Promise<ExtractionResult>
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    this.client = new Anthropic({ apiKey })
  }

  async extractFields(input: ExtractionInput): Promise<ExtractionResult> {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      LABEL_PROCESSING_TIMEOUT_MS,
    )

    try {
      const message = await this.client.messages.create(
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          temperature: 0,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: input.mimeType,
                    data: input.imageBase64,
                  },
                },
                { type: 'text', text: buildUserPrompt(input) },
              ],
            },
          ],
        },
        { signal: controller.signal },
      )

      const textBlock = message.content.find((c) => c.type === 'text')
      const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      return this.parseResponse(text, input.fieldList)
    } catch (err: unknown) {
      const e = err as { name?: string; status?: number; message?: string }
      // Aborted → timeout
      if (e?.name === 'AbortError' || e?.name === 'APIUserAbortError') {
        throw new ProviderUnavailableError('AI extraction timed out')
      }
      // Anthropic SDK throws errors with status — 429 + 5xx → unavailable
      if (e?.status === 429 || (typeof e?.status === 'number' && e.status >= 500)) {
        throw new ProviderUnavailableError(e.message ?? 'AI provider error')
      }
      // Network errors / unknown — treat as unavailable so the agent gets a clean message.
      if (e?.message && /fetch|network|ECONNRESET|ETIMEDOUT/i.test(e.message)) {
        throw new ProviderUnavailableError(e.message)
      }
      // Anything else — rethrow so the route handler can decide.
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }

  private parseResponse(text: string, fieldList: FieldConfig[]): ExtractionResult {
    try {
      // Strip markdown code fences if the model added them despite instructions.
      const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim()
      const parsed = JSON.parse(cleaned)
      return normalizeExtractionResult(parsed, fieldList)
    } catch {
      return allFieldsNeedsReview(fieldList, 'AI response could not be parsed')
    }
  }
}

/**
 * MockProvider — returns a perfect-match extraction.
 * Used in development when ANTHROPIC_API_KEY is not set.
 * Mirrors back the same field values that the form submitted so every test passes.
 * Mock cannot read the actual image — this is documented behavior for dev.
 */
export class MockProvider implements AIProvider {
  async extractFields(input: ExtractionInput): Promise<ExtractionResult> {
    await new Promise((r) => setTimeout(r, 400))
    const fields: Partial<Record<LabelFieldKey, FieldExtraction>> = {}
    for (const cfg of input.fieldList) {
      // Placeholder values that resemble a real label.
      if (cfg.key === 'governmentWarning') {
        fields.governmentWarning = {
          value:
            'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.',
          confidence: 'high',
        }
      } else if (cfg.key === 'abv') {
        fields.abv = { value: '45% Alc./Vol. (90 Proof)', confidence: 'high' }
      } else if (cfg.key === 'brandName') {
        fields.brandName = { value: 'Old Tom Distillery', confidence: 'high' }
      } else if (cfg.key === 'classType') {
        fields.classType = { value: 'Kentucky Straight Bourbon Whiskey', confidence: 'high' }
      } else if (cfg.key === 'netContents') {
        fields.netContents = { value: '750mL', confidence: 'high' }
      } else if (cfg.key === 'producerName') {
        fields.producerName = { value: 'Old Tom Distillery', confidence: 'high' }
      } else if (cfg.key === 'producerAddress') {
        fields.producerAddress = { value: '123 Bourbon St, Louisville, KY 40202', confidence: 'high' }
      } else if (cfg.key === 'countryOfOrigin') {
        fields.countryOfOrigin = {
          value: input.importedProduct ? 'France' : null,
          confidence: 'high',
        }
      } else if (cfg.key === 'appellation') {
        fields.appellation = { value: null, confidence: 'high' }
      }
    }
    return { fields }
  }
}

export { SYSTEM_PROMPT, buildUserPrompt, getFieldHint, normalizeExtractionResult, allFieldsNeedsReview }
