// Shared TypeScript types — single source of truth for the application.
// Imported by every other module. No runtime code lives here.

export type BeverageType = 'spirits' | 'wine' | 'beer'

export type FieldStatus = 'pass' | 'flag' | 'needs-review'

export type OverallStatus = 'PASS' | 'FLAG' | 'NEEDS REVIEW'

export type UIStatus = 'idle' | 'loading' | 'done' | 'error'

export type BatchStatus = 'idle' | 'loading' | 'done'

export type MatchType = 'fuzzy' | 'numeric' | 'exact'

export type Confidence = 'high' | 'low'

export interface LabelFormData {
  brandName: string
  classType: string
  abv?: string
  netContents: string
  producerName: string
  producerAddress: string
  countryOfOrigin?: string
  appellation?: string
  governmentWarning: string
}

export type LabelFieldKey = keyof LabelFormData

export interface FieldConfig {
  key: LabelFieldKey
  label: string
  matchType: MatchType
  required: 'always' | 'if-import' | 'conditional' | 'optional'
  notes?: string
}

export interface FieldExtraction {
  value: string | null
  confidence: Confidence
  reason?: string
}

export interface ExtractionResult {
  fields: Partial<Record<LabelFieldKey, FieldExtraction>>
}

export interface FieldResult {
  fieldName: string
  fieldKey: LabelFieldKey
  status: FieldStatus
  submittedValue: string
  extractedValue: string | null
  reason?: string | null
}

export interface VerificationResult {
  overall: OverallStatus
  fields: FieldResult[]
  processingMs: number
}

export interface BatchResultEvent {
  filename: string
  index: number
  result?: VerificationResult
  error?: string
}

export interface BatchSummary {
  total: number
  pass: number
  flag: number
  needsReview: number
  errors: number
}

export type BatchFormMap = Record<string, LabelFormData>
export type BatchResultMap = Record<string, BatchResultEvent>

export interface SingleVerifyState {
  selectedFile: File | null
  formData: Partial<LabelFormData>
  beverageType: BeverageType
  isImport: boolean
  result: VerificationResult | null
  status: UIStatus
  errorMessage: string | null
}

export interface BatchVerifyState {
  uploadedFiles: File[]
  batchFormData: BatchFormMap
  beverageType: BeverageType
  isImport: boolean
  batchResults: BatchResultMap
  completedCount: number
  summary: BatchSummary
  batchStatus: BatchStatus
}

export interface MockDataset {
  label: string
  displayName: string
  beverageType: BeverageType
  isImport: boolean
  formData: LabelFormData
  expectedOverall: OverallStatus
  expectedFlags?: LabelFieldKey[]
}

export interface ExtractionInput {
  imageBase64: string
  mimeType: 'image/png' | 'image/jpeg'
  beverageType: BeverageType
  importedProduct: boolean
  fieldList: FieldConfig[]
}

export class ProviderUnavailableError extends Error {
  constructor(message = 'AI provider unavailable') {
    super(message)
    this.name = 'ProviderUnavailableError'
  }
}
