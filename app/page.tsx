'use client'

import { useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  Loader2,
  Lock,
  Play,
  RotateCw,
  ShieldCheck,
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
  const [isImport, setIsImport] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<Partial<LabelFormData>>({})
  const [errors, setErrors] = useState<Set<LabelFieldKey>>(new Set())
  const [fileError, setFileError] = useState<string | null>(null)
  const [status, setStatus] = useState<UIStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [sampleKey, setSampleKey] = useState<string>('')
  const [sampleLoading, setSampleLoading] = useState(false)
  const warningRef = useRef<HTMLTextAreaElement | null>(null)

  const updateField = (key: LabelFieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors.has(key)) {
      const next = new Set(errors)
      next.delete(key)
      setErrors(next)
    }
  }

  const handleLoadSample = async (ds: MockDataset) => {
    setBeverageType(ds.beverageType)
    setIsImport(ds.isImport)
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
    setFile(f)
    setFileError(null)
    if (f && !isAcceptedFile(f)) {
      setFileError('Unsupported file type. Please upload a JPG, PNG, or PDF.')
    }
  }

  const handleVerify = async () => {
    setErrorMessage(null)
    const errs = new Set<LabelFieldKey>()
    const v = validateFormData(beverageType, isImport, formData)
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
      fd.append('isImport', String(isImport))
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
    file !== null && validateFormData(beverageType, isImport, formData).ok

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 lg:py-10">
      <div className="mb-7 lg:mb-8">
        <PageHeader
          eyebrow="Single label verification"
          title="Verify a label against COLA form data"
          description="Upload a label image and submit the application form values. Claude Vision extracts each regulated field and compares it against your submission in under five seconds."
          actions={
            <div className="hidden sm:flex items-center gap-2">
              <span className="chip">
                <Zap className="h-3 w-3 text-[#1B4F8A]" aria-hidden />
                <span className="num font-semibold text-[#0F172A]">&lt; 5s</span>
                per label
              </span>
              <span className="chip">
                <Lock className="h-3 w-3 text-[#1B4F8A]" aria-hidden />
                No data persisted
              </span>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-6 items-start">
        {/* LEFT — Form */}
        <section
          className="card p-6 space-y-7 fade-up"
          aria-labelledby="form-heading"
        >
          <h2 id="form-heading" className="sr-only">
            Application form
          </h2>

          <FormSection number={1} title="Configuration" subtitle="Beverage type, import status, and quick start">
            <div>
              <label className="eyebrow block mb-2">Beverage type</label>
              <BeverageTypeSelector value={beverageType} onChange={setBeverageType} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer group rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EEF4FB] hover:border-[#1B4F8A]/30 transition-all px-3 py-2.5">
              <input
                type="checkbox"
                checked={isImport}
                onChange={(e) => setIsImport(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-[#CBD5E1] text-[#1B4F8A] focus:ring-[#1B4F8A]/30"
              />
              <span className="flex-1">
                <span className="text-sm font-medium text-[#0F172A] block">
                  Imported product
                </span>
                <span className="text-xs text-[#64748B] mt-0.5 block">
                  Adds Country of Origin to the form and the AI extraction.
                </span>
              </span>
            </label>
            <LoadSampleSelector
              onLoad={handleLoadSample}
              onInsertWarning={handleInsertWarning}
              selected={sampleKey}
            />
            {sampleLoading && (
              <p className="text-[11.5px] text-[#1B4F8A] flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                Loading bundled label…
              </p>
            )}
          </FormSection>

          <FormSection number={2} title="Label image" subtitle="JPG, PNG, or PDF up to 10 MB">
            <FileDropZone file={file} onFile={handleFile} error={fileError} />
          </FormSection>

          <FormSection
            number={3}
            title="Application form data"
            subtitle="Enter the values exactly as filed in COLA"
          >
            <LabelFormFields
              beverageType={beverageType}
              isImport={isImport}
              formData={formData}
              onChange={updateField}
              errors={errors}
              warningTextareaRef={warningRef}
            />
          </FormSection>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={status === 'loading' || !formValid}
              className="btn-primary w-full"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Verifying label…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                  Verify label
                  <ArrowRight className="h-4 w-4 ml-0.5" aria-hidden />
                </>
              )}
            </button>
            {!formValid && status !== 'loading' && (
              <p className="text-[11.5px] text-[#94A3B8] text-center">
                Complete all required fields and upload a label to verify.
              </p>
            )}
          </div>
        </section>

        {/* RIGHT — Result */}
        <section
          className="min-w-0"
          aria-labelledby="result-heading"
          aria-live="polite"
        >
          <h2 id="result-heading" className="sr-only">
            Verification result
          </h2>

          {status === 'idle' && <IdleState />}
          {status === 'loading' && (
            <div className="space-y-4 fade-up">
              <div className="card p-5 flex items-center gap-4">
                <div className="relative h-10 w-10 shrink-0">
                  <Loader2
                    className="h-10 w-10 text-[#1B4F8A] animate-spin"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-[#0F172A]">
                    Analyzing label…
                  </div>
                  <div className="text-[12.5px] text-[#475569] mt-0.5">
                    Claude Vision is extracting each regulated field. This
                    usually completes in under 5 seconds.
                  </div>
                </div>
              </div>
              <ResultSkeleton />
            </div>
          )}
          {status === 'error' && (
            <div
              role="alert"
              className="card p-8 flex flex-col items-center justify-center text-center min-h-[320px] gap-4 fade-up"
            >
              <span className="h-14 w-14 rounded-full bg-[#FEF2F2] inline-flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-[#DC2626]" aria-hidden />
              </span>
              <div className="max-w-md">
                <div className="text-[16px] font-semibold text-[#0F172A]">
                  {errorMessage ?? 'An unexpected error occurred.'}
                </div>
                <div className="text-[13px] text-[#475569] mt-1.5 leading-relaxed">
                  Your form data is preserved. Adjust your input or try again
                  in a moment.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="btn-ghost"
              >
                <RotateCw className="h-4 w-4" aria-hidden />
                Dismiss
              </button>
            </div>
          )}
          {status === 'done' && result && (
            <div className="space-y-4 fade-up">
              <OverallBadge result={result} />
              <VisualLimitationNotice />
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#1B4F8A]" aria-hidden />
                    <h3 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#475569]">
                      Field-by-field result
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#94A3B8] num">
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
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[12.5px] text-[#475569]">
                  Review flagged fields and take action in COLA IT.
                </p>
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
          )}
        </section>
      </div>
    </div>
  )
}

function FormSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: number
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3.5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="h-6 w-6 inline-flex items-center justify-center rounded-md bg-[#EEF4FB] text-[11px] font-bold text-[#1B4F8A] num ring-1 ring-[#DCE9F5]"
        >
          {number}
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-[14px] font-semibold text-[#0F172A] tracking-tight leading-none">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11.5px] text-[#94A3B8] mt-1 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-3.5 pl-9">{children}</div>
    </section>
  )
}

function IdleState() {
  return (
    <div className="card relative overflow-hidden p-10 flex flex-col items-center justify-center text-center min-h-[480px] gap-5 fade-up">
      <div
        aria-hidden
        className="absolute inset-0 grid-bg opacity-40 pointer-events-none"
        style={{
          maskImage:
            'radial-gradient(ellipse at center, black 0%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />
      <div className="relative">
        <span className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#EEF4FB] to-[#DCE9F5] inline-flex items-center justify-center ring-1 ring-[#DCE9F5]">
          <FileSearch
            className="h-9 w-9 text-[#1B4F8A]"
            aria-hidden
            strokeWidth={1.75}
          />
        </span>
        <span
          aria-hidden
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#1B4F8A] ring-4 ring-white inline-flex items-center justify-center"
        >
          <ShieldCheck className="h-3 w-3 text-white" aria-hidden />
        </span>
      </div>
      <div className="max-w-md relative">
        <h3 className="text-[17px] font-semibold text-[#0F172A]">
          Ready when you are
        </h3>
        <p className="text-[13.5px] text-[#475569] mt-2 leading-relaxed">
          Upload a label image and complete the application form on the left.
          Your verification result will appear here in under five seconds.
        </p>
      </div>
      <ul className="text-[12.5px] text-[#475569] space-y-2 max-w-md text-left mt-2 w-full relative">
        <ChecklistRow text="JPG, PNG, or PDF labels are supported" />
        <ChecklistRow text="Use Quick start to load a bundled test case in one click" />
        <ChecklistRow text="No data is stored — every verification is fresh" />
      </ul>
    </div>
  )
}

function ChecklistRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 px-3 py-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
      <CheckCircle2
        className="h-3.5 w-3.5 mt-0.5 text-[#16A34A] shrink-0"
        aria-hidden
        strokeWidth={2.25}
      />
      <span className="text-[#0F172A]">{text}</span>
    </li>
  )
}
