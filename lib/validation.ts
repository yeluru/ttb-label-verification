import type { BeverageType, LabelFieldKey, LabelFormData } from './types'
import { getApplicableFields } from './beverage-fields'

const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
])

const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.pdf']

export function isAcceptedFile(file: File | null): boolean {
  if (!file) return false
  const name = file.name.toLowerCase()
  const extOk = ACCEPTED_EXT.some((e) => name.endsWith(e))
  const typeOk = !file.type || ACCEPTED_MIME.has(file.type.toLowerCase())
  return extOk && typeOk
}

export interface ValidationResult {
  ok: boolean
  missing: LabelFieldKey[]
}

/**
 * Validates a form payload against beverage-type rules.
 * Required fields per FR-05 must be non-empty. Conditional/optional fields are allowed to be blank.
 */
export function validateFormData(
  beverageType: BeverageType,
  formData: Partial<LabelFormData>,
): ValidationResult {
  const fields = getApplicableFields(beverageType)
  const missing: LabelFieldKey[] = []

  for (const f of fields) {
    if (f.required === 'optional' || f.required === 'conditional') continue
    const v = (formData[f.key] ?? '').toString().trim()
    if (!v) missing.push(f.key)
  }

  return { ok: missing.length === 0, missing }
}
