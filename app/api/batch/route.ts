import { NextRequest } from 'next/server'
import { processSingleLabel, UnreadableImageError } from '../verify/route'
import {
  BatchResultEvent,
  BatchSummary,
  BeverageType,
  LabelFieldKey,
  LabelFormData,
  ProviderUnavailableError,
} from '@/lib/types'
import { isAcceptedFile, validateFormData } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function encodeEvent(event: string, data: object): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  )
}

function errorMessageFor(err: unknown): string {
  if (err instanceof UnreadableImageError) {
    return 'Unable to read this image. Please upload a clearer version.'
  }
  if (err instanceof ProviderUnavailableError) {
    return 'Verification service is temporarily unavailable. Please try again.'
  }
  if (err instanceof Error && err.message) return err.message
  return 'An unexpected error occurred while processing this label.'
}

async function runWithConcurrencyLimit<T>(
  concurrencyLimit: number,
  items: any[],
  fn: (item: any, index: number) => Promise<T>,
): Promise<T[]> {
  const results: Promise<T>[] = []
  const executing: Promise<any>[] = []

  for (let i = 0; i < items.length; i++) {
    const p = Promise.resolve().then(() => fn(items[i], i))
    results.push(p)

    if (concurrencyLimit < items.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= concurrencyLimit) {
        await Promise.race(executing)
      }
    }
  }

  return Promise.all(results)
}

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new Response(
      JSON.stringify({
        error: 'validation',
        message: 'Unable to read the uploaded batch.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  const beverageTypeRaw = formData.get('beverageType')
  const isImport = formData.get('isImport') === 'true'

  if (beverageTypeRaw !== 'spirits' && beverageTypeRaw !== 'wine' && beverageTypeRaw !== 'beer') {
    return new Response(
      JSON.stringify({ error: 'validation', message: 'Invalid beverage type.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  const beverageType: BeverageType = beverageTypeRaw

  const files = formData
    .getAll('files')
    .filter((f): f is File => f instanceof File)

  let formDataArray: LabelFormData[] = []
  try {
    const raw = formData.get('formData')
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : []
    formDataArray = Array.isArray(parsed) ? parsed : []
  } catch {
    return new Response(
      JSON.stringify({
        error: 'validation',
        message: 'formData must be a JSON array of label form objects.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (files.length === 0 || formDataArray.length !== files.length) {
    return new Response(
      JSON.stringify({
        error: 'validation',
        message:
          'files and formData are required and must have matching lengths.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const invalidFileIndex = files.findIndex((file) => !isAcceptedFile(file))
  if (invalidFileIndex !== -1) {
    return new Response(
      JSON.stringify({
        error: 'validation',
        message: 'Unsupported file type. Please upload a JPG, PNG, or PDF.',
        fields: [`files.${invalidFileIndex}`],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const rowValidationErrors: { index: number; fields: LabelFieldKey[] }[] = []
  formDataArray.forEach((row, index) => {
    const validation = validateFormData(beverageType, isImport, row ?? {})
    if (!validation.ok) {
      rowValidationErrors.push({ index, fields: validation.missing })
    }
  })

  if (rowValidationErrors.length > 0) {
    return new Response(
      JSON.stringify({
        error: 'validation',
        message: 'Required fields are missing in one or more batch rows.',
        rows: rowValidationErrors,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: object) => {
        try {
          controller.enqueue(encodeEvent(event, data))
        } catch {
          // controller closed — ignore
        }
      }

      // Heartbeat to keep proxies from buffering
      send('open', { count: files.length })

      const tasks = async (file: File, index: number) => {
        const t0 = Date.now()
        try {
          const formFields = formDataArray[index]
          const result = await processSingleLabel(
            file,
            beverageType,
            isImport,
            formFields,
          )
          result.processingMs = Date.now() - t0
          const event: BatchResultEvent = {
            filename: file.name,
            index,
            result,
          }
          send('result', event)
          return { ok: true as const, result }
        } catch (err) {
          const event: BatchResultEvent = {
            filename: file.name,
            index,
            error: errorMessageFor(err),
          }
          send('error', event)
          return { ok: false as const, error: err }
        }
      }

      // Concurrency limit of 3 to avoid Anthropic rate limit exhaustion and timeouts
      const settled = await runWithConcurrencyLimit(3, files, tasks)

      const summary: BatchSummary = {
        total: files.length,
        pass: 0,
        flag: 0,
        needsReview: 0,
        errors: 0,
      }
      for (const s of settled) {
        if (s.ok && s.result) {
          const o = s.result.overall
          if (o === 'PASS') summary.pass++
          else if (o === 'FLAG') summary.flag++
          else summary.needsReview++
        } else {
          summary.errors++
        }
      }

      send('done', summary)
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
