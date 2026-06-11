import { readFileSync } from 'fs';
import sharp from 'sharp';

async function run() {
  const labelPath = './public/test-labels/spirits-pass.jpg';
  const buffer = readFileSync(labelPath);

  console.log('--- Timing sharp operations ---');
  const t0 = Date.now();
  const image = sharp(buffer, { failOn: 'error' });
  const meta = await image.metadata();
  console.log(`Metadata read: ${Date.now() - t0}ms`);

  const t1 = Date.now();
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  let pipeline = image;
  if (longEdge > 800) {
    pipeline = pipeline.resize({
      width: 800,
      height: 800,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  const out = await pipeline.jpeg({ quality: 80 }).toBuffer();
  console.log(`Sharp conversion to JPEG: ${Date.now() - t1}ms`);
  console.log(`Total sharp pipeline: ${Date.now() - t0}ms`);
}

run().catch(console.error);
