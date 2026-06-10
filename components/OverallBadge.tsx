import { CheckCircle2, XCircle, AlertTriangle, type LucideIcon } from 'lucide-react'
import type { OverallStatus, VerificationResult } from '@/lib/types'

interface Props {
  result: VerificationResult
}

const VARIANTS: Record<
  OverallStatus,
  {
    bg: string
    text: string
    border: string
    accent: string
    icon: LucideIcon
    headline: string
  }
> = {
  PASS: {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    accent: 'bg-[#16A34A]',
    icon: CheckCircle2,
    headline: 'All fields match',
  },
  FLAG: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FECACA]',
    accent: 'bg-[#DC2626]',
    icon: XCircle,
    headline: 'One or more fields flagged',
  },
  'NEEDS REVIEW': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    accent: 'bg-[#D97706]',
    icon: AlertTriangle,
    headline: 'Human review recommended',
  },
}

export function OverallBadge({ result }: Props) {
  const v = VARIANTS[result.overall]
  const Icon = v.icon
  const passCount = result.fields.filter((f) => f.status === 'pass').length
  const flagCount = result.fields.filter((f) => f.status === 'flag').length
  const reviewCount = result.fields.filter((f) => f.status === 'needs-review').length
  const total = result.fields.length

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative overflow-hidden rounded-lg border ${v.border} ${v.bg}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${v.accent}`} />
      <div className="flex items-start gap-4 p-5 pl-6">
        <div className={`shrink-0 mt-0.5 ${v.text}`}>
          <Icon className="h-7 w-7" aria-hidden strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`text-[18px] font-bold tracking-tight ${v.text}`}>
              {result.overall}
            </span>
            <span className={`text-sm ${v.text} opacity-80`}>{v.headline}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#475569]">
            <span className="num">
              <span className="font-semibold text-[#0F172A]">{passCount}</span>
              <span className="text-[#94A3B8]"> / {total}</span>{' '}
              matched
            </span>
            {flagCount > 0 && (
              <span className="num">
                <span className="font-semibold text-[#DC2626]">{flagCount}</span>{' '}
                <span className="text-[#475569]">flagged</span>
              </span>
            )}
            {reviewCount > 0 && (
              <span className="num">
                <span className="font-semibold text-[#D97706]">{reviewCount}</span>{' '}
                <span className="text-[#475569]">needs review</span>
              </span>
            )}
            <span className="num text-[#94A3B8] ml-auto">
              Analyzed in {(result.processingMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
