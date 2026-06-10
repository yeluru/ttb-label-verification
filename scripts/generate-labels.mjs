// Generate test label HTML files and rasterize them to JPGs in /public/test-labels/.
// Run with: npm run generate-labels
//
// Each entry below is the single source of truth for both the HTML label artwork
// and the expected mock-data values. Run this once during build; the produced JPGs
// are committed to /public/test-labels/ and served by the deployed app.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const HTML_DIR = path.join(ROOT, 'test-labels/html')
const JPG_DIR = path.join(ROOT, 'public/test-labels')

const STANDARD_WARNING =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
const TITLECASE_WARNING =
  'Government Warning: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
const WORDING_WARNING =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, pregnant women should not drink alcoholic beverages because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'

const SPIRITS_CLASS = 'Kentucky Straight Bourbon Whiskey'
const WINE_PRODUCER = 'Sonoma Hills Winery'
const WINE_ADDRESS = '500 Vineyard Rd, Sonoma, CA 95476'
const BEER_PRODUCER = 'Pine Ridge Brewing Co'
const BEER_ADDRESS = '88 Pine St, Portland, OR 97204'

/** @type {Array<{key:string,kind:string,vars:Record<string,any>,degrade?:boolean,omitWarning?:boolean}>} */
const LABELS = [
  // Spirits — clean
  {
    key: 'spirits-pass',
    kind: 'spirits',
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: STANDARD_WARNING,
    },
  },
  // Spirits — ABV says 46 but mock data says 45 → FLAG
  {
    key: 'spirits-abv-mismatch',
    kind: 'spirits',
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '46% Alc./Vol. (92 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: STANDARD_WARNING,
    },
  },
  // Brand casing in ALL CAPS — fuzzy match passes
  {
    key: 'spirits-brand-case',
    kind: 'spirits',
    vars: {
      brand: 'OLD TOM DISTILLERY',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: STANDARD_WARNING,
    },
  },
  // Brand wrong words — FLAG
  {
    key: 'spirits-brand-mismatch',
    kind: 'spirits',
    vars: {
      brand: 'Old Tom',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: STANDARD_WARNING,
    },
  },
  // Warning in title case — FLAG
  {
    key: 'spirits-warning-titlecase',
    kind: 'spirits',
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: TITLECASE_WARNING,
    },
  },
  // Warning wording changed — FLAG
  {
    key: 'spirits-warning-wording',
    kind: 'spirits',
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: WORDING_WARNING,
    },
  },
  // Warning missing entirely — FLAG
  {
    key: 'spirits-warning-missing',
    kind: 'spirits',
    omitWarning: true,
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: '',
    },
  },
  // Imported spirits — country matches
  {
    key: 'spirits-import-pass',
    kind: 'spirits',
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      country: 'Product of France',
      producerLine:
        'Imported by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: STANDARD_WARNING,
    },
  },
  // Imported spirits — wrong country (label France vs form Italy)
  {
    key: 'spirits-import-mismatch',
    kind: 'spirits',
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      country: 'Product of France',
      producerLine:
        'Imported by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: STANDARD_WARNING,
    },
  },
  // Degraded — clean text but rendered with glare overlay
  {
    key: 'spirits-degraded',
    kind: 'spirits',
    degrade: true,
    vars: {
      brand: 'Old Tom Distillery',
      classType: SPIRITS_CLASS,
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750mL',
      producerLine:
        'Bottled by Old Tom Distillery, 123 Bourbon St, Louisville, KY 40202',
      warning: STANDARD_WARNING,
    },
  },
  // Wine — no ABV on label
  {
    key: 'wine-abv-blank-pass',
    kind: 'wine',
    vars: {
      brand: WINE_PRODUCER,
      classType: 'California Red Wine',
      netContents: '750mL',
      producerLine: `Produced and bottled by ${WINE_PRODUCER}, ${WINE_ADDRESS}`,
      warning: STANDARD_WARNING,
    },
  },
  // Wine — label shows 15% ABV, form blank → FLAG
  {
    key: 'wine-abv-blank-flag',
    kind: 'wine',
    vars: {
      brand: WINE_PRODUCER,
      classType: 'California Red Wine',
      abv: '15% Alc./Vol.',
      netContents: '750mL',
      producerLine: `Produced and bottled by ${WINE_PRODUCER}, ${WINE_ADDRESS}`,
      warning: STANDARD_WARNING,
    },
  },
  // Wine — appellation matches
  {
    key: 'wine-appellation-pass',
    kind: 'wine',
    vars: {
      brand: WINE_PRODUCER,
      classType: 'Cabernet Sauvignon',
      appellation: 'Napa Valley',
      abv: '13.5% Alc./Vol.',
      netContents: '750mL',
      producerLine: `Produced and bottled by ${WINE_PRODUCER}, ${WINE_ADDRESS}`,
      warning: STANDARD_WARNING,
    },
  },
  // Beer — no ABV anywhere
  {
    key: 'beer-abv-blank-pass',
    kind: 'beer',
    vars: {
      brand: 'Pine Ridge Brewing',
      classType: 'India Pale Ale',
      netContents: '12 FL OZ',
      producerLine: `Brewed and bottled by ${BEER_PRODUCER}, ${BEER_ADDRESS}`,
      warning: STANDARD_WARNING,
    },
  },
  // Beer — label shows ABV, form blank → FLAG
  {
    key: 'beer-abv-on-label',
    kind: 'beer',
    vars: {
      brand: 'Pine Ridge Brewing',
      classType: 'India Pale Ale',
      abv: '5.2% Alc./Vol.',
      netContents: '12 FL OZ',
      producerLine: `Brewed and bottled by ${BEER_PRODUCER}, ${BEER_ADDRESS}`,
      warning: STANDARD_WARNING,
    },
  },
]

function buildHtml(entry) {
  const v = entry.vars
  const abvHtml = v.abv ? `<p class="abv">${v.abv}</p>` : ''
  const appellationHtml = v.appellation
    ? `<p class="appellation">${v.appellation}</p>`
    : ''
  const countryHtml = v.country ? `<p class="country">${v.country}</p>` : ''
  const warningHtml = entry.omitWarning
    ? ''
    : `<p class="warning">${v.warning}</p>`
  const degradeStyles = entry.degrade
    ? `<style>
        .glare {
          position: absolute;
          top: 36%;
          left: 18%;
          width: 64%;
          height: 12%;
          background: linear-gradient(120deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4) 65%, rgba(255,255,255,0) 100%);
          filter: blur(6px);
          pointer-events: none;
        }
        .label { position: relative; }
      </style>`
    : ''
  const glareDiv = entry.degrade ? '<div class="glare" aria-hidden="true"></div>' : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${entry.key}</title>
<link rel="stylesheet" href="_template.css">
${degradeStyles}
</head>
<body>
  <div class="label ${entry.kind}">
    ${glareDiv}
    <p class="subtitle">${entry.kind === 'wine' ? 'Vineyards' : entry.kind === 'beer' ? 'Brewery' : 'Distillery'}</p>
    <div class="flourish"></div>
    <h1 class="brand">${v.brand}</h1>
    <div class="flourish"></div>
    <p class="class-type">${v.classType}</p>
    ${appellationHtml}
    ${abvHtml}
    <p class="net-contents">${v.netContents}</p>
    ${countryHtml}
    <p class="producer"><span class="name">${v.producerLine}</span></p>
    ${warningHtml}
  </div>
</body>
</html>`
}

async function main() {
  await fs.mkdir(HTML_DIR, { recursive: true })
  await fs.mkdir(JPG_DIR, { recursive: true })

  for (const entry of LABELS) {
    const html = buildHtml(entry)
    await fs.writeFile(path.join(HTML_DIR, `${entry.key}.html`), html, 'utf8')
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    for (const entry of LABELS) {
      const page = await browser.newPage()
      await page.setViewport({ width: 1000, height: 1300, deviceScaleFactor: 2 })
      const url = 'file://' + path.join(HTML_DIR, `${entry.key}.html`)
      await page.goto(url, { waitUntil: 'networkidle0' })
      await page.waitForSelector('.label')
      const element = await page.$('.label')
      if (!element) throw new Error(`No .label in ${entry.key}`)
      const target = path.join(JPG_DIR, `${entry.key}.jpg`)
      await element.screenshot({ path: target, type: 'jpeg', quality: 92 })
      console.log('✓ wrote', path.relative(ROOT, target))
      await page.close()
    }
  } finally {
    await browser.close()
  }

  console.log(`\nDone. ${LABELS.length} test labels generated.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
