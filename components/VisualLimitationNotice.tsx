import { Eye } from 'lucide-react'

export function VisualLimitationNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] p-3"
    >
      <Eye className="h-4 w-4 mt-0.5 text-[#D97706] shrink-0" aria-hidden />
      <p className="text-[13px] text-[#475569] leading-relaxed">
        <span className="text-[#0F172A] font-semibold">Visual limitation: </span>
        Bold formatting and font size of the government warning cannot be verified
        automatically. Please confirm visually.
      </p>
    </div>
  )
}
