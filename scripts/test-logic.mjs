import { fuzzyNormalize, warningNormalize, extractAbvNumber, compareFields } from '../lib/field-comparison.ts'
import { MOCK_DATASETS } from '../lib/mock-data.ts'
import { MockProvider } from '../lib/ai-provider.ts'
import { getApplicableFields } from '../lib/beverage-fields.ts'
import assert from 'node:assert'

console.log('--- Running helper validation ---')

// Test 1: Fuzzy normalization punctuation stripping
const norm1 = fuzzyNormalize("STONE'S THROW")
const norm2 = fuzzyNormalize("Stone's Throw")
const norm3 = fuzzyNormalize("Stones Throw")
console.log('norm1:', norm1)
console.log('norm2:', norm2)
console.log('norm3:', norm3)
assert.strictEqual(norm1, 'stones throw')
assert.strictEqual(norm2, 'stones throw')
assert.strictEqual(norm3, 'stones throw')
console.log('✓ Fuzzy normalization strips apostrophes correctly')

// Test 2: Fuzzy normalization keeps decimals
const abvNorm = fuzzyNormalize("45.5%")
console.log('abvNorm:', abvNorm)
assert.strictEqual(abvNorm, '45.5')
console.log('✓ Fuzzy normalization keeps decimal points')

// Test 3: warningNormalize collapses spaces and line breaks
const warnRaw = "GOVERNMENT WARNING:\n(1) According to the Surgeon\nGeneral,  women should not"
const warnNorm = warningNormalize(warnRaw)
console.log('warnNorm:', warnNorm)
assert.strictEqual(warnNorm, 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not')
console.log('✓ Warning normalization collapses line breaks and spaces')

// Test 4: extractAbvNumber
assert.strictEqual(extractAbvNumber('45% Alc./Vol.'), 45)
assert.strictEqual(extractAbvNumber('5.2%'), 5.2)
assert.strictEqual(Number.isNaN(extractAbvNumber('No abv')), true)
console.log('✓ ABV number extraction matches expected floats')

// Test 5: Mock datasets and comparison runs
console.log('\n--- Running mock provider test case simulation ---')
const provider = new MockProvider()

for (const ds of MOCK_DATASETS) {
  // Mock filename like spirits-pass.jpg
  const filename = `${ds.label}.jpg`
  const fieldList = getApplicableFields(ds.beverageType, ds.isImport)
  
  const extractionInput = {
    imageBase64: '',
    mimeType: 'image/jpeg',
    beverageType: ds.beverageType,
    importedProduct: ds.isImport,
    fieldList,
    filename,
    submittedFields: ds.formData
  }

  const extraction = await provider.extractFields(extractionInput)
  const result = compareFields(extraction, ds.formData, ds.beverageType, ds.isImport)
  
  console.log(`Dataset [${ds.label}] -> expected overall: ${ds.expectedOverall}, actual overall: ${result.overall}`)
  
  // Degraded case could be PASS or NEEDS REVIEW depending on exact logic, but let's assert others
  if (ds.expectedOverall === 'FLAG') {
    assert.strictEqual(result.overall, 'FLAG', `Dataset ${ds.label} should result in FLAG`)
    // Check if expected flagged fields are actually flagged
    if (ds.expectedFlags) {
      for (const flagKey of ds.expectedFlags) {
        const fieldRes = result.fields.find(f => f.fieldKey === flagKey)
        assert.ok(fieldRes, `Field ${flagKey} should be checked`)
        assert.strictEqual(fieldRes.status, 'flag', `Field ${flagKey} in ${ds.label} should be flagged`)
      }
    }
  } else if (ds.expectedOverall === 'PASS') {
    assert.strictEqual(result.overall, 'PASS', `Dataset ${ds.label} should result in PASS`)
  } else if (ds.expectedOverall === 'NEEDS REVIEW') {
    assert.strictEqual(result.overall, 'NEEDS REVIEW', `Dataset ${ds.label} should result in NEEDS REVIEW`)
  }
  console.log(`  ✓ Passed checks for ${ds.label}`)
}

console.log('\nAll tests passed successfully!')
