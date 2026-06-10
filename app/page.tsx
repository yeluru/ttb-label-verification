'use client'

import { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  Loader2,
} from 'lucide-react'
import { BeverageTypeSelector } from '@/components/BeverageTypeSelector'
import { FileDropZone } from '@/components/FileDropZone'
import { LoadSampleSelector } from '@/components/LoadSampleSelector'
import { LabelFormFields } from '@/components/LabelFormFields'
import { OverallBadge } from '@/components/OverallBadge'
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
    if (errs.size > 0 || !file || !isAcceptedFile(file)) {
      return
    }

    setStatus('loading')
    setResult(null)
    try {
      // Rasterize PDF client-side if needed.
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
          const next = new Set<LabelFieldKey>(body.fields as LabelFieldKey[])
          setErrors(next)
          setStatus('idle')
          return
        }
        const message = body.message ?? 'Verification failed.'
        setErrorMessage(message)
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

  return (
    <div className="flex flex-col lg:flex-row max-w-[1400px] mx-auto">
      {/* Left panel — form */}
      <section
        className="w-full lg:w-[440px] lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8F0] p-6 lg:overflow-y-auto lg:h-[calc(100vh-56px)]"
        aria-labelledby="form-heading"
      >
        <h1 id="form-heading" className="sr-only">
          Single Label Verification
        </h1>

        {/* Configuration */}
        <fieldset className="space-y-3">
          <legend className="sr-only">Configuration</legend>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[#64748B] mb-1.5">
              Beverage Type
            </label>
            <BeverageTypeSelector value={beverageType} onChange={setBeverageType} />
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isImport}
              onChange={(e) => setIsImport(e.target.checked)}
              className="h-4 w-4 rounded border-[#E2E8F0] text-[#1B4F8A] focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-sm text-[#1E293B]">Imported product</span>
          </label>
          <LoadSampleSelector
            onLoad={handleLoadSample}
            onInsertWarning={handleInsertWarning}
            selected={sampleKey}
          />
        </fieldset>

        {/* File upload */}
        <div className="mt-5">
          <label className="block text-xs font-medium uppercase tracking-wide text-[#64748B] mb-1.5">
            Label Image
          </label>
          <FileDropZone file={file} onFile={handleFile} error={fileError} />
        </div>

        {/* Form fields */}
        <div className="mt-5">
          <label className="block text-xs font-medium uppercase tracking-wide text-[#64748B] mb-2">
            Application Form Data
          </label>
          <LabelFormFields
            beverageType={beverageType}
            isImport={isImport}
            formData={formData}
            onChange={updateField}
            errors={errors}
            warningTextareaRef={warningRef}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={status === 'loading'}
          className="mt-5 w-full h-10 rounded-md bg-[#1B4F8A] hover:bg-[#163F6E] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B4F8A] cursor-pointer flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Verifying…
            </>
          ) : (
            'Verify Label'
          )}
        </button>
      </section>

      {/* Right panel — result */}
      <section
        className="flex-1 min-w-0 p-6 bg-[#F8FAFC] lg:h-[calc(100vh-56px)] lg:overflow-y-auto"
        aria-labelledby="result-heading"
      >
        <h2 id="result-heading" className="sr-only">
          Verification Result
        </h2>

        {status === 'idle' && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
            <FileSearch className="h-12 w-12 text-[#E2E8F0]" aria-hidden />
            <p className="mt-4 text-sm text-[#94A3B8] max-w-sm">
              Upload a label and fill in the form to begin verification.
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 text-[#1B4F8A] animate-spin" aria-hidden />
            <p className="mt-3 text-sm text-[#64748B]">Analyzing label…</p>
            <p className="text-xs text-[#94A3B8] mt-1">
              This usually takes under 5 seconds.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-[#DC2626]" aria-hidden />
            <p className="mt-3 text-sm text-[#1E293B] max-w-md">
              {errorMessage ?? 'An unexpected error occurred.'}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Your form data has been kept — adjust and try again.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-4 inline-flex items-center h-9 px-4 rounded-md border border-[#1B4F8A] text-[#1B4F8A] text-sm hover:bg-[#EFF6FF] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {status === 'done' && result && (
          <div className="max-w-3xl mx-auto space-y-4">
            <OverallBadge status={result.overall} processingMs={result.processingMs} />
            <VisualLimitationNotice />
            <div className="bg-white border border-[#E2E8F0] rounded-md overflow-hidden">
              {result.fields.map((f) => (
                <FieldResultRow key={f.fieldKey} result={f} />
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleVerifyAnother}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-[#1B4F8A] text-[#1B4F8A] text-sm font-medium hover:bg-[#EFF6FF] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Verify Another Label
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
