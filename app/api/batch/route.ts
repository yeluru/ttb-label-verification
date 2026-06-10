import { NextRequest } from 'next/server'
import { processSingleLabel, UnreadableImageError } from '../verify/route'
import {
  BatchResultEvent,
  BatchSummary,
  BeverageType,
  LabelFormData,
  ProviderUnavailableError,
} from '@/lib/types'

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

export async function POST(request: NextRequest) {
  const formData = await request.formData()
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
    formDataArray = typeof raw === 'string' ? JSON.parse(raw) : []
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

      const tasks = files.map(async (file, index) => {
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
      })

      const settled = await Promise.allSettled(tasks)

      const summary: BatchSummary = {
        total: files.length,
        pass: 0,
        flag: 0,
        needsReview: 0,
        errors: 0,
      }
      for (const s of settled) {
        if (s.status === 'fulfilled' && s.value.ok && s.value.result) {
          const o = s.value.result.overall
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
