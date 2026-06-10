import { CheckCircle2, XCircle, AlertTriangle, type LucideIcon } from 'lucide-react'
import type { OverallStatus } from '@/lib/types'

interface Props {
  status: OverallStatus
  processingMs?: number
}

const STYLES: Record<
  OverallStatus,
  { bg: string; text: string; border: string; icon: LucideIcon }
> = {
  PASS: { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/30', icon: CheckCircle2 },
  FLAG: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#DC2626]/30', icon: XCircle },
  'NEEDS REVIEW': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#D97706]/30',
    icon: AlertTriangle,
  },
}

export function OverallBadge({ status, processingMs }: Props) {
  const s = STYLES[status]
  const Icon = s.icon
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-md border ${s.border} ${s.bg} p-4`}
    >
      <Icon className={`h-6 w-6 mt-0.5 ${s.text}`} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className={`text-lg font-bold ${s.text}`}>{status}</div>
        {typeof processingMs === 'number' && (
          <div className="text-xs text-[#64748B] mt-0.5">
            Analyzed in {(processingMs / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  )
}
