'use client'

import { ClipboardCopy } from 'lucide-react'
import { MOCK_DATASETS } from '@/lib/mock-data'
import { TTB_STANDARD_WARNING_TEXT } from '@/lib/field-comparison'
import type { MockDataset } from '@/lib/types'

interface Props {
  onLoad: (dataset: MockDataset) => void
  onInsertWarning: () => void
  selected?: string
}

export function LoadSampleSelector({ onLoad, onInsertWarning, selected }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-wide text-[#64748B]">
        Load sample data
      </label>
      <select
        className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-2 text-sm text-[#1E293B] focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100 cursor-pointer"
        value={selected ?? ''}
        onChange={(e) => {
          const ds = MOCK_DATASETS.find((d) => d.label === e.target.value)
          if (ds) onLoad(ds)
        }}
      >
        <option value="" disabled>
          — Select a test case —
        </option>
        {MOCK_DATASETS.map((d) => (
          <option key={d.label} value={d.label}>
            {d.displayName}
          </option>
        ))}
      </select>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onInsertWarning}
          title={TTB_STANDARD_WARNING_TEXT}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#1B4F8A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] rounded-sm px-1 cursor-pointer"
        >
          <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
          Insert standard TTB warning
        </button>
      </div>
    </div>
  )
}
