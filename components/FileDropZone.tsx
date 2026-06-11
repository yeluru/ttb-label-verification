'use client'

import { Upload, X, FileText, FileImage, Info, CheckCircle2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface Props {
  file: File | null
  onFile: (f: File | null) => void
  accept?: string
  multiple?: boolean
  onFiles?: (files: File[]) => void
  error?: string | null
  helperHint?: string
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function fileIcon(name: string) {
  if (/\.pdf$/i.test(name)) return FileText
  return FileImage
}

export function FileDropZone({
  file,
  onFile,
  onFiles,
  multiple = false,
  accept = '.jpg,.jpeg,.png,.pdf,application/pdf,image/jpeg,image/png',
  error,
  helperHint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      if (multiple && onFiles) {
        onFiles(Array.from(fileList))
      } else {
        onFile(fileList[0])
      }
    },
    [multiple, onFiles, onFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  if (file && !multiple) {
    const Icon = fileIcon(file.name)
    const isPdf = /\.pdf$/i.test(file.name)
    return (
      <div className="space-y-2 fade-up">
        <div className="group relative flex items-center gap-3 rounded-md bg-[var(--color-pass-bg)] border border-[var(--color-pass-border)] px-3 py-2.5 shadow-[0_0_12px_var(--color-pass-border)]">
          <span className="h-10 w-10 rounded-md bg-[var(--color-surface)] border border-[var(--color-pass-border)] inline-flex items-center justify-center shrink-0">
            <Icon className="h-4.5 w-4.5 text-[var(--color-pass)]" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="text-[13.5px] font-semibold text-[var(--color-text)] truncate flex items-center gap-1.5"
              title={file.name}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-pass)] shrink-0" aria-hidden />
              {file.name}
            </div>
            <div className="text-[11px] text-[var(--color-pass)] num mt-0.5">
              {formatBytes(file.size)} · Ready to verify
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label="Remove file"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-flag)] hover:bg-[var(--color-background-alt)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {isPdf && (
          <div className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)] px-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden />
            <span>Page 1 of the PDF will be rasterized client-side before upload.</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`group w-full rounded-lg border-2 border-dashed flex items-center gap-3 px-3.5 py-3 transition-all duration-200 cursor-pointer ${
          dragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint-strong)] shadow-inner animate-pulse'
            : error
              ? 'border-[var(--color-flag)] bg-[var(--color-flag-bg)] hover:bg-[var(--color-flag-bg)]/80'
              : 'border-[var(--color-border)] bg-[var(--color-surface-quiet)] hover:border-[var(--color-primary)]/70 hover:bg-[var(--color-surface-elevated)]'
        }`}
      >
        <span
          className={`relative h-8 w-8 rounded-md inline-flex items-center justify-center shrink-0 transition-all duration-300 group-hover:-translate-y-0.5 ${
            dragOver ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface)] border border-[var(--color-border)]'
          }`}
        >
          <Upload
            className={`h-4 w-4 ${dragOver ? 'text-white' : 'text-[var(--color-primary)]'}`}
            aria-hidden
            strokeWidth={2.25}
          />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
            {multiple ? 'Drop files or click to browse' : 'Drop label or click to browse'}
          </div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {multiple
              ? 'JPG, PNG, or PDF · multiple'
              : 'JPG, PNG, or PDF · up to 10 MB'}
          </div>
          {helperHint && (
            <div className="text-[11px] text-[var(--color-text-muted)]">{helperHint}</div>
          )}
        </div>
      </button>
      {error && (
        <p
          role="alert"
          className="text-[12px] text-[var(--color-flag)] flex items-center gap-1.5 fade-up"
        >
          <span className="h-1 w-1 rounded-full bg-[var(--color-flag)]" aria-hidden />
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
