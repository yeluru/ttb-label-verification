import type { MockDataset } from './types'
import { TTB_STANDARD_WARNING_TEXT } from './field-comparison'

const W = TTB_STANDARD_WARNING_TEXT
const WARNING_TITLECASE =
  'Government Warning: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
const WARNING_WORDING_CHANGED =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, pregnant women should not drink alcoholic beverages because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'

const SPIRITS_BASE = {
  brandName: 'Old Tom Distillery',
  classType: 'Kentucky Straight Bourbon Whiskey',
  abv: '45',
  netContents: '750mL',
  producerName: 'Old Tom Distillery',
  producerAddress: '123 Bourbon St, Louisville, KY 40202',
  governmentWarning: W,
}

export const MOCK_DATASETS: MockDataset[] = [
  {
    label: 'spirits-pass',
    displayName: 'Spirits — All Fields Pass',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE },
    expectedOverall: 'PASS',
  },
  {
    label: 'spirits-abv-mismatch',
    displayName: 'Spirits — ABV Mismatch (FLAG)',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE, abv: '45' },
    expectedOverall: 'FLAG',
    expectedFlags: ['abv'],
  },
  {
    label: 'spirits-brand-case',
    displayName: 'Spirits — Brand Casing (PASS)',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE, brandName: 'Old Tom Distillery' },
    expectedOverall: 'PASS',
  },
  {
    label: 'spirits-brand-mismatch',
    displayName: 'Spirits — Brand Mismatch (FLAG)',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE, brandName: 'Old Tom Distillery' },
    expectedOverall: 'FLAG',
    expectedFlags: ['brandName'],
  },
  {
    label: 'spirits-warning-titlecase',
    displayName: 'Spirits — Warning Title Case (FLAG)',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE, governmentWarning: WARNING_TITLECASE },
    expectedOverall: 'FLAG',
    expectedFlags: ['governmentWarning'],
  },
  {
    label: 'spirits-warning-wording',
    displayName: 'Spirits — Warning Wording Changed (FLAG)',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE, governmentWarning: WARNING_WORDING_CHANGED },
    expectedOverall: 'FLAG',
    expectedFlags: ['governmentWarning'],
  },
  {
    label: 'spirits-warning-missing',
    displayName: 'Spirits — Warning Missing (FLAG)',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE },
    expectedOverall: 'FLAG',
    expectedFlags: ['governmentWarning'],
  },
  {
    label: 'spirits-import-pass',
    displayName: 'Spirits — Import Match (PASS)',
    beverageType: 'spirits',
    isImport: true,
    formData: { ...SPIRITS_BASE, countryOfOrigin: 'France' },
    expectedOverall: 'PASS',
  },
  {
    label: 'spirits-import-mismatch',
    displayName: 'Spirits — Import Mismatch (FLAG)',
    beverageType: 'spirits',
    isImport: true,
    formData: { ...SPIRITS_BASE, countryOfOrigin: 'Italy' },
    expectedOverall: 'FLAG',
    expectedFlags: ['countryOfOrigin'],
  },
  {
    label: 'spirits-degraded',
    displayName: 'Spirits — Degraded Image (NEEDS REVIEW)',
    beverageType: 'spirits',
    isImport: false,
    formData: { ...SPIRITS_BASE },
    expectedOverall: 'NEEDS REVIEW',
  },
  {
    label: 'wine-abv-blank-pass',
    displayName: 'Wine — ABV Blank Pass',
    beverageType: 'wine',
    isImport: false,
    formData: {
      brandName: 'Sonoma Hills Winery',
      classType: 'California Red Wine',
      abv: '',
      netContents: '750mL',
      producerName: 'Sonoma Hills Winery',
      producerAddress: '500 Vineyard Rd, Sonoma, CA 95476',
      governmentWarning: W,
    },
    expectedOverall: 'PASS',
  },
  {
    label: 'wine-abv-blank-flag',
    displayName: 'Wine — ABV on Label, Blank Form (FLAG)',
    beverageType: 'wine',
    isImport: false,
    formData: {
      brandName: 'Sonoma Hills Winery',
      classType: 'California Red Wine',
      abv: '',
      netContents: '750mL',
      producerName: 'Sonoma Hills Winery',
      producerAddress: '500 Vineyard Rd, Sonoma, CA 95476',
      governmentWarning: W,
    },
    expectedOverall: 'FLAG',
    expectedFlags: ['abv'],
  },
  {
    label: 'wine-appellation-pass',
    displayName: 'Wine — Appellation Match (PASS)',
    beverageType: 'wine',
    isImport: false,
    formData: {
      brandName: 'Sonoma Hills Winery',
      classType: 'Cabernet Sauvignon',
      abv: '13.5',
      netContents: '750mL',
      producerName: 'Sonoma Hills Winery',
      producerAddress: '500 Vineyard Rd, Sonoma, CA 95476',
      appellation: 'Napa Valley',
      governmentWarning: W,
    },
    expectedOverall: 'PASS',
  },
  {
    label: 'beer-abv-blank-pass',
    displayName: 'Beer — ABV Blank Pass',
    beverageType: 'beer',
    isImport: false,
    formData: {
      brandName: 'Pine Ridge Brewing',
      classType: 'India Pale Ale',
      abv: '',
      netContents: '12 FL OZ',
      producerName: 'Pine Ridge Brewing Co',
      producerAddress: '88 Pine St, Portland, OR 97204',
      governmentWarning: W,
    },
    expectedOverall: 'PASS',
  },
  {
    label: 'beer-abv-on-label',
    displayName: 'Beer — ABV on Label, Blank Form (FLAG)',
    beverageType: 'beer',
    isImport: false,
    formData: {
      brandName: 'Pine Ridge Brewing',
      classType: 'India Pale Ale',
      abv: '',
      netContents: '12 FL OZ',
      producerName: 'Pine Ridge Brewing Co',
      producerAddress: '88 Pine St, Portland, OR 97204',
      governmentWarning: W,
    },
    expectedOverall: 'FLAG',
    expectedFlags: ['abv'],
  },
]

export function findDataset(label: string): MockDataset | undefined {
  return MOCK_DATASETS.find((d) => d.label === label)
}
