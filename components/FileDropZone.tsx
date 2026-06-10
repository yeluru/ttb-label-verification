'use client'

import { Upload, X, FileText, Info } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface Props {
  file: File | null
  onFile: (f: File | null) => void
  accept?: string
  multiple?: boolean
  onFiles?: (files: File[]) => void
  error?: string | null
}

export function FileDropZone({
  file,
  onFile,
  onFiles,
  multiple = false,
  accept = '.jpg,.jpeg,.png,.pdf,application/pdf,image/jpeg,image/png',
  error,
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
    const isPdf = /\.pdf$/i.test(file.name)
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2">
          <FileText className="h-4 w-4 text-[#64748B] shrink-0" aria-hidden />
          <span className="text-sm text-[#1E293B] truncate flex-1" title={file.name}>
            {file.name}
          </span>
          <span className="text-xs text-[#94A3B8]">
            {(file.size / 1024).toFixed(0)} KB
          </span>
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label="Remove file"
            className="text-[#94A3B8] hover:text-[#DC2626] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A] rounded-sm cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {isPdf && (
          <div className="flex items-start gap-1.5 text-xs text-[#94A3B8]">
            <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
            <span>PDF page 1 will be used for verification.</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] cursor-pointer ${
          dragOver
            ? 'border-[#1B4F8A] bg-[#EFF6FF]'
            : error
              ? 'border-[#DC2626] bg-white hover:bg-[#F8FAFC]'
              : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
        } ${multiple ? 'h-[100px]' : 'h-20'}`}
      >
        <Upload className="h-5 w-5 text-[#94A3B8]" aria-hidden />
        <span className="text-sm text-[#64748B]">
          {multiple
            ? 'Drop all label files here or click to browse'
            : 'Drop label here or click to browse'}
        </span>
        <span className="text-xs text-[#94A3B8]">
          {multiple ? 'JPG, PNG or PDF — select multiple at once' : 'JPG, PNG or PDF'}
        </span>
      </button>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
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
