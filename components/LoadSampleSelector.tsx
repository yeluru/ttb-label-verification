'use client'

import { ClipboardCopy, ChevronDown, Sparkles, Download } from 'lucide-react'
import { MOCK_DATASETS } from '@/lib/mock-data'
import { TTB_STANDARD_WARNING_TEXT } from '@/lib/field-comparison'
import type { MockDataset } from '@/lib/types'

interface Props {
  onLoad: (dataset: MockDataset) => void
  onInsertWarning: () => void
  selected?: string
  compact?: boolean
}

export function LoadSampleSelector({
  onLoad,
  onInsertWarning,
  selected,
}: Props) {
  const current = MOCK_DATASETS.find((d) => d.label === selected)
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-1.5 eyebrow">
          <Sparkles className="h-3 w-3 text-[#1B4F8A]" aria-hidden />
          Quick start
        </label>
        <button
          type="button"
          onClick={onInsertWarning}
          title={TTB_STANDARD_WARNING_TEXT}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1B4F8A] hover:text-[#163F6E] transition-colors cursor-pointer"
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
          <option value="" disabled>
            Select a bundled test case…
          </option>
          {MOCK_DATASETS.map((d) => (
            <option key={d.label} value={d.label}>
              {d.displayName}
            </option>
          ))}
        </select>
        <ChevronDown
          className="h-4 w-4 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden
        />
      </div>
      <p className="text-[11.5px] text-[#64748B] leading-snug">
        Picks the beverage type, fills the form, <em className="not-italic font-medium text-[#0F172A]">and</em>{' '}
        stages the matching JPG. One click ready to verify.
      </p>
      {current && (
        <a
          href={`/test-labels/${current.label}.jpg`}
          download
          className="inline-flex items-center gap-1.5 text-[11.5px] text-[#475569] hover:text-[#1B4F8A] transition-colors"
        >
          <Download className="h-3 w-3" aria-hidden />
          Download {current.label}.jpg
        </a>
      )}
    </div>
  )
}
