'use client'

import type { BeverageType, LabelFieldKey, LabelFormData } from '@/lib/types'
import { getApplicableFields } from '@/lib/beverage-fields'

interface Props {
  beverageType: BeverageType
  formData: Partial<LabelFormData>
  onChange: (key: LabelFieldKey, value: string) => void
  errors: Set<LabelFieldKey>
  warningTextareaRef?: React.MutableRefObject<HTMLTextAreaElement | null>
}

const TEXTAREA_FIELDS = new Set<LabelFieldKey>(['governmentWarning', 'producerAddress'])

export function LabelFormFields({
  beverageType,
  formData,
  onChange,
  errors,
  warningTextareaRef,
}: Props) {
  const fields = getApplicableFields(beverageType)

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const required = f.required === 'always'
        const optionalLabel =
          f.required === 'optional' || f.required === 'conditional'
            ? '(optional)'
            : ''
        const hasError = errors.has(f.key)
        const isWarning = f.key === 'governmentWarning'
        const isAddress = f.key === 'producerAddress'
        const value = (formData[f.key] ?? '') as string
        const errorId = hasError ? `err-${f.key}` : undefined

        return (
          <div key={f.key}>
            <div className="flex items-baseline justify-between mb-1">
              <label
                htmlFor={`field-${f.key}`}
                className="text-[13px] font-semibold text-[var(--color-text)]"
              >
                {f.label}
                {required && (
                  <span className="text-[var(--color-flag)] ml-0.5" aria-hidden>
                    *
                  </span>
                )}
              </label>
              {optionalLabel && (
                <span className="text-[11.5px] text-[var(--color-text-secondary)]">{optionalLabel}</span>
              )}
            </div>
            {TEXTAREA_FIELDS.has(f.key) ? (
              <textarea
                id={`field-${f.key}`}
                ref={isWarning ? warningTextareaRef : undefined}
                value={value}
                onChange={(e) => onChange(f.key, e.target.value)}
                rows={isWarning ? 4 : 2}
                placeholder={
                  f.required === 'optional'
                    ? 'Leave blank if not applicable'
                    : isWarning
                      ? 'Paste or type the government warning…'
                      : undefined
                }
                aria-invalid={hasError}
                aria-describedby={errorId}
                className={`input-base resize-y leading-relaxed ${
                  isAddress ? 'min-h-[56px] py-2' : 'min-h-[76px] py-2'
                }`}
                style={{ height: 'auto' }}
              />
            ) : (
              <input
                id={`field-${f.key}`}
                type="text"
                inputMode={f.key === 'abv' ? 'decimal' : undefined}
                value={value}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={
                  f.required === 'optional' ? 'Leave blank if not applicable' : undefined
                }
                aria-invalid={hasError}
                aria-describedby={errorId}
                className="input-base"
              />
            )}
            {hasError && (
              <p
                id={errorId}
                role="alert"
                className="text-xs text-[var(--color-flag)] mt-1.5 flex items-center gap-1.5"
              >
                <span className="h-1 w-1 rounded-full bg-[var(--color-flag)]" aria-hidden />
                This field is required.
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
