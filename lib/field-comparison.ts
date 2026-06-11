import {
  BeverageType,
  ExtractionResult,
  FieldConfig,
  FieldResult,
  FieldStatus,
  LabelFieldKey,
  LabelFormData,
  OverallStatus,
  VerificationResult,
} from './types'
import { getApplicableFields } from './beverage-fields'

// TTB-mandated government warning text. The label must contain this exact string
// (after collapsing line breaks to spaces) to pass.
export const TTB_STANDARD_WARNING_TEXT =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink ' +
  'alcoholic beverages during pregnancy because of the risk of birth defects. ' +
  '(2) Consumption of alcoholic beverages impairs your ability to drive a car or operate ' +
  'machinery, and may cause health problems.'

// Anthropic recommended max image dimension for vision input (optimized from 1568 to 600 for speed).
export const MAX_IMAGE_DIMENSION_PX = 600



// Vercel function timeout budget per label call.
export const LABEL_PROCESSING_TIMEOUT_MS = 8000

/**
 * Fuzzy normalize: lowercase, strip punctuation (keep decimal points), collapse whitespace, trim.
 * Used for brand name, class/type, net contents, producer name, producer address, country of origin, appellation.
 */
export function fuzzyNormalize(value: string): string {
  return value
    .toLowerCase()
    // Strip all punctuation except periods. Keep alphanumerics, periods, whitespace.
    .replace(/[^\p{L}\p{N}.\s]/gu, '')
    // Collapse all whitespace runs to a single space.
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Government warning normalization: collapse line breaks/whitespace; preserve case + punctuation.
 */
export function warningNormalize(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract the first numeric value from a string.
 * "45% Alc./Vol. (90 Proof)" → 45
 * "5.2%" → 5.2
 * Returns NaN if no number is present.
 */
export function extractAbvNumber(value: string): number {
  const match = value.match(/\d+(?:\.\d+)?/)
  return match ? parseFloat(match[0]) : NaN
}

interface CompareSingleArgs {
  config: FieldConfig
  extractedValue: string | null
  extractedConfidence: 'high' | 'low'
  extractedReason: string | undefined
  submittedValue: string
}

function compareSingle({
  config,
  extractedValue,
  extractedConfidence,
  extractedReason,
  submittedValue,
}: CompareSingleArgs): FieldResult {
  const fieldName = config.label
  const fieldKey = config.key
  const trimmedSubmitted = (submittedValue ?? '').trim()
  const hasSubmitted = trimmedSubmitted.length > 0
  const hasExtracted = extractedValue !== null && extractedValue.trim().length > 0
  const bothAbsentPass = config.notes === 'both-absent-pass'

  const buildResult = (
    status: FieldStatus,
    reason?: string | null,
  ): FieldResult => ({
    fieldName,
    fieldKey,
    status,
    submittedValue: trimmedSubmitted,
    extractedValue,
    reason: reason ?? null,
  })

  // 1. AI uncertainty always trumps everything else — surface as needs-review.
  if (extractedConfidence === 'low') {
    return buildResult(
      'needs-review',
      extractedReason ??
        `AI could not confidently extract the ${fieldName.toLowerCase()} from the label.`,
    )
  }

  // 2. Optional-field both-absent logic (wine ABV, beer ABV, wine appellation).
  if (bothAbsentPass) {
    if (!hasSubmitted && !hasExtracted) {
      return buildResult('pass')
    }
    if (hasSubmitted && !hasExtracted) {
      return buildResult(
        'flag',
        `Form provides ${fieldName.toLowerCase()} but the label does not show it.`,
      )
    }
    if (!hasSubmitted && hasExtracted) {
      return buildResult(
        'flag',
        `Label shows ${fieldName.toLowerCase()} (${extractedValue}) but the form is blank.`,
      )
    }
    // fall through — both present → normal comparison
  }

  // 3. Required-field absent on the label → flag (not needs-review; high-confidence absence).
  if (!hasExtracted) {
    return buildResult(
      'flag',
      `${fieldName} could not be found on the label.`,
    )
  }

  // 4. Required-field absent on the form → flag.
  if (!hasSubmitted) {
    return buildResult(
      'flag',
      `Form is missing ${fieldName.toLowerCase()}; label shows "${extractedValue}".`,
    )
  }

  // 5. Both present — apply match algorithm.
  switch (config.matchType) {
    case 'fuzzy': {
      const a = fuzzyNormalize(extractedValue!)
      const b = fuzzyNormalize(trimmedSubmitted)
      if (a === b) return buildResult('pass')
      return buildResult(
        'flag',
        `Label shows "${extractedValue}"; form says "${trimmedSubmitted}".`,
      )
    }

    case 'numeric': {
      const a = extractAbvNumber(extractedValue!)
      const b = extractAbvNumber(trimmedSubmitted)
      if (Number.isNaN(a) || Number.isNaN(b)) {
        return buildResult(
          'flag',
          `Could not interpret ABV values — label "${extractedValue}", form "${trimmedSubmitted}".`,
        )
      }
      if (a === b) return buildResult('pass')
      return buildResult(
        'flag',
        `Label shows ${a}%, form says ${b}%.`,
      )
    }

    case 'exact': {
      const extractedNorm = warningNormalize(extractedValue!)
      const standardNorm = warningNormalize(TTB_STANDARD_WARNING_TEXT)
      const submittedNorm = warningNormalize(trimmedSubmitted)

      // Government warning is compared first against the TTB standard text,
      // then optionally against what the agent entered. Mismatch with the
      // TTB standard is the binding flag — that's the regulatory requirement.
      if (extractedNorm === standardNorm) {
        // Label matches the standard. If the form value also matches, pass.
        // If the agent typed something different in the form, the label is
        // still compliant — pass on the label match (FR-04d/e).
        return buildResult('pass')
      }

      // Try to give the most specific reason.
      const headerMatch = /^GOVERNMENT WARNING:/.test(extractedValue!.trim())
      if (!headerMatch) {
        return buildResult(
          'flag',
          'Government warning header is missing or not in the required "GOVERNMENT WARNING:" form.',
        )
      }

      // Same header, different wording somewhere downstream.
      // If the submitted form value matches the standard but the label doesn't, it's a label problem.
      if (submittedNorm === standardNorm) {
        return buildResult(
          'flag',
          'Government warning on the label does not match the TTB standard text exactly.',
        )
      }

      return buildResult(
        'flag',
        'Government warning text does not match the TTB standard exactly.',
      )
    }
  }
}

/**
 * Compare extraction result against the agent-submitted form data.
 * Returns the full VerificationResult including the overall verdict.
 */
export function compareFields(
  extraction: ExtractionResult,
  formData: Partial<LabelFormData>,
  beverageType: BeverageType,
  isImport: boolean,
): VerificationResult {
  const fields = getApplicableFields(beverageType, isImport)
  const results: FieldResult[] = []

  for (const config of fields) {
    const extracted = extraction.fields?.[config.key]
    const submittedValue = (formData[config.key] ?? '') as string

    if (!extracted) {
      // AI never returned this field — treat as needs-review with a clear reason.
      results.push({
        fieldName: config.label,
        fieldKey: config.key,
        status: 'needs-review',
        submittedValue,
        extractedValue: null,
        reason: `AI did not return a result for ${config.label.toLowerCase()}.`,
      })
      continue
    }

    results.push(
      compareSingle({
        config,
        extractedValue: extracted.value,
        extractedConfidence: extracted.confidence,
        extractedReason: extracted.reason,
        submittedValue,
      }),
    )
  }

  return {
    overall: deriveOverall(results),
    fields: results,
    processingMs: 0, // set by caller
  }
}

export function deriveOverall(results: FieldResult[]): OverallStatus {
  let hasFlag = false
  let hasReview = false
  for (const r of results) {
    if (r.status === 'flag') hasFlag = true
    else if (r.status === 'needs-review') hasReview = true
  }
  if (hasFlag) return 'FLAG'
  if (hasReview) return 'NEEDS REVIEW'
  return 'PASS'
}

/**
 * If ALL fields return null + low confidence, the image is effectively unreadable.
 * Used by API route to decide whether to return 422 unreadable.
 */
export function isUnreadable(extraction: ExtractionResult): boolean {
  const entries = Object.entries(extraction.fields ?? {})
  if (entries.length === 0) return true

  // If the reason for low confidence is "AI response could not be parsed",
  // it is a system/parsing error, not an unreadable image.
  // So we should return false so that it returns 200 with needs-review fields.
  const isParseError = entries.some(([, ex]) => ex?.reason === 'AI response could not be parsed')
  if (isParseError) return false

  return entries.every(
    ([, ex]) => !ex || (ex.value === null && ex.confidence === 'low'),
  )
}

export function buildSummary(results: { ok: boolean; result?: VerificationResult }[]) {
  let pass = 0
  let flag = 0
  let needsReview = 0
  let errors = 0
  for (const r of results) {
    if (!r.ok || !r.result) {
      errors++
      continue
    }
    if (r.result.overall === 'PASS') pass++
    else if (r.result.overall === 'FLAG') flag++
    else needsReview++
  }
  return { total: results.length, pass, flag, needsReview, errors }
}
