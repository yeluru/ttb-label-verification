'use client'

import type { BeverageType } from '@/lib/types'
import { Beer, Wine, GlassWater } from 'lucide-react'

const OPTIONS: { value: BeverageType; label: string; icon: typeof Beer }[] = [
  { value: 'spirits', label: 'Spirits', icon: GlassWater },
  { value: 'wine', label: 'Wine', icon: Wine },
  { value: 'beer', label: 'Beer', icon: Beer },
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
      className="grid grid-cols-3 gap-1 rounded-md border border-[#E2E8F0] bg-[#F1F5F9] p-1"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`relative h-10 inline-flex items-center justify-center gap-2 rounded-md text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
              active
                ? 'bg-white text-[#1B4F8A] shadow-[0_1px_2px_0_rgb(15_23_42/0.06),0_1px_3px_0_rgb(15_23_42/0.08)]'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <Icon
              className="h-4 w-4"
              aria-hidden
              strokeWidth={active ? 2.25 : 1.75}
            />
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
