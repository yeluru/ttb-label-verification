'use client'

import type { BeverageType, LabelFieldKey, LabelFormData } from '@/lib/types'
import { getApplicableFields } from '@/lib/beverage-fields'

interface Props {
  beverageType: BeverageType
  isImport: boolean
  formData: Partial<LabelFormData>
  onChange: (key: LabelFieldKey, value: string) => void
  errors: Set<LabelFieldKey>
  warningTextareaRef?: React.MutableRefObject<HTMLTextAreaElement | null>
  compact?: boolean
}

const FIELD_TYPE: Partial<Record<LabelFieldKey, 'input' | 'textarea'>> = {
  governmentWarning: 'textarea',
  producerAddress: 'textarea',
}

export function LabelFormFields({
  beverageType,
  isImport,
  formData,
  onChange,
  errors,
  warningTextareaRef,
  compact = false,
}: Props) {
  const fields = getApplicableFields(beverageType, isImport)
  const inputBase = `w-full rounded-md border bg-white text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-100`
  const inputHeight = compact ? 'h-8 px-2 text-[13px]' : 'h-9 px-3'
  const taHeight = compact ? 'min-h-[48px] px-2 py-1.5 text-[13px]' : ''

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const optionalLabel =
          f.required === 'optional' || f.required === 'conditional'
            ? ' (optional)'
            : ''
        const required = f.required === 'always' || (f.required === 'if-import' && isImport)
        const hasError = errors.has(f.key)
        const isWarning = f.key === 'governmentWarning'
        const isAddress = f.key === 'producerAddress'
        const value = (formData[f.key] ?? '') as string
        const borderClass = hasError ? 'border-[#DC2626]' : 'border-[#E2E8F0]'
        const focusBorder = 'focus:border-[#1B4F8A]'

        return (
          <div key={f.key}>
            <label
              htmlFor={`field-${f.key}`}
              className="block text-[13px] font-medium text-[#1E293B] mb-1"
            >
              {f.label}
              {optionalLabel && <span className="text-[#94A3B8]">{optionalLabel}</span>}
              {required && <span className="text-[#DC2626] ml-0.5">*</span>}
            </label>
            {FIELD_TYPE[f.key] === 'textarea' ? (
              <textarea
                id={`field-${f.key}`}
                ref={isWarning ? warningTextareaRef : undefined}
                value={value}
                onChange={(e) => onChange(f.key, e.target.value)}
                rows={isWarning ? (compact ? 3 : 4) : 2}
                placeholder={
                  f.required === 'optional' ? 'Leave blank if not applicable' : undefined
                }
                className={`${inputBase} ${borderClass} ${focusBorder} ${taHeight || 'px-3 py-2 text-sm'} ${
                  isAddress ? 'min-h-[48px]' : 'min-h-[80px]'
                } resize-y`}
                aria-invalid={hasError}
              />
            ) : (
              <input
                id={`field-${f.key}`}
                type="text"
                value={value}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={
                  f.required === 'optional' ? 'Leave blank if not applicable' : undefined
                }
                className={`${inputBase} ${borderClass} ${focusBorder} ${inputHeight}`}
                aria-invalid={hasError}
              />
            )}
            {hasError && (
              <p className="text-xs text-[#DC2626] mt-1">This field is required.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
