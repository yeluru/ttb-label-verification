import type { MockDataset } from './types'

/**
 * Fetches the bundled JPG that corresponds to a MockDataset from /public/test-labels/
 * and returns it as a File ready to be staged as the upload.
 *
 * Test labels are committed in /public/test-labels/<key>.jpg — see scripts/generate-labels.mjs.
 */
export async function loadSampleFile(ds: MockDataset): Promise<File> {
  const url = `/test-labels/${ds.label}.jpg`
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) {
    throw new Error(`Sample label not found at ${url} (HTTP ${res.status})`)
  }
  const blob = await res.blob()
  return new File([blob], `${ds.label}.jpg`, { type: 'image/jpeg' })
}
