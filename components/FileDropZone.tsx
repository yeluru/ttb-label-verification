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
        <div className="group relative flex items-center gap-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2.5">
          <span className="h-10 w-10 rounded-md bg-white border border-[#BBF7D0] inline-flex items-center justify-center shrink-0">
            <Icon className="h-4.5 w-4.5 text-[#16A34A]" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="text-[13.5px] font-semibold text-[#0F172A] truncate flex items-center gap-1.5"
              title={file.name}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] shrink-0" aria-hidden />
              {file.name}
            </div>
            <div className="text-[11px] text-[#15803D] num mt-0.5">
              {formatBytes(file.size)} · Ready to verify
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label="Remove file"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[#475569] hover:text-[#DC2626] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {isPdf && (
          <div className="flex items-start gap-1.5 text-[11px] text-[#475569] px-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0 text-[#1B4F8A]" aria-hidden />
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
        className={`group w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 px-4 py-7 transition-all duration-200 cursor-pointer text-center ${
          dragOver
            ? 'border-[#1B4F8A] bg-[#EEF4FB] scale-[1.005] shadow-inner'
            : error
              ? 'border-[#FECACA] bg-[#FEF2F2]/50 hover:bg-[#FEF2F2]'
              : 'border-[#CBD5E1] bg-white hover:border-[#1B4F8A] hover:bg-[#EEF4FB]/50'
        }`}
      >
        <span
          className={`relative h-12 w-12 rounded-full inline-flex items-center justify-center transition-transform duration-200 ${
            dragOver ? 'bg-[#1B4F8A] scale-110' : 'bg-[#EEF4FB] group-hover:scale-105'
          }`}
        >
          <Upload
            className={`h-5 w-5 ${dragOver ? 'text-white' : 'text-[#1B4F8A]'}`}
            aria-hidden
            strokeWidth={2.25}
          />
        </span>
        <div className="space-y-1">
          <div className="text-[14px] font-semibold text-[#0F172A]">
            {multiple ? 'Drop label files here' : 'Drop label here or click to browse'}
          </div>
          <div className="text-[12px] text-[#64748B]">
            {multiple
              ? 'JPG, PNG, or PDF · select multiple at once'
              : 'JPG, PNG, or PDF · up to 10 MB'}
          </div>
          {helperHint && (
            <div className="text-[11px] text-[#94A3B8] mt-1">{helperHint}</div>
          )}
        </div>
      </button>
      {error && (
        <p
          role="alert"
          className="text-[12px] text-[#DC2626] flex items-center gap-1.5 fade-up"
        >
          <span className="h-1 w-1 rounded-full bg-[#DC2626]" aria-hidden />
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
