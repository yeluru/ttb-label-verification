import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="eyebrow text-[#1B4F8A]">{eyebrow}</div>
        )}
        <h1 className="text-[22px] sm:text-2xl font-semibold tracking-tight text-[#0F172A] mt-1">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#475569] mt-1.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
