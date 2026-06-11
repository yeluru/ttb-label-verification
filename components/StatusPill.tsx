import { CheckCircle2, XCircle, HelpCircle, type LucideIcon } from 'lucide-react'
import type { OverallStatus } from '@/lib/types'

const STYLES: Record<
  OverallStatus,
  { bg: string; text: string; border: string; ring: string; icon: LucideIcon }
> = {
  PASS: {
    bg: 'bg-[var(--color-pass-bg)]',
    text: 'text-[var(--color-pass)]',
    border: 'border-[var(--color-pass-border)]',
    ring: 'ring-[var(--color-pass-border)]',
    icon: CheckCircle2,
  },
  FLAG: {
    bg: 'bg-[var(--color-flag-bg)]',
    text: 'text-[var(--color-flag)]',
    border: 'border-[var(--color-flag-border)]',
    ring: 'ring-[var(--color-flag-border)]',
    icon: XCircle,
  },
  'NEEDS REVIEW': {
    bg: 'bg-[var(--color-review-bg)]',
    text: 'text-[var(--color-review)]',
    border: 'border-[var(--color-review-border)]',
    ring: 'ring-[var(--color-review-border)]',
    icon: HelpCircle,
  },
}

interface Props {
  status: OverallStatus | 'ERROR'
  count?: number
  label?: string
  size?: 'sm' | 'md'
}

export function StatusPill({ status, count, label, size = 'md' }: Props) {
  const variant =
    status === 'ERROR'
      ? STYLES.FLAG
      : STYLES[status]
  const Icon = variant.icon
  const displayLabel = label ?? (status === 'ERROR' ? 'ERROR' : status)
  const sizeClasses =
    size === 'sm'
      ? 'h-6 px-2 text-[11px] gap-1.5'
      : 'h-7 px-2.5 text-xs gap-1.5'
  return (
    <span
      className={`inline-flex items-center rounded-md border ${variant.bg} ${variant.text} ${variant.border} font-semibold tracking-wide ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
      {typeof count === 'number' && (
        <span className="num font-bold">{count}</span>
      )}
      <span>{displayLabel}</span>
    </span>
  )
}
