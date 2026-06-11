'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  FileSearch,
  Loader2,
  Lock,
  Play,
  RotateCw,
  ShieldCheck,
  Upload,
  Zap,
} from 'lucide-react'
import { BeverageTypeSelector } from '@/components/BeverageTypeSelector'
import { FileDropZone } from '@/components/FileDropZone'
import { LoadSampleSelector } from '@/components/LoadSampleSelector'
import { LabelFormFields } from '@/components/LabelFormFields'
import { OverallBadge } from '@/components/OverallBadge'
import { PageHeader } from '@/components/PageHeader'
import { ResultSkeleton } from '@/components/ResultSkeleton'
import { VisualLimitationNotice } from '@/components/VisualLimitationNotice'
import { FieldResultRow } from '@/components/FieldResultRow'
import {
  BeverageType,
  LabelFieldKey,
  LabelFormData,
  MockDataset,
  UIStatus,
  VerificationResult,
} from '@/lib/types'
import { rasterizePdfFile } from '@/lib/pdf-preprocessor'
import { isAcceptedFile, validateFormData } from '@/lib/validation'
import { TTB_STANDARD_WARNING_TEXT } from '@/lib/field-comparison'
import { loadSampleFile } from '@/lib/sample-loader'

export default function SingleVerifyPage() {
  const [beverageType, setBeverageType] = useState<BeverageType>('spirits')
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<Partial<LabelFormData>>({})
  const [errors, setErrors] = useState<Set<LabelFieldKey>>(new Set())
  const [fileError, setFileError] = useState<string | null>(null)
  const [status, setStatus] = useState<UIStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [sampleKey, setSampleKey] = useState<string>('')
  const [sampleLoading, setSampleLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const warningRef = useRef<HTMLTextAreaElement | null>(null)

  // Generate preview URL whenever file changes
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    let revoked = false
    // For PDFs, rasterize to PNG first then create object URL
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      rasterizePdfFile(file).then((pngFile) => {
        if (revoked) return
        const url = URL.createObjectURL(pngFile)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
      }).catch(() => {
        if (!revoked) setPreviewUrl(null)
      })
    } else {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => { revoked = true; URL.revokeObjectURL(url) }
    }
    return () => { revoked = true }
  }, [file])

  const updateField = (key: LabelFieldKey, value: string) => {
    setResult(null)
    setStatus('idle')
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors.has(key)) {
      const next = new Set(errors)
      next.delete(key)
      setErrors(next)
    }
  }

  const handleBeverageTypeChange = (type: BeverageType) => {
    setResult(null)
    setStatus('idle')
    setBeverageType(type)
    // Reset sample selection when type changes — dropdown is now filtered
    setSampleKey('')
    setFormData({})
    setErrors(new Set())
  }

  const handleLoadSample = async (ds: MockDataset) => {
    setResult(null)
    setStatus('idle')
    setBeverageType(ds.beverageType)
    setFormData({ ...ds.formData })
    setErrors(new Set())
    setSampleKey(ds.label)
    setFileError(null)
    setSampleLoading(true)
    try {
      const f = await loadSampleFile(ds)
      setFile(f)
    } catch (err) {
      console.error('sample load failed', err)
      setFileError(
        `Could not load bundled label ${ds.label}.jpg. Download it manually from /test-labels.`,
      )
    } finally {
      setSampleLoading(false)
    }
  }

  const handleInsertWarning = () => {
    updateField('governmentWarning', TTB_STANDARD_WARNING_TEXT)
    setTimeout(() => warningRef.current?.focus(), 0)
  }

  const handleFile = (f: File | null) => {
    setResult(null)
    setStatus('idle')
    setFile(f)
    setFileError(null)
    if (f && !isAcceptedFile(f)) {
      setFileError('Unsupported file type. Please upload a JPG, PNG, or PDF.')
    }
  }

  const handleVerify = async () => {
    setErrorMessage(null)
    const errs = new Set<LabelFieldKey>()
    const v = validateFormData(beverageType, formData)
    if (!v.ok) for (const k of v.missing) errs.add(k)
    if (!file) {
      setFileError('Please select a label file to verify.')
    } else if (!isAcceptedFile(file)) {
      setFileError('Unsupported file type. Please upload a JPG, PNG, or PDF.')
    }
    setErrors(errs)
    if (errs.size > 0 || !file || !isAcceptedFile(file)) return

    setStatus('loading')
    setResult(null)

    try {
      const uploadFile = await rasterizePdfFile(file)
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('beverageType', beverageType)
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') fd.append(key, value)
      }

      const res = await fetch('/api/verify', { method: 'POST', body: fd })

      if (!res.ok) {
        const body: { error?: string; message?: string; fields?: string[] } =
          await res.json().catch(() => ({}))
        if (res.status === 400 && Array.isArray(body.fields)) {
          setErrors(new Set<LabelFieldKey>(body.fields as LabelFieldKey[]))
          setStatus('idle')
          return
        }
        setErrorMessage(body.message ?? 'Verification failed.')
        setStatus('error')
        return
      }

      const data: VerificationResult = await res.json()
      setResult(data)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setErrorMessage(
        'Verification service is temporarily unavailable. Please try again.',
      )
      setStatus('error')
    }
  }

  const handleVerifyAnother = () => {
    setResult(null)
    setStatus('idle')
    setErrorMessage(null)
  }

  const formValid =
    file !== null &&
    isAcceptedFile(file) &&
    validateFormData(beverageType, formData).ok

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 lg:py-6">
      <div className="mb-4 lg:mb-5">
        <PageHeader
          eyebrow="Single label verification"
          title="Verify a label against COLA form data"
          description="Upload a label image and submit the application form values. Claude Vision extracts each regulated field and compares it against your submission in under five seconds."
          actions={
            <div className="hidden sm:flex items-center gap-2">
              <span className="chip">
                <Zap className="h-3 w-3 text-[var(--color-primary)]" aria-hidden />
                <span className="num font-semibold text-[var(--color-text)]">&lt; 5s</span>
                per label
              </span>
              <span className="chip">
                <Lock className="h-3 w-3 text-[var(--color-primary)]" aria-hidden />
                No data persisted
              </span>
            </div>
          }
        />
      </div>

      {/* 3-column layout: Setup | Form | Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* LEFT — Setup (narrow, compact) */}
        <section
          className="card panel-accent p-4 pl-5 space-y-5 fade-up hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300"
          aria-label="Verification setup"
        >
          {/* Beverage type */}
          <div>
            <label className="eyebrow block mb-2">Beverage type</label>
            <BeverageTypeSelector value={beverageType} onChange={handleBeverageTypeChange} />
          </div>

          {/* Quick start */}
          <LoadSampleSelector
            onLoad={handleLoadSample}
            onInsertWarning={handleInsertWarning}
            selected={sampleKey}
            beverageType={beverageType}
          />
          {sampleLoading && (
            <p className="text-[11.5px] text-blue-400 flex items-center gap-1.5 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Loading bundled label…
            </p>
          )}

          {/* Label image upload / preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="eyebrow">Label image</label>
              {file && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setFileError(null) }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  Change
                </button>
              )}
            </div>

            {previewUrl ? (
              <div className="relative group rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-quiet)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Label preview"
                  className="w-full object-contain max-h-[340px] block"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            ) : (
              <FileDropZone file={file} onFile={handleFile} error={fileError} />
            )}
            {fileError && previewUrl && (
              <p className="text-xs text-[var(--color-flag)] mt-1.5">{fileError}</p>
            )}
          </div>
        </section>

        {/* MIDDLE — Form data (wider) */}
        <section className="card p-5 pl-7 fade-up delay-75 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300" aria-label="COLA form data">
          <h2 id="form-heading" className="sr-only">
            Application form data
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden
                className="h-6 w-6 inline-flex items-center justify-center rounded-md bg-[var(--color-primary-tint)] text-[11.5px] font-bold text-[var(--color-primary)] num ring-1 ring-[var(--color-primary-tint-strong)] shrink-0 mt-0.5"
              >
                2
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[var(--color-text)] tracking-tight leading-none" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                  Application form data
                </h3>
                <p className="text-[11.5px] text-[var(--color-text-secondary)] mt-1 leading-tight">
                  Enter the values exactly as filed in COLA
                </p>
              </div>
            </div>
          </div>

          <LabelFormFields
            beverageType={beverageType}
            formData={formData}
            onChange={updateField}
            errors={errors}
            warningTextareaRef={warningRef}
          />
        </section>

        {/* RIGHT — Result (narrower) */}
        <section
          className="min-w-0"
          aria-labelledby="result-heading"
          aria-live="polite"
        >
          <h2 id="result-heading" className="sr-only">
            Verification result
          </h2>

          {status === 'idle' && (
            <ResultShell
              formValid={formValid}
              status={status}
              onVerify={handleVerify}
            >
              <IdleState />
            </ResultShell>
          )}
          {status === 'loading' && (
            <ResultShell
              formValid={formValid}
              status={status}
              onVerify={handleVerify}
            >
              <div className="space-y-3 fade-up">
                <div className="card p-4 flex items-center gap-3 border border-[var(--color-primary)]/25 bg-[var(--color-primary-tint)]">
                  <Loader2
                    className="h-7 w-7 text-[var(--color-primary)] animate-spin shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[var(--color-text)]">
                      Analyzing label…
                    </div>
                    <div className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
                      Claude Vision is extracting each regulated field.
                    </div>
                  </div>
                </div>
                <ResultSkeleton />
              </div>
            </ResultShell>
          )}
          {status === 'error' && (
            <ResultShell
              formValid={formValid}
              status={status}
              onVerify={handleVerify}
            >
              <div
                role="alert"
                className="p-6 flex flex-col items-center justify-center text-center min-h-[200px] gap-3 fade-up"
              >
                <span className="h-12 w-12 rounded-full bg-[var(--color-flag-bg)] border border-[var(--color-flag-border)] inline-flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-[var(--color-flag)]" aria-hidden />
                </span>
                <div className="max-w-xs">
                  <div className="text-[15px] font-bold text-[var(--color-text)]">
                    {errorMessage ?? 'An unexpected error occurred.'}
                  </div>
                  <div className="text-[12.5px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    Your form data is preserved. Adjust your input or try again.
                  </div>
                </div>
              </div>
            </ResultShell>
          )}
          {status === 'done' && result && (
            <ResultShell
              formValid={formValid}
              status={status}
              onVerify={handleVerify}
            >
              <div className="space-y-3 fade-up">
                <OverallBadge result={result} />
                <VisualLimitationNotice />
                <div className="card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-quiet)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
                      <h3 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[var(--color-text)]">
                        Field-by-field result
                      </h3>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-muted)] num">
                      {result.fields.length} field
                      {result.fields.length === 1 ? '' : 's'} checked
                    </span>
                  </div>
                  {result.fields.map((f, i) => (
                    <FieldResultRow
                      key={f.fieldKey}
                      result={f}
                      isLast={i === result.fields.length - 1}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={handleVerifyAnother}
                    className="btn-ghost"
                  >
                    Verify another
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </ResultShell>
          )}
        </section>
      </div>
    </div>
  )
}

function ResultShell({
  children,
  formValid,
  status,
  onVerify,
}: {
  children: React.ReactNode
  formValid: boolean
  status: UIStatus
  onVerify: () => void
}) {
  const isLoading = status === 'loading'
  const label =
    status === 'error'
      ? 'Retry verification'
      : status === 'done'
        ? 'Run again'
        : 'Verify label'

  return (
    <div className="card panel-accent flex flex-col hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
      <div className="flex-1 p-4">{children}</div>
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-quiet)] p-3">
        <button
          type="button"
          onClick={onVerify}
          disabled={isLoading || !formValid}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Verifying label…
            </>
          ) : (
            <>
              {status === 'error' ? (
                <RotateCw className="h-4 w-4" aria-hidden />
              ) : (
                <Play className="h-4 w-4" aria-hidden strokeWidth={2.25} />
              )}
              {label}
              <ArrowRight className="h-4 w-4 ml-0.5" aria-hidden />
            </>
          )}
        </button>
        {!formValid && !isLoading && (
          <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-2">
            Complete all required fields and upload a label to verify.
          </p>
        )}
      </div>
    </div>
  )
}

function IdleState() {
  return (
    <div className="p-4 flex flex-col items-center justify-center text-center min-h-[240px] gap-4 fade-up">
      <div className="relative">
        <span className="h-14 w-14 rounded-lg bg-[var(--color-surface-quiet)] border border-[var(--color-border)] inline-flex items-center justify-center shadow-sm">
          <FileSearch
            className="h-6 w-6 text-[var(--color-primary)]"
            aria-hidden
            strokeWidth={1.75}
          />
        </span>
        <span
          aria-hidden
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--color-primary)] ring-2 ring-[var(--color-background)] inline-flex items-center justify-center"
        >
          <ShieldCheck className="h-2.5 w-2.5 text-white" aria-hidden />
        </span>
      </div>
      <div className="max-w-[240px]">
        <h3 className="text-[15px] font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
          Ready when you are
        </h3>
        <p className="text-[12.5px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
          Use{' '}
          <span className="font-semibold text-[var(--color-primary)]">Quick start</span>{' '}
          in the left panel to load a test label and form values in one click.
        </p>
      </div>
      <ol className="text-[12px] text-[var(--color-text-secondary)] space-y-1.5 w-full text-left num">
        <ChecklistRow num={1} text="Pick a sample from Quick start" />
        <ChecklistRow num={2} text="JPG + form auto-load" />
        <ChecklistRow num={3} text="Click Verify label" />
      </ol>
    </div>
  )
}

function ChecklistRow({ num, text }: { num: number; text: string }) {
  return (
    <li className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[var(--color-surface-quiet)] border border-[var(--color-border)]">
      <span
        aria-hidden
        className="h-4.5 w-4.5 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white num shrink-0"
      >
        {num}
      </span>
      <span className="text-[var(--color-text)] font-medium text-[12px]">{text}</span>
    </li>
  )
}
