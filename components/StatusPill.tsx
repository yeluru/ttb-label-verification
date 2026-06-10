import { CheckCircle2, XCircle, HelpCircle, type LucideIcon } from 'lucide-react'
import type { OverallStatus } from '@/lib/types'

const STYLES: Record<
  OverallStatus,
  { bg: string; text: string; border: string; ring: string; icon: LucideIcon }
> = {
  PASS: {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#16A34A]',
    border: 'border-[#BBF7D0]',
    ring: 'ring-[#16A34A]/20',
    icon: CheckCircle2,
  },
  FLAG: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
    ring: 'ring-[#DC2626]/20',
    icon: XCircle,
  },
  'NEEDS REVIEW': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#FDE68A]',
    ring: 'ring-[#D97706]/20',
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
