'use client'

// Client-side PDF → PNG rasterizer using pdfjs-dist.
// Server-side Vercel cannot run native canvas binaries — PDF rasterization happens
// in the browser and the PNG bytes are uploaded to the API instead.

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

let workerInitialized = false

async function ensurePdfJs(): Promise<typeof import('pdfjs-dist')> {
  const pdfjsLib = await import('pdfjs-dist')
  if (!workerInitialized) {
    // Use the locally bundled worker (copied to /public/pdf.worker.min.mjs by postinstall script
    // or referenced from the CDN as a fallback).
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
    workerInitialized = true
  }
  return pdfjsLib
}

/**
 * Rasterize the first page of a PDF File to a PNG File.
 * Returns the original File unchanged if it is not a PDF.
 */
export async function rasterizePdfFile(file: File): Promise<File> {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    return file
  }

  const pdfjsLib = await ensurePdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const page: PDFPageProxy = await pdf.getPage(1)

  // Render at 2x for OCR readability; sharp will downscale server-side if needed.
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Browser canvas context unavailable')
  }

  await page.render({ canvasContext: ctx, viewport }).promise

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))),
      'image/png',
    )
  })

  const baseName = file.name.replace(/\.pdf$/i, '') + '.png'
  return new File([blob], baseName, { type: 'image/png' })
}
