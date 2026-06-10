'use client'

import type { BeverageType } from '@/lib/types'

const OPTIONS: { value: BeverageType; label: string }[] = [
  { value: 'spirits', label: 'Spirits' },
  { value: 'wine', label: 'Wine' },
  { value: 'beer', label: 'Beer' },
]

export function BeverageTypeSelector({
  value,
  onChange,
}: {
  value: BeverageType
  onChange: (v: BeverageType) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Beverage type"
      className="grid grid-cols-3 rounded-md border border-[#E2E8F0] overflow-hidden bg-white"
    >
      {OPTIONS.map((opt, i) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`h-9 text-sm font-medium transition-colors duration-150 focus:outline-none focus:z-10 focus:ring-2 focus:ring-[#1B4F8A] cursor-pointer ${
              active
                ? 'bg-[#1B4F8A] text-white hover:bg-[#163F6E]'
                : 'bg-white text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
            } ${i > 0 ? 'border-l border-[#E2E8F0]' : ''}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
