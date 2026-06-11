import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import type { FieldResult } from '@/lib/types'
import { TTB_STANDARD_WARNING_TEXT } from '@/lib/field-comparison'

const STYLES = {
  pass: {
    bg: 'bg-transparent',
    icon: CheckCircle2,
    iconColor: 'text-[var(--color-pass)]',
    iconBg: 'bg-[var(--color-pass-bg)]',
    label: 'PASS',
    labelClass: 'bg-[var(--color-pass-bg)] text-[var(--color-pass)] ring-1 ring-inset ring-[var(--color-pass-border)]',
    reasonColor: 'text-[var(--color-text-secondary)]',
    accentBar: '',
  },
  flag: {
    bg: 'bg-[var(--color-flag-bg)]/20',
    icon: XCircle,
    iconColor: 'text-[var(--color-flag)]',
    iconBg: 'bg-[var(--color-flag-bg)]',
    label: 'FLAG',
    labelClass: 'bg-[var(--color-flag-bg)] text-[var(--color-flag)] ring-1 ring-inset ring-[var(--color-flag-border)]',
    reasonColor: 'text-[var(--color-flag)]',
    accentBar: 'before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[var(--color-flag)]',
  },
  'needs-review': {
    bg: 'bg-[var(--color-review-bg)]/20',
    icon: HelpCircle,
    iconColor: 'text-[var(--color-review)]',
    iconBg: 'bg-[var(--color-review-bg)]',
    label: 'REVIEW',
    labelClass: 'bg-[var(--color-review-bg)] text-[var(--color-review)] ring-1 ring-inset ring-[var(--color-review-border)]',
    reasonColor: 'text-[var(--color-review)]',
    accentBar: 'before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[var(--color-review)]',
  },
} as const

function diffWords(str1: string, str2: string) {
  const tokens1 = str1.split(/(\s+)/).filter(Boolean)
  const tokens2 = str2.split(/(\s+)/).filter(Boolean)

  const dp: number[][] = Array(tokens1.length + 1)
    .fill(null)
    .map(() => Array(tokens2.length + 1).fill(0))

  for (let i = 1; i <= tokens1.length; i++) {
    for (let j = 1; j <= tokens2.length; j++) {
      if (tokens1[i - 1] === tokens2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const result: { type: 'match' | 'insert' | 'delete'; text: string }[] = []
  let i = tokens1.length
  let j = tokens2.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokens1[i - 1] === tokens2[j - 1]) {
      result.unshift({ type: 'match', text: tokens1[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', text: tokens2[j - 1] })
      j--
    } else {
      result.unshift({ type: 'delete', text: tokens1[i - 1] })
      i--
    }
  }

  return result
}

function renderDiff(expected: string, actual: string) {
  const diff = diffWords(expected, actual)
  return (
    <>
      {diff.map((token, idx) => {
        const isWhitespace = /^\s+$/.test(token.text)
        if (token.type === 'match') {
          return <span key={idx}>{token.text}</span>
        } else if (token.type === 'insert') {
          if (isWhitespace) {
            return <span key={idx}>{token.text}</span>
          }
          return (
            <span
              key={idx}
              className="bg-red-500/20 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold px-0.5 rounded border border-red-500/20"
            >
              {token.text}
            </span>
          )
        } else {
          if (isWhitespace) {
            return <span key={idx} className="line-through text-red-500/30">{token.text}</span>
          }
          return (
            <span
              key={idx}
              className="line-through bg-red-500/5 dark:bg-red-950/10 text-red-400/50 dark:text-red-500/30 px-0.5 rounded decoration-red-500/50"
            >
              {token.text}
            </span>
          )
        }
      })}
    </>
  )
}

export function FieldResultRow({
  result,
  isLast,
}: {
  result: FieldResult
  isLast?: boolean
}) {
  const s = STYLES[result.status]
  const Icon = s.icon

  const isWarningMismatch = result.fieldKey === 'governmentWarning' && result.status !== 'pass'

  return (
    <div
      className={`relative ${s.bg} ${s.accentBar} px-5 py-4 ${
        isLast ? '' : 'border-b border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`h-7 w-7 rounded-full inline-flex items-center justify-center shrink-0 ${s.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${s.iconColor}`} strokeWidth={2.25} aria-label={s.label} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[13.5px] font-semibold text-[var(--color-text)]">
              {result.fieldName}
            </span>
            <span
              className={`inline-flex items-center rounded-full border ${s.labelClass} px-2 h-5 text-[10px] font-bold tracking-[0.08em]`}
            >
              {s.label}
            </span>
          </div>
          {result.status !== 'pass' && result.reason && (
            <p className={`text-[12.5px] mt-1.5 leading-relaxed ${s.reasonColor}`}>
              {result.reason}
            </p>
          )}
          {(result.submittedValue || result.extractedValue !== null || isWarningMismatch) && (
            <div className="mt-2.5 grid grid-cols-[68px_1fr] gap-x-3 gap-y-1.5 text-[12px] bg-[var(--color-surface-quiet)] border border-[var(--color-border)] rounded-md px-3 py-2">
              {isWarningMismatch ? (
                <>
                  <span className="text-[var(--color-text-secondary)] uppercase tracking-[0.06em] text-[10px] font-semibold pt-px">
                    Standard
                  </span>
                  <span className="font-mono text-[var(--color-text)] break-words leading-snug">
                    {TTB_STANDARD_WARNING_TEXT}
                  </span>

                  {result.submittedValue && (
                    <>
                      <span className="text-[var(--color-text-secondary)] uppercase tracking-[0.06em] text-[10px] font-semibold pt-px">
                        Form
                      </span>
                      <span className="font-mono text-[var(--color-text)] break-words leading-snug">
                        {renderDiff(TTB_STANDARD_WARNING_TEXT, result.submittedValue)}
                      </span>
                    </>
                  )}

                  {result.extractedValue !== null && (
                    <>
                      <span className="text-[var(--color-text-secondary)] uppercase tracking-[0.06em] text-[10px] font-semibold pt-px">
                        Label
                      </span>
                      <span className="font-mono text-[var(--color-text)] break-words leading-snug">
                        {renderDiff(TTB_STANDARD_WARNING_TEXT, result.extractedValue)}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  {result.submittedValue && (
                    <>
                      <span className="text-[var(--color-text-secondary)] uppercase tracking-[0.06em] text-[10px] font-semibold pt-px">
                        Form
                      </span>
                      <span className="font-mono text-[var(--color-text)] break-words leading-snug">
                        {result.status === 'flag' && result.extractedValue !== null
                          ? result.submittedValue
                          : truncate(result.submittedValue, 240)}
                      </span>
                    </>
                  )}
                  {result.extractedValue !== null && (
                    <>
                      <span className="text-[var(--color-text-secondary)] uppercase tracking-[0.06em] text-[10px] font-semibold pt-px">
                        Label
                      </span>
                      <span className="font-mono text-[var(--color-text)] break-words leading-snug">
                        {result.status === 'flag' && result.submittedValue
                          ? renderDiff(result.submittedValue, result.extractedValue)
                          : truncate(result.extractedValue, 240)}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}

