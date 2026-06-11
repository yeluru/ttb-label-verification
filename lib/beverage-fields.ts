import type { BeverageType, FieldConfig, LabelFieldKey } from './types'

const SPIRITS_FIELDS: FieldConfig[] = [
  { key: 'brandName', label: 'Brand Name', matchType: 'fuzzy', required: 'always' },
  { key: 'classType', label: 'Class/Type', matchType: 'fuzzy', required: 'always' },
  { key: 'abv', label: 'ABV', matchType: 'numeric', required: 'always' },
  { key: 'netContents', label: 'Net Contents', matchType: 'fuzzy', required: 'always' },
  { key: 'producerName', label: 'Producer Name', matchType: 'fuzzy', required: 'always' },
  { key: 'producerAddress', label: 'Producer Address', matchType: 'fuzzy', required: 'always' },
  { key: 'countryOfOrigin', label: 'Country of Origin', matchType: 'fuzzy', required: 'optional', notes: 'both-absent-pass' },
  { key: 'governmentWarning', label: 'Government Warning', matchType: 'exact', required: 'always' },
]

const WINE_FIELDS: FieldConfig[] = [
  { key: 'brandName', label: 'Brand Name', matchType: 'fuzzy', required: 'always' },
  { key: 'classType', label: 'Class/Type', matchType: 'fuzzy', required: 'always' },
  { key: 'abv', label: 'ABV', matchType: 'numeric', required: 'conditional', notes: 'both-absent-pass' },
  { key: 'netContents', label: 'Net Contents', matchType: 'fuzzy', required: 'always' },
  { key: 'producerName', label: 'Producer Name', matchType: 'fuzzy', required: 'always' },
  { key: 'producerAddress', label: 'Producer Address', matchType: 'fuzzy', required: 'always' },
  { key: 'appellation', label: 'Appellation (if claimed)', matchType: 'fuzzy', required: 'optional', notes: 'both-absent-pass' },
  { key: 'countryOfOrigin', label: 'Country of Origin', matchType: 'fuzzy', required: 'optional', notes: 'both-absent-pass' },
  { key: 'governmentWarning', label: 'Government Warning', matchType: 'exact', required: 'always' },
]

const BEER_FIELDS: FieldConfig[] = [
  { key: 'brandName', label: 'Brand Name', matchType: 'fuzzy', required: 'always' },
  { key: 'classType', label: 'Class/Type', matchType: 'fuzzy', required: 'always' },
  { key: 'abv', label: 'ABV', matchType: 'numeric', required: 'optional', notes: 'both-absent-pass' },
  { key: 'netContents', label: 'Net Contents', matchType: 'fuzzy', required: 'always' },
  { key: 'producerName', label: 'Producer Name', matchType: 'fuzzy', required: 'always' },
  { key: 'producerAddress', label: 'Producer Address', matchType: 'fuzzy', required: 'always' },
  { key: 'countryOfOrigin', label: 'Country of Origin', matchType: 'fuzzy', required: 'optional', notes: 'both-absent-pass' },
  { key: 'governmentWarning', label: 'Government Warning', matchType: 'exact', required: 'always' },
]

export const BEVERAGE_FIELDS: Record<BeverageType, FieldConfig[]> = {
  spirits: SPIRITS_FIELDS,
  wine: WINE_FIELDS,
  beer: BEER_FIELDS,
}

/**
 * Returns the field list for the given beverage type.
 * Country of origin is always included as an optional field — if both form
 * and label omit it, the field passes automatically (both-absent-pass).
 */
export function getApplicableFields(
  beverageType: BeverageType,
): FieldConfig[] {
  return BEVERAGE_FIELDS[beverageType]
}

export function getFieldConfig(
  beverageType: BeverageType,
  key: LabelFieldKey,
): FieldConfig | undefined {
  return BEVERAGE_FIELDS[beverageType].find((f) => f.key === key)
}
