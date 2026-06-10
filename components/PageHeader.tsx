import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between fade-up">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow text-[#1B4F8A]">{eyebrow}</div>}
        <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-[#0F172A] mt-1.5 leading-[1.15] text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-[15px] text-[#475569] mt-2.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
