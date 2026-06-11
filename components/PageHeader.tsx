import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-[#0B1F33] border border-[#1B4F8A]/30 shadow-[0_24px_44px_-32px_rgb(15_23_42/0.8)] p-5 sm:p-6 lg:p-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between fade-up">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-[#1B4F8A]"
      />
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow text-[#93C5FD]">{eyebrow}</div>}
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-white mt-2 leading-[1.08] text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-[15px] text-[#CBD5E1] mt-3 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 [&_.chip]:bg-white/10 [&_.chip]:text-white/85 [&_.chip_span]:text-white">{actions}</div>}
    </div>
  )
}
