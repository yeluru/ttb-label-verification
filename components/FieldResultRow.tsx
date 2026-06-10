import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import type { FieldResult } from '@/lib/types'

const STATUS_STYLES = {
  pass: {
    bg: 'bg-white',
    icon: CheckCircle2,
    iconColor: 'text-[#16A34A]',
    reasonColor: 'text-[#64748B]',
  },
  flag: {
    bg: 'bg-[#FEF2F2]',
    icon: XCircle,
    iconColor: 'text-[#DC2626]',
    reasonColor: 'text-[#DC2626]',
  },
  'needs-review': {
    bg: 'bg-[#FFFBEB]',
    icon: HelpCircle,
    iconColor: 'text-[#D97706]',
    reasonColor: 'text-[#D97706]',
  },
} as const

export function FieldResultRow({ result }: { result: FieldResult }) {
  const s = STATUS_STYLES[result.status]
  const Icon = s.icon
  const reason =
    result.status === 'pass'
      ? 'Match'
      : result.reason ?? 'No explanation provided.'
  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 border-b border-[#E2E8F0] ${s.bg}`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.iconColor}`} aria-label={result.status} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#1E293B]">{result.fieldName}</div>
        <div className={`text-xs mt-0.5 ${s.reasonColor}`}>
          {result.status === 'pass' && <span aria-hidden>✓ </span>}
          {reason}
        </div>
        {result.submittedValue && (
          <div className="text-xs text-[#94A3B8] mt-1 truncate">
            <span className="text-[#64748B]">Form:</span>{' '}
            <span className="font-mono">{result.submittedValue}</span>
          </div>
        )}
        {result.extractedValue !== null && (
          <div className="text-xs text-[#94A3B8] mt-0.5 truncate">
            <span className="text-[#64748B]">Label:</span>{' '}
            <span className="font-mono">{result.extractedValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}
