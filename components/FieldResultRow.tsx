import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import type { FieldResult } from '@/lib/types'

const STYLES = {
  pass: {
    bg: 'bg-white',
    icon: CheckCircle2,
    iconColor: 'text-[#16A34A]',
    label: 'PASS',
    labelColor: 'text-[#15803D]',
    chipBg: 'bg-[#F0FDF4]',
    chipBorder: 'border-[#BBF7D0]',
  },
  flag: {
    bg: 'bg-[#FEF2F2]/50',
    icon: XCircle,
    iconColor: 'text-[#DC2626]',
    label: 'FLAG',
    labelColor: 'text-[#B91C1C]',
    chipBg: 'bg-[#FEF2F2]',
    chipBorder: 'border-[#FECACA]',
  },
  'needs-review': {
    bg: 'bg-[#FFFBEB]/60',
    icon: HelpCircle,
    iconColor: 'text-[#D97706]',
    label: 'REVIEW',
    labelColor: 'text-[#B45309]',
    chipBg: 'bg-[#FFFBEB]',
    chipBorder: 'border-[#FDE68A]',
  },
} as const

export function FieldResultRow({ result, isLast }: { result: FieldResult; isLast?: boolean }) {
  const s = STYLES[result.status]
  const Icon = s.icon

  return (
    <div
      className={`px-4 py-3.5 ${s.bg} ${isLast ? '' : 'border-b border-[#E2E8F0]'}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`h-[18px] w-[18px] mt-0.5 shrink-0 ${s.iconColor}`}
          strokeWidth={2}
          aria-label={s.label}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-[#0F172A]">
              {result.fieldName}
            </span>
            <span
              className={`inline-flex items-center rounded-full border ${s.chipBg} ${s.chipBorder} ${s.labelColor} px-2 h-5 text-[10px] font-bold tracking-wider`}
            >
              {s.label}
            </span>
          </div>
          {result.status !== 'pass' && result.reason && (
            <p className={`text-[12px] mt-1 leading-relaxed ${s.labelColor}`}>
              {result.reason}
            </p>
          )}
          {(result.submittedValue || result.extractedValue) && (
            <dl className="mt-2 grid grid-cols-[64px_1fr] gap-x-3 gap-y-1 text-[12px]">
              {result.submittedValue && (
                <>
                  <dt className="text-[#94A3B8] uppercase tracking-wide text-[10px] font-medium pt-px">
                    Form
                  </dt>
                  <dd className="font-mono text-[#0F172A] break-words">
                    {truncate(result.submittedValue, 200)}
                  </dd>
                </>
              )}
              {result.extractedValue !== null && (
                <>
                  <dt className="text-[#94A3B8] uppercase tracking-wide text-[10px] font-medium pt-px">
                    Label
                  </dt>
                  <dd className="font-mono text-[#0F172A] break-words">
                    {truncate(result.extractedValue, 200)}
                  </dd>
                </>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}
