import { Eye } from 'lucide-react'

export function VisualLimitationNotice() {
  return (
    <div className="flex items-start gap-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-md p-3 text-sm">
      <Eye className="h-4 w-4 mt-0.5 text-[#D97706] shrink-0" aria-hidden />
      <p className="text-[#64748B] leading-snug">
        <span className="text-[#1E293B] font-medium">Visual limitation: </span>
        Bold formatting and font size of the government warning cannot be verified
        automatically. Please confirm visually.
      </p>
    </div>
  )
}
