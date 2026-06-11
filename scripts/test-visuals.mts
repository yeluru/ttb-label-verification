import { chromium } from '@playwright/test'
import { MOCK_DATASETS } from '../lib/mock-data.js'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('http://localhost:3002') // assuming dev server is running here, or maybe 3002.
  
  let mismatches = 0;
  
  console.log(`Starting visual verification of ${MOCK_DATASETS.length} datasets...`)
  
  for (const ds of MOCK_DATASETS) {
    console.log(`\nTesting dataset: ${ds.displayName}`)
    
    // First, select the correct beverage type
    const typeName = ds.beverageType === 'spirits' ? 'Spirits' : ds.beverageType === 'wine' ? 'Wine' : 'Beer'
    await page.locator('button[role="radio"]', { hasText: typeName }).click()
    
    // Select the quick start item
    // The Quick start dropdown is a standard select element or custom?
    // Let's use evaluate to select it, or just click.
    // wait, I can just use locator
    const select = page.locator('select', { hasText: 'Select a bundled test case…' }).first()
    await select.selectOption(ds.label)
    
    // Wait a brief moment for the form to populate and image to stage
    await page.waitForTimeout(500)
    
    // Click "Verify label" or "Run again" or "Retry verification"
    const verifyBtn = page.getByRole('button', { name: /Verify label|Run again|Retry verification/ })
    await verifyBtn.click()
    
    // Wait for result
    // Status badges will appear: text like "PASS", "FLAG", "NEEDS REVIEW"
    try {
      // The overall badge contains the exact text. We can wait for it.
      await page.waitForSelector('.card .text-\\[11px\\].uppercase.tracking-\\[0\\.1em\\]', { state: 'attached', timeout: 15000 })
      // Wait for it to settle
      await page.waitForTimeout(500)
      
      const isPass = await page.getByText('All fields match the submitted form', { exact: true }).isVisible()
      const isFlag = await page.getByText('One or more fields do not match', { exact: true }).isVisible()
      const isReview = await page.getByText('AI uncertain on one or more fields', { exact: true }).isVisible()
      
      let actualOutcome = 'UNKNOWN'
      if (isPass) actualOutcome = 'PASS'
      if (isFlag) actualOutcome = 'FLAG'
      if (isReview) actualOutcome = 'NEEDS REVIEW'
      
      const expectedOutcome = ds.expectedOverall
      
      console.log(`  Expected: ${expectedOutcome} | Actual UI: ${actualOutcome}`)
      
      if (actualOutcome !== expectedOutcome) {
        console.error(`  ❌ MISMATCH! The UI showed ${actualOutcome} but the dataset expects ${expectedOutcome}. The displayName is "${ds.displayName}".`)
        
        // Print out the flagged fields
        const flaggedRows = await page.locator('.flex.flex-col.border-b.last\\:border-0', { hasText: 'FLAG' }).allTextContents()
        if (flaggedRows.length > 0) {
          console.log(`    Flagged fields:`)
          for (const row of flaggedRows) {
             console.log(`      - ${row.replace(/\s+/g, ' ')}`)
          }
        }
        
        mismatches++
      } else {
        console.log(`  ✓ Match`)
      }
      
      // Click Verify another
      await page.getByRole('button', { name: /Verify another/ }).click()
    } catch (err) {
      console.error(`  ❌ ERROR running test case for ${ds.label}:`, err)
      mismatches++
    }
  }
  
  await browser.close()
  
  if (mismatches > 0) {
    console.error(`\nFound ${mismatches} mismatches during visual verification.`)
    process.exit(1)
  } else {
    console.log(`\nAll ${MOCK_DATASETS.length} test cases align perfectly with visual outcomes!`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
