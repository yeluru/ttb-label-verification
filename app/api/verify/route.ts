import { NextRequest, NextResponse } from 'next/server'
import { getProvider } from '@/lib/provider-factory'
import { BEVERAGE_FIELDS } from '@/lib/beverage-fields'
import { fileToBuffer, resizeForVision } from '@/lib/image-preprocessor'
import { compareFields, isUnreadable } from '@/lib/field-comparison'
import { isAcceptedFile, validateFormData } from '@/lib/validation'
import {
  BeverageType,
  ExtractionInput,
  LabelFieldKey,
  LabelFormData,
  ProviderUnavailableError,
} from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function parseFormFields(fd: FormData): Partial<LabelFormData> {
  const keys: LabelFieldKey[] = [
    'brandName',
    'classType',
    'abv',
    'netContents',
    'producerName',
    'producerAddress',
    'countryOfOrigin',
    'appellation',
    'governmentWarning',
  ]
  const out: Partial<LabelFormData> = {}
  for (const k of keys) {
    const v = fd.get(k)
    if (typeof v === 'string') {
      out[k] = v
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const beverageTypeRaw = formData.get('beverageType')
    const isImportRaw = formData.get('isImport')

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'validation',
          message: 'A label image file is required.',
          fields: ['file'],
        },
        { status: 400 },
      )
    }

    if (!isAcceptedFile(file)) {
      return NextResponse.json(
        {
          error: 'validation',
          message: 'Unsupported file type. Please upload a JPG, PNG, or PDF.',
          fields: ['file'],
        },
        { status: 400 },
      )
    }

    if (beverageTypeRaw !== 'spirits' && beverageTypeRaw !== 'wine' && beverageTypeRaw !== 'beer') {
      return NextResponse.json(
        {
          error: 'validation',
          message: 'Invalid beverage type.',
          fields: ['beverageType'],
        },
        { status: 400 },
      )
    }

    const beverageType: BeverageType = beverageTypeRaw
    const submittedFields = parseFormFields(formData)

    const validation = validateFormData(beverageType, submittedFields)
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: 'validation',
          message: 'Required fields are missing.',
          fields: validation.missing,
        },
        { status: 400 },
      )
    }

    const result = await processSingleLabel(file, beverageType, submittedFields)
    result.processingMs = Date.now() - start
    return NextResponse.json(result)
  } catch (err: unknown) {
    if (err instanceof ProviderUnavailableError) {
      console.error('[/api/verify] provider unavailable', err.message)
      return NextResponse.json(
        {
          error: 'unavailable',
          message:
            'Verification service is temporarily unavailable. Please try again.',
        },
        { status: 503 },
      )
    }
    if (err instanceof UnreadableImageError) {
      return NextResponse.json(
        {
          error: 'unreadable',
          message: 'Unable to read this image. Please upload a clearer version.',
        },
        { status: 422 },
      )
    }
    console.error('[/api/verify] unhandled', err)
    return NextResponse.json(
      {
        error: 'internal',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 },
    )
  }
}

export class UnreadableImageError extends Error {
  constructor() {
    super('unreadable')
    this.name = 'UnreadableImageError'
  }
}

export async function processSingleLabel(
  file: File,
  beverageType: BeverageType,
  submittedFields: Partial<LabelFormData>,
) {
  // 1. Read file bytes
  const buffer = await fileToBuffer(file)

  // 2. Server-side resize (PDFs must already be rasterized client-side to PNG)
  let imageBase64: string
  let mimeType: 'image/png' | 'image/jpeg'
  try {
    const resized = await resizeForVision(buffer)
    imageBase64 = resized.buffer.toString('base64')
    mimeType = resized.mimeType
  } catch (err) {
    console.error('[processSingleLabel] image resize failed', err)
    throw new UnreadableImageError()
  }

  // 3. Build extraction input from field config — single source of truth
  const fieldList = BEVERAGE_FIELDS[beverageType]
  const extractionInput: ExtractionInput = {
    imageBase64,
    mimeType,
    beverageType,
    importedProduct: false,
    fieldList,
    filename: file.name,
    submittedFields,
  }

  // 4. Run AI extraction
  const provider = getProvider()
  const extraction = await provider.extractFields(extractionInput)

  // 5. Reject fully unreadable images
  if (isUnreadable(extraction)) {
    throw new UnreadableImageError()
  }

  // 6. Compare fields
  return compareFields(extraction, submittedFields, beverageType)
}
