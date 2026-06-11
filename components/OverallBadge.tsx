import { CheckCircle2, XCircle, AlertTriangle, type LucideIcon, Clock } from 'lucide-react'
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
    glow: string
  }
> = {
  PASS: {
    bg: 'bg-[var(--color-pass-bg)]',
    text: 'text-[var(--color-pass)]',
    border: 'ring-1 ring-inset ring-[var(--color-pass-border)]',
    accent: 'bg-[var(--color-pass)]',
    icon: CheckCircle2,
    headline: 'All fields match the submitted form',
    glow: 'shadow-[0_0_15px_var(--color-pass-border)]',
  },
  FLAG: {
    bg: 'bg-[var(--color-flag-bg)]',
    text: 'text-[var(--color-flag)]',
    border: 'ring-1 ring-inset ring-[var(--color-flag-border)]',
    accent: 'bg-[var(--color-flag)]',
    icon: XCircle,
    headline: 'One or more fields do not match',
    glow: 'shadow-[0_0_15px_var(--color-flag-border)]',
  },
  'NEEDS REVIEW': {
    bg: 'bg-[var(--color-review-bg)]',
    text: 'text-[var(--color-review)]',
    border: 'ring-1 ring-inset ring-[var(--color-review-border)]',
    accent: 'bg-[var(--color-review)]',
    icon: AlertTriangle,
    headline: 'AI uncertain on one or more fields',
    glow: 'shadow-[0_0_15px_var(--color-review-border)]',
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
      className={`relative overflow-hidden rounded-lg ${v.border} ${v.bg} ${v.glow} fade-up bg-gradient-to-r from-transparent to-[var(--color-surface)]/40`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${v.accent}`} />
      <div className="flex items-center gap-5 p-5 pl-6">
        <div className={`shrink-0 ${v.text}`}>
          <Icon className="h-9 w-9" aria-hidden strokeWidth={1.85} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`text-[22px] font-bold tracking-tight leading-none ${v.text}`}>
              {result.overall}
            </span>
            <span className={`text-[13px] ${v.text} opacity-85`}>{v.headline}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="num text-[var(--color-text)] font-bold">{passCount}</span>
              <span className="text-[var(--color-text-muted)]">/</span>
              <span className="num text-[var(--color-text-secondary)]">{total}</span>
              <span className="text-[var(--color-text-secondary)] font-medium">matched</span>
            </span>
            {flagCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-flag)]" aria-hidden />
                <span className="num text-[var(--color-flag)] font-bold">{flagCount}</span>
                <span className="text-[var(--color-text-secondary)] font-medium">flagged</span>
              </span>
            )}
            {reviewCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-review)]" aria-hidden />
                <span className="num text-[var(--color-review)] font-bold">{reviewCount}</span>
                <span className="text-[var(--color-text-secondary)] font-medium">needs review</span>
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-[var(--color-text-muted)] num">
              <Clock className="h-3 w-3" aria-hidden />
              {(result.processingMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
