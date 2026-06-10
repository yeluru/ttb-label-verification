'use client'

import { useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  Loader2,
  RotateCw,
  ShieldCheck,
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
  const warningRef = useRef<HTMLTextAreaElement | null>(null)

  const updateField = (key: LabelFieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors.has(key)) {
      const next = new Set(errors)
      next.delete(key)
      setErrors(next)
    }
  }

  const handleLoadSample = (ds: MockDataset) => {
    setBeverageType(ds.beverageType)
    setIsImport(ds.isImport)
    setFormData({ ...ds.formData })
    setErrors(new Set())
    setSampleKey(ds.label)
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

  const formValid = file !== null && validateFormData(beverageType, isImport, formData).ok

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <PageHeader
          eyebrow="Step 1 of 1 · Single label"
          title="Verify a label against COLA form data"
          description="Upload a label image and submit the application form values. Claude Vision extracts each regulated field and compares it against your submission in under five seconds."
          actions={
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#475569] bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1B4F8A]" aria-hidden />
              No data persisted
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">
        {/* LEFT — Form */}
        <section className="card p-5 sm:p-6 space-y-6" aria-labelledby="form-heading">
          <h2 id="form-heading" className="sr-only">
            Application form
          </h2>

          <FormSection number={1} title="Configuration">
            <div>
              <label className="eyebrow block mb-2">Beverage type</label>
              <BeverageTypeSelector value={beverageType} onChange={setBeverageType} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={isImport}
                onChange={(e) => setIsImport(e.target.checked)}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#1B4F8A] focus:ring-[#1B4F8A]/30"
              />
              <span className="text-sm text-[#0F172A] group-hover:text-[#1B4F8A] transition-colors">
                Imported product
                <span className="text-[#94A3B8] text-xs ml-1.5">
                  · adds country of origin
                </span>
              </span>
            </label>
            <LoadSampleSelector
              onLoad={handleLoadSample}
              onInsertWarning={handleInsertWarning}
              selected={sampleKey}
            />
          </FormSection>

          <FormSection number={2} title="Label image">
            <FileDropZone file={file} onFile={handleFile} error={fileError} />
          </FormSection>

          <FormSection number={3} title="Application form data">
            <LabelFormFields
              beverageType={beverageType}
              isImport={isImport}
              formData={formData}
              onChange={updateField}
              errors={errors}
              warningTextareaRef={warningRef}
            />
          </FormSection>

          <button
            type="button"
            onClick={handleVerify}
            disabled={status === 'loading' || !formValid}
            className="btn-primary w-full"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Verifying…
              </>
            ) : (
              <>
                Verify label
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
          {!formValid && (
            <p className="text-[11px] text-[#94A3B8] text-center -mt-3">
              Complete all required fields and upload a label to verify.
            </p>
          )}
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
            <div className="space-y-4">
              <div className="card p-5 flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-[#1B4F8A] animate-spin" aria-hidden />
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">
                    Analyzing label…
                  </div>
                  <div className="text-xs text-[#475569]">
                    Claude Vision extraction usually completes in under 5 seconds.
                  </div>
                </div>
              </div>
              <ResultSkeleton />
            </div>
          )}
          {status === 'error' && (
            <div
              role="alert"
              className="card p-6 flex flex-col items-center justify-center text-center min-h-[280px] gap-3"
            >
              <span className="h-12 w-12 rounded-full bg-[#FEF2F2] inline-flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-[#DC2626]" aria-hidden />
              </span>
              <div>
                <div className="text-base font-semibold text-[#0F172A]">
                  {errorMessage ?? 'An unexpected error occurred.'}
                </div>
                <div className="text-xs text-[#475569] mt-1.5 max-w-md">
                  Your form data is preserved. Adjust your input or try again in a
                  moment.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="btn-ghost"
              >
                <RotateCw className="h-4 w-4" aria-hidden />
                Try again
              </button>
            </div>
          )}
          {status === 'done' && result && (
            <div className="space-y-4">
              <OverallBadge result={result} />
              <VisualLimitationNotice />
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <h3 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#475569]">
                    Field-by-field result
                  </h3>
                  <span className="text-[11px] text-[#94A3B8] num">
                    {result.fields.length} field{result.fields.length === 1 ? '' : 's'} checked
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
                <p className="text-xs text-[#475569]">
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
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-5 w-5 inline-flex items-center justify-center rounded-full bg-[#EEF4FB] text-[10px] font-bold text-[#1B4F8A] num">
          {number}
        </span>
        <h3 className="text-[13px] font-semibold text-[#0F172A] tracking-tight">
          {title}
        </h3>
      </div>
      <div className="space-y-3 pl-7">{children}</div>
    </section>
  )
}

function IdleState() {
  return (
    <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[420px] gap-4">
      <span className="h-14 w-14 rounded-full bg-[#EEF4FB] inline-flex items-center justify-center">
        <FileSearch className="h-7 w-7 text-[#1B4F8A]" aria-hidden strokeWidth={1.75} />
      </span>
      <div className="max-w-sm">
        <h3 className="text-base font-semibold text-[#0F172A]">
          Ready when you are
        </h3>
        <p className="text-sm text-[#475569] mt-1.5 leading-relaxed">
          Upload a label image and complete the application form on the left.
          Your verification result will appear here in under five seconds.
        </p>
      </div>
      <ul className="text-xs text-[#475569] space-y-1.5 max-w-sm text-left mt-2">
        <ChecklistRow text="JPG, PNG, or PDF labels are supported" />
        <ChecklistRow text="Use Quick start to load a test case" />
        <ChecklistRow text="No data is stored — every run is fresh" />
      </ul>
    </div>
  )
}

function ChecklistRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <ChevronRight className="h-3 w-3 mt-0.5 text-[#1B4F8A] shrink-0" aria-hidden />
      <span>{text}</span>
    </li>
  )
}
