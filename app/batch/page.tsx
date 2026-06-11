'use client'

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Files,
  HelpCircle,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { BeverageTypeSelector } from '@/components/BeverageTypeSelector'
import { FileDropZone } from '@/components/FileDropZone'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
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
import { loadSampleFile } from '@/lib/sample-loader'
import { MOCK_DATASETS } from '@/lib/mock-data'

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
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [sampleKey, setSampleKey] = useState<string>('')

  const addFiles = useCallback((files: File[]) => {
    const accepted = files.filter((f) => isAcceptedFile(f))
    const rejected = files.length - accepted.length
    setUploadError(
      rejected > 0
        ? `${rejected} unsupported file${rejected === 1 ? '' : 's'} skipped. Upload JPG, PNG, or PDF.`
        : null,
    )
    if (accepted.length === 0) return
    const next: UploadedFile[] = accepted.map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
    }))
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

  // Load one sample dataset and apply it to ALL existing uploaded rows.
  // Seed a representative demo batch based on beverage type
  const seedDemoBatch = async () => {
    setSeedingDemo(true)
    try {
      let keys = ['spirits-pass', 'spirits-abv-mismatch', 'spirits-degraded']
      if (beverageType === 'wine') {
        keys = ['wine-pass', 'wine-net-contents-mismatch', 'wine-brand-mismatch']
      } else if (beverageType === 'beer') {
        keys = ['beer-pass', 'beer-brand-mismatch', 'beer-warning-missing']
      }
      
      const datasets = keys
        .map((k) => MOCK_DATASETS.find((d) => d.label === k))
        .filter((d): d is MockDataset => !!d)
      const newUploads: UploadedFile[] = []
      const newForms: BatchFormMap = {}
      for (const ds of datasets) {
        try {
          const f = await loadSampleFile(ds)
          const id = `${ds.label}-${Math.random().toString(36).slice(2, 8)}`
          newUploads.push({ id, file: f })
          newForms[id] = { ...ds.formData }
        } catch (e) {
          console.error('demo seed failed for', ds.label, e)
        }
      }
      setUploads((prev) => [...prev, ...newUploads])
      setFormMap((prev) => ({ ...prev, ...newForms }))
    } finally {
      setSeedingDemo(false)
    }
  }

  const newBatch = () => {
    setUploads([])
    setFormMap({})
    setResults({})
    setSummary({ total: 0, pass: 0, flag: 0, needsReview: 0, errors: 0 })
    setCompleted(0)
    setBatchStatus('idle')
    setBatchError(null)
    setUploadError(null)
    setExpanded(new Set())
    setRowErrors({})
  }

  const fields = useMemo(
    () => getApplicableFields(beverageType),
    [beverageType],
  )

  const validateAll = (): boolean => {
    let ok = true
    const errs: Record<string, Set<LabelFieldKey>> = {}
    for (const u of uploads) {
      const v = validateFormData(beverageType, formMap[u.id] ?? {})
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
    setBatchError(null)
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
      const prepared = await Promise.all(
        uploads.map(async (u) => ({
          id: u.id,
          file: await rasterizePdfFile(u.file),
          originalName: u.file.name,
        })),
      )

      const fd = new FormData()
      fd.append('beverageType', beverageType)
      const formDataArray: LabelFormData[] = prepared.map(
        (p) => formMap[p.id] ?? emptyFormData(),
      )
      for (const p of prepared) fd.append('files', p.file)
      fd.append('formData', JSON.stringify(formDataArray))

      const res = await fetch('/api/batch', { method: 'POST', body: fd })
      if (!res.ok || !res.body) {
        const body: {
          message?: string
          rows?: { index: number; fields: LabelFieldKey[] }[]
        } = await res.json().catch(() => ({}))
        if (Array.isArray(body.rows)) {
          const nextErrors: Record<string, Set<LabelFieldKey>> = {}
          for (const row of body.rows) {
            const upload = uploads[row.index]
            if (upload) nextErrors[upload.id] = new Set(row.fields)
          }
          setRowErrors(nextErrors)
        }
        setBatchError(body.message ?? 'Batch request failed')
        setBatchStatus('idle')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      const idByIndex = new Map<number, string>()
      prepared.forEach((p, index) => idByIndex.set(index, p.id))

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
              const id = idByIndex.get(ev.index)
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
      setBatchError(
        e instanceof Error
          ? e.message
          : 'An unexpected error occurred while processing the batch.',
      )
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
  const progressPct =
    summary.total > 0 ? Math.round((completed / summary.total) * 100) : 0

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-6">
      <PageHeader
        eyebrow="Batch label verification"
        title="Verify multiple labels in parallel"
        description="Upload all labels at once, fill the inline form rows, and process them concurrently. Results stream back as each label completes."
        actions={
          <div className="hidden sm:flex items-center gap-2">
            {uploads.length > 0 && (
              <span className="chip">
                <Files className="h-3 w-3 text-[var(--color-primary)]" aria-hidden />
                <span className="num font-semibold text-[var(--color-text)]">
                  {uploads.length}
                </span>
                queued
              </span>
            )}
            <span className="chip">
              <Zap className="h-3 w-3 text-[var(--color-primary)]" aria-hidden />
              SSE streaming
            </span>
          </div>
        }
      />

      <div
        className={`grid grid-cols-1 gap-6 ${
          showResults ? '' : 'xl:grid-cols-[minmax(0,1fr)_430px]'
        }`}
      >
        {/* Configuration */}
        <section className="card panel-accent p-5 pl-7 fade-up" aria-labelledby="batch-config">
          <h2 id="batch-config" className="sr-only">
            Batch configuration
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] xl:grid-cols-1 gap-5">
            <div>
              <label className="eyebrow block mb-2">Beverage type</label>
              <BeverageTypeSelector
                value={beverageType}
                onChange={(type) => {
                  setBeverageType(type)
                }}
              />
            </div>
          </div>
        </section>

        {/* File upload */}
        {!showResults && (
          <section className="card panel-accent p-5 pl-7 fade-up hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300" aria-label="Upload labels">
            <div className="mb-4">
              <div className="eyebrow text-[var(--color-primary)]">Batch intake</div>
              <h2 className="mt-1 text-[17px] font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                Queue label artwork
              </h2>
              <p className="mt-1 text-[12.5px] text-[var(--color-text-secondary)]">
                Drop every label first, then complete one row per file.
              </p>
            </div>
            <FileDropZone
              file={null}
              onFile={(f) => f && addFiles([f])}
              multiple
              onFiles={addFiles}
              error={uploadError}
              helperHint={
                uploads.length === 0
                  ? 'Or use the "Seed demo batch" button below for an instant 3-label demo.'
                  : undefined
              }
            />
          </section>
        )}
      </div>

      {/* Empty state with seed-demo affordance */}
      {uploads.length === 0 && !showResults && (
        <BatchEmptyState onSeedDemo={seedDemoBatch} seeding={seedingDemo} />
      )}

      {/* Inline form table or results */}
      {uploads.length > 0 && (
        <section className="card panel-accent overflow-hidden fade-up hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
          {batchError && (
            <div
              role="alert"
              className="border-b border-[var(--color-flag-border)] bg-[var(--color-flag-bg)] px-5 py-3 text-sm text-[var(--color-flag)] flex items-start gap-2 animate-pulse"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              <span>{batchError}</span>
            </div>
          )}
          {/* Sticky summary header when results are showing */}
          {showResults && (
            <div
              role="status"
              aria-live="polite"
              className="bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)] px-5 py-4 flex flex-wrap items-center gap-3 shadow-sm z-10"
            >
              <StatusPill status="PASS" count={summary.pass} />
              <StatusPill status="FLAG" count={summary.flag} />
              <StatusPill status="NEEDS REVIEW" count={summary.needsReview} />
              {summary.errors > 0 && (
                <StatusPill status="ERROR" count={summary.errors} label="ERROR" />
              )}
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-secondary)] num">
                  <span className="font-semibold text-[var(--color-text)]">{completed}</span>
                  <span className="text-[var(--color-text-muted)]"> / {summary.total}</span>{' '}
                  complete
                </span>
                {batchStatus === 'loading' && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-[var(--color-background-alt)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] transition-all duration-300 shadow-[0_0_8px_var(--color-primary-tint-strong)]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <Loader2
                      className="h-4 w-4 text-[var(--color-primary)] animate-spin"
                      aria-hidden
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" role="table">
              <thead className="bg-[var(--color-surface-quiet)] border-b border-[var(--color-border)]">
                <tr>
                  <th
                     scope="col"
                     className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)] px-4 py-3 w-[200px]"
                   >
                     File
                   </th>
                   {!showResults &&
                     fields.map((f) => (
                       <th
                         scope="col"
                         key={f.key}
                         className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)] px-2.5 py-3 min-w-[150px]"
                       >
                         <div className="flex items-center justify-between gap-2">
                           <span>{f.label}</span>
                           <button
                             type="button"
                             onClick={() => fillColumn(f.key)}
                             className="text-[10px] font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] normal-case tracking-normal cursor-pointer"
                           >
                             Fill ↓
                           </button>
                         </div>
                       </th>
                     ))}
                   {showResults && (
                      <th
                        scope="col"
                        className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)] px-4 py-3"
                      >
                        Result
                      </th>
                    )}
                    <th scope="col" className="w-12" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u, idx) => {
                    const row = formMap[u.id] ?? emptyFormData()
                    const ev = results[u.id]
                    const isExpanded = expanded.has(u.id)
                    const rowErrSet = rowErrors[u.id]
                    const hasRowError = (rowErrSet?.size ?? 0) > 0
                    return (
                      <tr
                        key={u.id}
                        className={`${
                          idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-surface-quiet)]/20'
                        } hover:bg-[var(--color-surface-elevated)] transition-colors duration-150 border-b border-[var(--color-border)] last:border-b-0 ${
                          hasRowError ? 'shadow-[inset_2px_0_0_0_var(--color-flag)]' : ''
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] inline-flex items-center justify-center shrink-0">
                              <span className="text-[9.5px] font-bold uppercase tracking-wide text-[var(--color-primary)] num">
                                {(u.file.name.split('.').pop() ?? '').slice(0, 3)}
                              </span>
                            </span>
                            <div className="min-w-0">
                              <div
                                className="text-[13px] font-medium text-[var(--color-text)] truncate"
                                title={u.file.name}
                              >
                                {u.file.name}
                              </div>
                              <div className="text-[10.5px] text-[var(--color-text-muted)] num">
                                {(u.file.size / 1024).toFixed(0)} KB
                              </div>
                            </div>
                          </div>
                        </td>

                        {!showResults &&
                          fields.map((f) => {
                            const hasError = rowErrSet?.has(f.key) ?? false
                            const value = (row[f.key] ?? '') as string
                            const isTextarea =
                              f.key === 'governmentWarning' || f.key === 'producerAddress'
                            return (
                              <td key={f.key} className="px-2 py-2 align-top">
                                {isTextarea ? (
                                  <textarea
                                    value={value}
                                    onChange={(e) => updateRow(u.id, f.key, e.target.value)}
                                    rows={2}
                                    className={`w-full min-w-[150px] text-[12.5px] rounded-md border ${hasError ? 'border-[var(--color-flag)] bg-[var(--color-flag-bg)] text-[var(--color-flag)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'} px-2 py-1.5 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 font-mono transition-colors leading-snug`}
                                    aria-invalid={hasError}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => updateRow(u.id, f.key, e.target.value)}
                                    className={`w-full h-8 text-[12.5px] rounded-md border ${hasError ? 'border-[var(--color-flag)] bg-[var(--color-flag-bg)] text-[var(--color-flag)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'} px-2 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 font-mono transition-colors`}
                                    aria-invalid={hasError}
                                  />
                                )}
                              </td>
                            )
                          })}

                        {showResults && (
                          <td className="px-4 py-3 align-top">
                            <ResultCell ev={ev} batchStatus={batchStatus} />
                            {isExpanded && ev?.result && (
                              <div className="mt-3 space-y-3 fade-up">
                                <VisualLimitationNotice />
                                <div className="border border-[var(--color-border)] rounded-md overflow-hidden bg-[var(--color-surface-quiet)]">
                                  {ev.result.fields.map((fr, i) => (
                                    <FieldResultRow
                                      key={fr.fieldKey}
                                      result={fr}
                                      isLast={i === ev.result!.fields.length - 1}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        )}

                        <td className="px-2 py-3 align-top text-right">
                          {!showResults ? (
                            <button
                              type="button"
                              aria-label={`Remove ${u.file.name}`}
                              onClick={() => removeUpload(u.id)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-flag)] hover:bg-[var(--color-background-alt)] transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          ) : ev?.result ? (
                            <button
                              type="button"
                              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              aria-expanded={isExpanded}
                              onClick={() => toggleExpand(u.id)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-background-alt)] transition-colors cursor-pointer"
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
      <div className="flex flex-wrap items-center gap-3 sticky bottom-0 z-10">
        {batchStatus !== 'done' && uploads.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 w-full">
            <button
              type="button"
              onClick={handleVerifyBatch}
              disabled={batchStatus === 'loading'}
              className="btn-primary"
            >
              {batchStatus === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Processing…
                  <span className="num text-white/85 text-xs ml-1">
                    ({completed} of {uploads.length})
                  </span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                  Verify batch
                  <span className="num text-white/85 text-xs ml-1">
                    ({uploads.length}{' '}
                    {uploads.length === 1 ? 'label' : 'labels'})
                  </span>
                  <ArrowRight className="h-4 w-4 ml-0.5" aria-hidden />
                </>
              )}
            </button>
            <p className="text-[12px] text-[var(--color-text-secondary)] ml-auto sm:ml-0">
              All labels run in parallel via SSE — results stream as each completes.
            </p>
          </div>
        )}
        {batchStatus === 'done' && (
          <div className="flex items-center gap-3 w-full justify-between">
            <p className="text-[13px] text-[var(--color-text-secondary)] inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[var(--color-pass)]" aria-hidden />
              Batch complete · review flagged rows, then start a new batch.
            </p>
            <button type="button" onClick={newBatch} className="btn-ghost">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Start a new batch
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BatchEmptyState({
  onSeedDemo,
  seeding,
}: {
  onSeedDemo: () => void
  seeding: boolean
}) {
  return (
    <div className="card panel-accent relative overflow-hidden p-8 flex flex-col items-center text-center gap-4 fade-up">
      <span className="relative h-16 w-16 rounded-lg bg-[var(--color-surface-quiet)] border border-[var(--color-border)] inline-flex items-center justify-center shadow-md">
        <Files
          className="h-7 w-7 text-[var(--color-primary)]"
          aria-hidden
          strokeWidth={1.75}
        />
      </span>
      <div className="max-w-md relative">
        <h3 className="text-[17px] font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
          No labels queued yet
        </h3>
        <p className="text-[13.5px] text-[var(--color-text-secondary)] mt-2 leading-relaxed">
          Drop a stack of labels into the upload zone above. We&rsquo;ll generate
          one inline form row per file. The whole batch runs in parallel with a
          5-second SLA per label.
        </p>
      </div>
      <button
        type="button"
        onClick={onSeedDemo}
        disabled={seeding}
        className="btn-ghost relative"
      >
        {seeding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading bundled labels…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" aria-hidden />
            Seed demo batch (3 labels)
          </>
        )}
      </button>
      <p className="text-[11.5px] text-[var(--color-text-muted)] relative">
        Demo batch contains three diverse sample labels for testing.
      </p>
    </div>
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
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Loader2
          className={`h-4 w-4 ${batchStatus === 'loading' ? 'animate-spin' : ''} text-[var(--color-text-muted)]`}
          aria-hidden
        />
        <span>Processing…</span>
      </div>
    )
  }
  if (ev.error) {
    return (
      <div className="flex items-start gap-2 text-sm text-[var(--color-flag)]" role="alert">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
        <span>{ev.error}</span>
      </div>
    )
  }
  const r = ev.result
  if (!r) return null
  if (r.overall === 'PASS') {
    const passCount = r.fields.filter((f) => f.status === 'pass').length
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-[var(--color-pass)]" aria-hidden />
        <span className="font-semibold text-[var(--color-pass)]">PASS</span>
        <span className="text-[var(--color-text-secondary)]">
          <span className="num font-bold text-[var(--color-text)]">{passCount}</span> of{' '}
          <span className="num">{r.fields.length}</span> fields matched
        </span>
        <span className="text-[var(--color-text-muted)] text-xs num ml-1">
          · {(r.processingMs / 1000).toFixed(1)}s
        </span>
      </div>
    )
  }
  if (r.overall === 'FLAG') {
    const firstFlag = r.fields.find((f) => f.status === 'flag')
    return (
      <div className="flex items-start gap-2 text-sm">
        <XCircle className="h-4 w-4 text-[var(--color-flag)] mt-0.5" aria-hidden />
        <div className="min-w-0">
          <div className="font-semibold text-[var(--color-flag)]">FLAG</div>
          {firstFlag && (
            <div className="text-[var(--color-text-secondary)] text-[12px] mt-0.5">
              {firstFlag.reason ?? firstFlag.fieldName}
            </div>
          )}
        </div>
      </div>
    )
  }
  const firstReview = r.fields.find((f) => f.status === 'needs-review')
  return (
    <div className="flex items-start gap-2 text-sm">
      <HelpCircle className="h-4 w-4 text-[var(--color-review)] mt-0.5" aria-hidden />
      <div className="min-w-0">
        <div className="font-semibold text-[var(--color-review)]">NEEDS REVIEW</div>
        {firstReview && (
          <div className="text-[var(--color-text-secondary)] text-[12px] mt-0.5">
            {firstReview.reason ?? firstReview.fieldName}
          </div>
        )}
      </div>
    </div>
  )
}
