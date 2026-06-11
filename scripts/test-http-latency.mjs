import { readFileSync } from 'fs';

async function run() {
  const labelPath = './public/test-labels/spirits-pass.jpg';
  const fileBuffer = readFileSync(labelPath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('file', blob, 'spirits-pass.jpg');
  formData.append('beverageType', 'spirits');
  formData.append('isImport', 'false');
  formData.append('brandName', 'Old Tom Distillery');
  formData.append('classType', 'Kentucky Straight Bourbon Whiskey');
  formData.append('abv', '45% Alc./Vol. (90 Proof)');
  formData.append('netContents', '750mL');
  formData.append('producerName', 'Old Tom Distillery');
  formData.append('producerAddress', '123 Bourbon St, Louisville, KY 40202');
  formData.append('governmentWarning', 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.');

  console.log('Sending request to http://localhost:3001/api/verify ...');
  const t0 = Date.now();
  const res = await fetch('http://localhost:3001/api/verify', {
    method: 'POST',
    body: formData,
  });
  const duration = Date.now() - t0;

  console.log(`HTTP Status: ${res.status}`);
  console.log(`Response time: ${duration}ms`);
  const body = await res.json();
  console.log('Response body:', JSON.stringify(body, null, 2));
}

run().catch(console.error);
