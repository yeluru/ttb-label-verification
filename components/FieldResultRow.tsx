import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import type { FieldResult } from '@/lib/types'

const STYLES = {
  pass: {
    bg: 'bg-white',
    icon: CheckCircle2,
    iconColor: 'text-[#16A34A]',
    iconBg: 'bg-[#F0FDF4]',
    label: 'PASS',
    labelClass: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    reasonColor: 'text-[#475569]',
    accentBar: '',
  },
  flag: {
    bg: 'bg-white',
    icon: XCircle,
    iconColor: 'text-[#DC2626]',
    iconBg: 'bg-[#FEF2F2]',
    label: 'FLAG',
    labelClass: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    reasonColor: 'text-[#B91C1C]',
    accentBar: 'before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[#DC2626]',
  },
  'needs-review': {
    bg: 'bg-white',
    icon: HelpCircle,
    iconColor: 'text-[#D97706]',
    iconBg: 'bg-[#FFFBEB]',
    label: 'REVIEW',
    labelClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    reasonColor: 'text-[#B45309]',
    accentBar: 'before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[#D97706]',
  },
} as const

export function FieldResultRow({
  result,
  isLast,
}: {
  result: FieldResult
  isLast?: boolean
}) {
  const s = STYLES[result.status]
  const Icon = s.icon

  return (
    <div
      className={`relative ${s.bg} ${s.accentBar} px-5 py-4 ${
        isLast ? '' : 'border-b border-[#E2E8F0]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`h-7 w-7 rounded-full inline-flex items-center justify-center shrink-0 ${s.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${s.iconColor}`} strokeWidth={2.25} aria-label={s.label} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[13.5px] font-semibold text-[#0F172A]">
              {result.fieldName}
            </span>
            <span
              className={`inline-flex items-center rounded-full border ${s.labelClass} px-2 h-5 text-[10px] font-bold tracking-[0.08em]`}
            >
              {s.label}
            </span>
          </div>
          {result.status !== 'pass' && result.reason && (
            <p className={`text-[12.5px] mt-1.5 leading-relaxed ${s.reasonColor}`}>
              {result.reason}
            </p>
          )}
          {(result.submittedValue || result.extractedValue !== null) && (
            <div className="mt-2.5 grid grid-cols-[56px_1fr] gap-x-3 gap-y-1.5 text-[12px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2">
              {result.submittedValue && (
                <>
                  <span className="text-[#94A3B8] uppercase tracking-[0.06em] text-[10px] font-semibold pt-px">
                    Form
                  </span>
                  <span className="font-mono text-[#0F172A] break-words leading-snug">
                    {truncate(result.submittedValue, 240)}
                  </span>
                </>
              )}
              {result.extractedValue !== null && (
                <>
                  <span className="text-[#94A3B8] uppercase tracking-[0.06em] text-[10px] font-semibold pt-px">
                    Label
                  </span>
                  <span className="font-mono text-[#0F172A] break-words leading-snug">
                    {truncate(result.extractedValue, 240)}
                  </span>
                </>
              )}
            </div>
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
