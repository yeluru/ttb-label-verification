import fs from 'fs';
const blob = new Blob([fs.readFileSync('public/test-labels/beer-abv-blank-pass.jpg')], { type: 'image/jpeg' });
const formData = new FormData();
formData.append('file', blob, 'beer-abv-blank-pass.jpg');
formData.append('beverageType', 'beer');
formData.append('importedProduct', 'false');
formData.append('brandName', 'Pine Ridge Brewing');
formData.append('classType', 'India Pale Ale');
formData.append('abv', '');
formData.append('netContents', '12 FL OZ');
formData.append('producerName', 'Pine Ridge Brewing Co');
formData.append('producerAddress', '88 Pine St, Portland, OR 97204');
formData.append('countryOfOrigin', '');
formData.append('governmentWarning', 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.');

fetch('http://localhost:3000/api/verify', { method: 'POST', body: formData })
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
