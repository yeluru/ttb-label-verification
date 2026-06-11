import sharp from 'sharp'
import { MAX_IMAGE_DIMENSION_PX } from './field-comparison'

/**
 * Resize an uploaded image to <= MAX_IMAGE_DIMENSION_PX on the long edge and
 * return a PNG buffer ready for base64 encoding.
 *
 * sharp is the right tool for this server-side. PDFs must be rasterized client-side
 * BEFORE upload — this function only handles raster image formats.
 */
export async function resizeForVision(
  buffer: Buffer,
): Promise<{ buffer: Buffer; mimeType: 'image/jpeg' }> {
  const image = sharp(buffer, { failOn: 'error' })
  const meta = await image.metadata()
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0)

  let pipeline = image
  if (longEdge > MAX_IMAGE_DIMENSION_PX) {
    pipeline = pipeline.resize({
      width: MAX_IMAGE_DIMENSION_PX,
      height: MAX_IMAGE_DIMENSION_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const out = await pipeline.jpeg({ quality: 80 }).toBuffer()
  return { buffer: out, mimeType: 'image/jpeg' }
}

export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
