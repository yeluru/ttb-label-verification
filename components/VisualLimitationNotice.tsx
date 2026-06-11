import { Eye } from 'lucide-react'

export function VisualLimitationNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-md bg-[var(--color-review-bg)] border border-[var(--color-review-border)] p-3"
    >
      <Eye className="h-4 w-4 mt-0.5 text-[var(--color-review)] shrink-0" aria-hidden />
      <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
        <span className="text-[var(--color-review)] font-semibold">Visual limitation: </span>
        Bold formatting and font size of the government warning cannot be verified
        automatically. Please confirm visually.
      </p>
    </div>
  )
}
