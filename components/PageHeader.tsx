import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-[var(--color-surface-quiet)] backdrop-blur-md border border-[var(--color-border)] shadow-[var(--shadow-floating)] p-5 sm:p-6 lg:p-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between fade-up">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-[var(--color-primary)]"
      />
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow text-[var(--color-primary)] font-bold">{eyebrow}</div>}
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[var(--color-text)] mt-2 leading-[1.08] text-balance" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
          {title}
        </h1>
        {description && (
          <p className="text-[15px] text-[var(--color-text-secondary)] mt-3 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 [&_.chip]:bg-[var(--color-surface-quiet)] [&_.chip]:border [&_.chip]:border-[var(--color-border)] [&_.chip]:text-[var(--color-text-secondary)] [&_.chip_span]:text-[var(--color-text)]">{actions}</div>}
    </div>
  )
}
