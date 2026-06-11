'use client'

import { ClipboardCopy, ChevronDown, Sparkles, Download } from 'lucide-react'
import { MOCK_DATASETS } from '@/lib/mock-data'
import { TTB_STANDARD_WARNING_TEXT } from '@/lib/field-comparison'
import type { BeverageType, MockDataset } from '@/lib/types'

interface Props {
  onLoad: (dataset: MockDataset) => void
  onInsertWarning: () => void
  selected?: string
  compact?: boolean
  beverageType?: BeverageType
}

export function LoadSampleSelector({
  onLoad,
  onInsertWarning,
  selected,
  beverageType,
}: Props) {
  const filtered = beverageType
    ? MOCK_DATASETS.filter((d) => d.beverageType === beverageType)
    : MOCK_DATASETS
  const current = MOCK_DATASETS.find((d) => d.label === selected)
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-1.5 eyebrow">
          <Sparkles className="h-3 w-3 text-[var(--color-primary)]" aria-hidden />
          Quick start
        </label>
        <button
          type="button"
          onClick={onInsertWarning}
          title={TTB_STANDARD_WARNING_TEXT}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors cursor-pointer"
        >
          <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
          Insert TTB warning
        </button>
      </div>
      <div className="relative">
        <select
          aria-label="Load sample dataset"
          className="input-base appearance-none pr-9 cursor-pointer font-medium"
          value={selected ?? ''}
          onChange={(e) => {
            const ds = MOCK_DATASETS.find((d) => d.label === e.target.value)
            if (ds) onLoad(ds)
          }}
        >
          <option value="" disabled className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            Select a bundled test case…
          </option>
          {filtered.map((d) => (
            <option key={d.label} value={d.label} className="bg-[var(--color-surface)] text-[var(--color-text)]">
              {d.displayName}
            </option>
          ))}
        </select>
        <ChevronDown
          className="h-4 w-4 text-[var(--color-text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden
        />
      </div>
      <p className="text-[11.5px] text-[var(--color-text-secondary)] leading-snug">
        Picks the beverage type, fills the form, <em className="not-italic font-bold text-[var(--color-text)]">and</em>{' '}
        stages the matching JPG. One click ready to verify.
      </p>
      {current && (
        <a
          href={`/test-labels/${current.label}.jpg`}
          download
          className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors font-medium"
        >
          <Download className="h-3 w-3" aria-hidden />
          Download {current.label}.jpg
        </a>
      )}
    </div>
  )
}
