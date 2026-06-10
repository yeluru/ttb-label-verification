'use client'

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { BeverageTypeSelector } from '@/components/BeverageTypeSelector'
import { FileDropZone } from '@/components/FileDropZone'
import { LoadSampleSelector } from '@/components/LoadSampleSelector'
import { VisualLimitationNotice } from '@/components/VisualLimitationNotice'
import { FieldResultRow } from '@/components/FieldResultRow'
import {
  BatchFormMap,
  BatchResultEvent,
  BatchResultMap,
  BatchStatus,
  BatchSummary,
  BeverageType,
  LabelFieldKey,
  LabelFormData,
  MockDataset,
} from '@/lib/types'
import { rasterizePdfFile } from '@/lib/pdf-preprocessor'
import { isAcceptedFile, validateFormData } from '@/lib/validation'
import { getApplicableFields } from '@/lib/beverage-fields'
import { TTB_STANDARD_WARNING_TEXT } from '@/lib/field-comparison'

interface UploadedFile {
  id: string
  file: File
}

function emptyFormData(): LabelFormData {
  return {
    brandName: '',
    classType: '',
    abv: '',
    netContents: '',
    producerName: '',
    producerAddress: '',
    governmentWarning: '',
  }
}

export default function BatchVerifyPage() {
  const [beverageType, setBeverageType] = useState<BeverageType>('spirits')
  const [isImport, setIsImport] = useState(false)
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [formMap, setFormMap] = useState<BatchFormMap>({})
  const [batchStatus, setBatchStatus] = useState<BatchStatus>('idle')
  const [results, setResults] = useState<BatchResultMap>({})
  const [completed, setCompleted] = useState(0)
  const [summary, setSummary] = useState<BatchSummary>({
    total: 0,
    pass: 0,
    flag: 0,
    needsReview: 0,
    errors: 0,
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [rowErrors, setRowErrors] = useState<Record<string, Set<LabelFieldKey>>>({})

  const addFiles = useCallback((files: File[]) => {
    const next: UploadedFile[] = files
      .filter((f) => isAcceptedFile(f))
      .map((f) => ({ id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`, file: f }))
    setUploads((prev) => [...prev, ...next])
    setFormMap((prev) => {
      const updated = { ...prev }
      for (const u of next) updated[u.id] = emptyFormData()
      return updated
    })
  }, [])

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
    setFormMap((prev) => {
      const cp = { ...prev }
      delete cp[id]
      return cp
    })
  }

  const updateRow = (id: string, key: LabelFieldKey, value: string) => {
    setFormMap((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyFormData()), [key]: value },
    }))
    setRowErrors((prev) => {
      const set = prev[id]
      if (!set || !set.has(key)) return prev
      const next = new Set(set)
      next.delete(key)
      return { ...prev, [id]: next }
    })
  }

  const fillColumn = (key: LabelFieldKey) => {
    if (uploads.length === 0) return
    const firstId = uploads[0].id
    const value = (formMap[firstId]?.[key] ?? '') as string
    if (!value) return
    setFormMap((prev) => {
      const cp = { ...prev }
      for (const u of uploads) {
        cp[u.id] = { ...(cp[u.id] ?? emptyFormData()), [key]: value }
      }
      return cp
    })
  }

  const handleLoadSample = (ds: MockDataset) => {
    setBeverageType(ds.beverageType)
    setIsImport(ds.isImport)
    setFormMap((prev) => {
      const cp = { ...prev }
      for (const u of uploads) cp[u.id] = { ...ds.formData }
      return cp
    })
  }

  const handleInsertWarning = () => {
    setFormMap((prev) => {
      const cp = { ...prev }
      for (const u of uploads) {
        cp[u.id] = {
          ...(cp[u.id] ?? emptyFormData()),
          governmentWarning: TTB_STANDARD_WARNING_TEXT,
        }
      }
      return cp
    })
  }

  const newBatch = () => {
    setUploads([])
    setFormMap({})
    setResults({})
    setSummary({ total: 0, pass: 0, flag: 0, needsReview: 0, errors: 0 })
    setCompleted(0)
    setBatchStatus('idle')
    setExpanded(new Set())
    setRowErrors({})
  }

  const fields = useMemo(
    () => getApplicableFields(beverageType, isImport),
    [beverageType, isImport],
  )

  const validateAll = (): boolean => {
    let ok = true
    const errs: Record<string, Set<LabelFieldKey>> = {}
    for (const u of uploads) {
      const v = validateFormData(beverageType, isImport, formMap[u.id] ?? {})
      if (!v.ok) {
        ok = false
        errs[u.id] = new Set(v.missing)
      }
    }
    setRowErrors(errs)
    return ok
  }

  const handleVerifyBatch = async () => {
    if (uploads.length === 0) return
    if (!validateAll()) return

    setBatchStatus('loading')
    setResults({})
    setSummary({
      total: uploads.length,
      pass: 0,
      flag: 0,
      needsReview: 0,
      errors: 0,
    })
    setCompleted(0)

    try {
      // Rasterize PDFs client-side in parallel.
      const prepared = await Promise.all(
        uploads.map(async (u) => ({
          id: u.id,
          file: await rasterizePdfFile(u.file),
          originalName: u.file.name,
        })),
      )

      const fd = new FormData()
      fd.append('beverageType', beverageType)
      fd.append('isImport', String(isImport))
      const formDataArray: LabelFormData[] = prepared.map(
        (p) => formMap[p.id] ?? emptyFormData(),
      )
      for (const p of prepared) fd.append('files', p.file)
      fd.append('formData', JSON.stringify(formDataArray))

      const res = await fetch('/api/batch', { method: 'POST', body: fd })
      if (!res.ok || !res.body) {
        throw new Error('Batch request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      const idByFilename = new Map<string, string>()
      prepared.forEach((p) => idByFilename.set(p.file.name, p.id))

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let idx
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const lines = raw.split('\n')
          let eventName = 'message'
          let dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
          }
          if (!dataStr) continue
          try {
            const data = JSON.parse(dataStr)
            if (eventName === 'result' || eventName === 'error') {
              const ev: BatchResultEvent = data
              const id = idByFilename.get(ev.filename)
              if (id) {
                setResults((prev) => ({ ...prev, [id]: ev }))
                setCompleted((c) => c + 1)
                setSummary((s) => {
                  const ns = { ...s }
                  if (ev.result) {
                    if (ev.result.overall === 'PASS') ns.pass++
                    else if (ev.result.overall === 'FLAG') ns.flag++
                    else ns.needsReview++
                  } else if (ev.error) {
                    ns.errors++
                  }
                  return ns
                })
              }
            } else if (eventName === 'done') {
              setSummary((s) => ({ ...s, ...data }))
              setBatchStatus('done')
            }
          } catch (e) {
            console.error('SSE parse error', e, dataStr)
          }
        }
      }
      setBatchStatus('done')
    } catch (e) {
      console.error('Batch error', e)
      setBatchStatus('done')
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const showResults = batchStatus !== 'idle'

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[#1E293B]">Batch Label Verification</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Upload multiple labels, fill the form rows, and process them in parallel.
        </p>
      </header>

      {/* Configuration card */}
      <section
        className="bg-white border border-[#E2E8F0] rounded-md p-4"
        aria-labelledby="batch-config"
      >
        <h2 id="batch-config" className="sr-only">Batch configuration</h2>
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="lg:w-[320px]">
            <label className="block text-xs font-medium uppercase tracking-wide text-[#64748B] mb-1.5">
              Beverage Type
            </label>
            <BeverageTypeSelector value={beverageType} onChange={setBeverageType} />
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none lg:pb-1.5">
            <input
              type="checkbox"
              checked={isImport}
              onChange={(e) => setIsImport(e.target.checked)}
              className="h-4 w-4 rounded border-[#E2E8F0] text-[#1B4F8A] focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-sm text-[#1E293B]">Imported product</span>
          </label>
          <div className="lg:w-[320px] lg:ml-auto">
            <LoadSampleSelector
              onLoad={handleLoadSample}
              onInsertWarning={handleInsertWarning}
            />
          </div>
        </div>
      </section>

      {/* File upload */}
      <section className="bg-white border border-[#E2E8F0] rounded-md p-4">
        <FileDropZone
          file={null}
          onFile={(f) => f && addFiles([f])}
          multiple
          onFiles={addFiles}
        />
        {uploads.length > 0 && (
          <p className="mt-2 text-xs text-[#64748B]">
            {uploads.length} {uploads.length === 1 ? 'file' : 'files'} selected
          </p>
        )}
      </section>

      {/* Inline form table or results */}
      {uploads.length > 0 && (
        <section className="bg-white border border-[#E2E8F0] rounded-md overflow-hidden">
          {showResults && (
            <div
              role="status"
              aria-live="polite"
              className="sticky top-14 z-10 bg-white border-b border-[#E2E8F0] px-4 py-3 flex flex-wrap items-center gap-3"
            >
              <SummaryPill color="pass" count={summary.pass} label="PASS" />
              <SummaryPill color="flag" count={summary.flag} label="FLAG" />
              <SummaryPill color="review" count={summary.needsReview} label="NEEDS REVIEW" />
              {summary.errors > 0 && (
                <SummaryPill color="flag" count={summary.errors} label="ERROR" />
              )}
              <div className="ml-auto text-sm text-[#64748B]">
                {completed} of {summary.total} complete
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th
                    scope="col"
                    className="text-left text-xs font-medium uppercase tracking-wide text-[#64748B] px-3 py-2 w-[160px]"
                  >
                    File
                  </th>
                  {!showResults &&
                    fields.map((f) => (
                      <th
                        scope="col"
                        key={f.key}
                        className="text-left text-xs font-medium uppercase tracking-wide text-[#64748B] px-2 py-2 min-w-[140px]"
                      >
                        <div>{f.label}</div>
                        <button
                          type="button"
                          onClick={() => fillColumn(f.key)}
                          className="text-[11px] text-[#1B4F8A] hover:underline mt-0.5 normal-case font-normal cursor-pointer"
                        >
                          ↓ Fill all
                        </button>
                      </th>
                    ))}
                  {showResults && (
                    <th
                      scope="col"
                      className="text-left text-xs font-medium uppercase tracking-wide text-[#64748B] px-3 py-2"
                    >
                      Result
                    </th>
                  )}
                  <th scope="col" className="w-10" />
                </tr>
              </thead>
              <tbody>
                {uploads.map((u, idx) => {
                  const row = formMap[u.id] ?? emptyFormData()
                  const ev = results[u.id]
                  const isExpanded = expanded.has(u.id)
                  const rowErrSet = rowErrors[u.id]
                  return (
                    <tr
                      key={u.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'} border-b border-[#E2E8F0] ${rowErrSet && rowErrSet.size > 0 ? 'border-l-2 border-l-[#DC2626]' : ''}`}
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="text-[13px] font-medium text-[#1E293B] truncate max-w-[180px]" title={u.file.name}>
                          {u.file.name}
                        </div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5 uppercase">
                          {u.file.name.split('.').pop()}
                        </div>
                      </td>

                      {!showResults &&
                        fields.map((f) => {
                          const hasError = rowErrSet?.has(f.key) ?? false
                          const value = (row[f.key] ?? '') as string
                          const borderClass = hasError ? 'border-[#DC2626]' : 'border-[#E2E8F0]'
                          if (f.key === 'governmentWarning' || f.key === 'producerAddress') {
                            return (
                              <td key={f.key} className="px-2 py-2 align-top">
                                <textarea
                                  value={value}
                                  onChange={(e) => updateRow(u.id, f.key, e.target.value)}
                                  rows={2}
                                  className={`w-full min-w-[160px] text-[13px] rounded-md border ${borderClass} px-2 py-1.5 focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100`}
                                  aria-invalid={hasError}
                                />
                              </td>
                            )
                          }
                          return (
                            <td key={f.key} className="px-2 py-2 align-top">
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateRow(u.id, f.key, e.target.value)}
                                className={`w-full h-8 text-[13px] rounded-md border ${borderClass} px-2 focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100`}
                                aria-invalid={hasError}
                              />
                            </td>
                          )
                        })}

                      {showResults && (
                        <td className="px-3 py-2 align-top">
                          <ResultCell ev={ev} batchStatus={batchStatus} />
                          {isExpanded && ev?.result && (
                            <div className="mt-3 space-y-3">
                              <VisualLimitationNotice />
                              <div className="border border-[#E2E8F0] rounded-md overflow-hidden bg-white">
                                {ev.result.fields.map((fr) => (
                                  <FieldResultRow key={fr.fieldKey} result={fr} />
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      )}

                      <td className="px-2 py-2 align-top text-right">
                        {!showResults ? (
                          <button
                            type="button"
                            aria-label={`Remove ${u.file.name}`}
                            onClick={() => removeUpload(u.id)}
                            className="text-[#94A3B8] hover:text-[#DC2626] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] rounded-sm cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        ) : ev?.result ? (
                          <button
                            type="button"
                            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                            onClick={() => toggleExpand(u.id)}
                            className="text-[#94A3B8] hover:text-[#1B4F8A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] rounded-sm cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" aria-hidden />
                            ) : (
                              <ChevronDown className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {batchStatus !== 'done' && uploads.length > 0 && (
          <button
            type="button"
            onClick={handleVerifyBatch}
            disabled={batchStatus === 'loading'}
            className="h-10 px-4 rounded-md bg-[#1B4F8A] hover:bg-[#163F6E] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B4F8A] cursor-pointer"
          >
            {batchStatus === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Processing… ({completed} of {uploads.length} complete)
              </>
            ) : (
              `Verify Batch (${uploads.length} ${uploads.length === 1 ? 'label' : 'labels'})`
            )}
          </button>
        )}
        {batchStatus === 'done' && (
          <button
            type="button"
            onClick={newBatch}
            className="h-9 px-4 rounded-md border border-[#1B4F8A] text-[#1B4F8A] text-sm font-medium hover:bg-[#EFF6FF] inline-flex items-center gap-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] cursor-pointer ml-auto"
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> New Batch
          </button>
        )}
      </div>
    </div>
  )
}

function SummaryPill({
  color,
  count,
  label,
}: {
  color: 'pass' | 'flag' | 'review'
  count: number
  label: string
}) {
  const styles =
    color === 'pass'
      ? 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/30'
      : color === 'flag'
        ? 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30'
        : 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/30'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      <span>{count}</span>
      <span>{label}</span>
    </span>
  )
}

function ResultCell({
  ev,
  batchStatus,
}: {
  ev: BatchResultEvent | undefined
  batchStatus: BatchStatus
}) {
  if (!ev) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
        <Loader2
          className={`h-4 w-4 ${batchStatus === 'loading' ? 'animate-spin' : ''} text-[#94A3B8]`}
          aria-hidden
        />
        Processing…
      </div>
    )
  }
  if (ev.error) {
    return (
      <div className="flex items-start gap-2 text-sm text-[#DC2626]">
        <AlertCircle className="h-4 w-4 mt-0.5" aria-hidden /> {ev.error}
      </div>
    )
  }
  const r = ev.result
  if (!r) return null
  if (r.overall === 'PASS') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#16A34A]">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        <span className="font-semibold">PASS</span>
        <span className="text-[#64748B]">— All {r.fields.length} fields matched</span>
      </div>
    )
  }
  if (r.overall === 'FLAG') {
    const firstFlag = r.fields.find((f) => f.status === 'flag')
    return (
      <div className="flex items-start gap-2 text-sm text-[#DC2626]">
        <XCircle className="h-4 w-4 mt-0.5" aria-hidden />
        <div>
          <span className="font-semibold">FLAG</span>
          {firstFlag && (
            <span className="text-[#1E293B]"> — {firstFlag.reason ?? firstFlag.fieldName}</span>
          )}
        </div>
      </div>
    )
  }
  const firstReview = r.fields.find((f) => f.status === 'needs-review')
  return (
    <div className="flex items-start gap-2 text-sm text-[#D97706]">
      <HelpCircle className="h-4 w-4 mt-0.5" aria-hidden />
      <div>
        <span className="font-semibold">NEEDS REVIEW</span>
        {firstReview && (
          <span className="text-[#1E293B]">
            {' '}
            — {firstReview.reason ?? firstReview.fieldName}
          </span>
        )}
      </div>
    </div>
  )
}
