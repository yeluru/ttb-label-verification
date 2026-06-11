import { readFileSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

// Load .env manually
try {
  const envContent = readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        process.env[key] = value;
      }
    }
  }
} catch (e) {
  console.warn('Failed to load .env file', e.message);
}

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey });

const labelPath = './public/test-labels/spirits-pass.jpg';
const originalBuffer = readFileSync(labelPath);

// Create a large system prompt with few-shot examples to exceed 1024 tokens
const SYSTEM_PROMPT = `You are a precise OCR and field extraction assistant for the US Alcohol and Tobacco Tax and Trade Bureau (TTB). Your task is to extract specific regulated fields from an alcohol product label image.

You will be given a label image and a list of fields to extract. For each field:
- Extract the EXACT text as it appears on the label — do not normalize, interpret, or clean the text.
- Return the verbatim text including capitalization, punctuation, line breaks, and spacing exactly as shown.
- If a field is clearly present and readable, return confidence "high".
- If a field is present but partially obscured, ambiguous, or you are uncertain, return confidence "low" and explain why in the reason field.
- If a field is NOT present on the label at all (e.g., ABV is not shown on a beer label), return value null with confidence "high". A clearly absent field is not uncertain — do NOT return confidence "low" for an absent optional field.
- Never infer or guess field values. If you cannot read the text clearly, return confidence "low".

IMPORTANT: Your output must be valid JSON only — no prose, no explanation, no markdown code blocks. Return only the JSON object.

FEW-SHOT EXAMPLES:
Example 1 (Spirits label):
Input label fields to extract: brandName, classType, abv, netContents, producerName, producerAddress, governmentWarning
Expected Output JSON:
{
  "fields": {
    "brandName": { "value": "OLD TOM DISTILLERY", "confidence": "high" },
    "classType": { "value": "Kentucky Straight Bourbon Whiskey", "confidence": "high" },
    "abv": { "value": "45% Alc./Vol. (90 Proof)", "confidence": "high" },
    "netContents": { "value": "750 mL", "confidence": "high" },
    "producerName": { "value": "Old Tom Distillery", "confidence": "high" },
    "producerAddress": { "value": "123 Bourbon St, Louisville, KY 40202", "confidence": "high" },
    "governmentWarning": { "value": "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.", "confidence": "high" }
  }
}

Example 2 (Wine label):
Input label fields to extract: brandName, classType, abv, netContents, producerName, producerAddress, governmentWarning, appellation
Expected Output JSON:
{
  "fields": {
    "brandName": { "value": "Sonoma Hills Winery", "confidence": "high" },
    "classType": { "value": "California Red Wine", "confidence": "high" },
    "abv": { "value": null, "confidence": "high" },
    "netContents": { "value": "750mL", "confidence": "high" },
    "producerName": { "value": "Sonoma Hills Winery", "confidence": "high" },
    "producerAddress": { "value": "500 Vineyard Rd, Sonoma, CA 95476", "confidence": "high" },
    "governmentWarning": { "value": "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.", "confidence": "high" },
    "appellation": { "value": "Napa Valley", "confidence": "high" }
  }
}

Example 3 (Beer label):
Input label fields to extract: brandName, classType, abv, netContents, producerName, producerAddress, governmentWarning
Expected Output JSON:
{
  "fields": {
    "brandName": { "value": "Pine Ridge Brewing", "confidence": "high" },
    "classType": { "value": "India Pale Ale", "confidence": "high" },
    "abv": { "value": null, "confidence": "high" },
    "netContents": { "value": "12 FL OZ", "confidence": "high" },
    "producerName": { "value": "Pine Ridge Brewing Co", "confidence": "high" },
    "producerAddress": { "value": "88 Pine St, Portland, OR 97204", "confidence": "high" },
    "governmentWarning": { "value": "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.", "confidence": "high" }
  }
}
`;

const USER_PROMPT = `Extract the following fields from this distilled spirits label:
- "brandName": Extract the Brand Name. 
- "classType": Extract the Class/Type. 
- "abv": Extract the ABV. Look for percentage (%) and/or proof values. Return the full text as shown (e.g., "45% Alc./Vol. (90 Proof)"). If no ABV appears on the label, return null with confidence "high".
- "netContents": Extract the Net Contents. 
- "producerName": Extract the Producer Name. 
- "producerAddress": Extract the Producer Address. Return the full address including street, city, state, and zip as shown on the label.
- "governmentWarning": Extract the Government Warning. Look for text beginning with "GOVERNMENT WARNING:" — extract the COMPLETE statement verbatim including all line breaks. If it spans multiple lines, include \\n characters between lines.

Return a JSON object with this exact structure:
{"fields":{"brandName":{"value":"...","confidence":"high"},"classType":{"value":"...","confidence":"high"},"abv":{"value":"...","confidence":"high"},"netContents":{"value":"...","confidence":"high"},"producerName":{"value":"...","confidence":"high"},"producerAddress":{"value":"...","confidence":"high"},"governmentWarning":{"value":"...","confidence":"high"}}}

Extract fields for: brandName, classType, abv, netContents, producerName, producerAddress, governmentWarning`;

async function makeRequest(labelNumber) {
  const image = sharp(originalBuffer);
  const resized = await image.resize({
    width: 600,
    height: 600,
    fit: 'inside',
    withoutEnlargement: true
  }).jpeg({ quality: 80 }).toBuffer();
  
  const imageBase64 = resized.toString('base64');
  
  const t0 = Date.now();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 300,
    temperature: 0,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' } // Enable caching!
      }
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  });
  const duration = Date.now() - t0;
  
  console.log(`Request #${labelNumber} Latency: ${duration}ms`);
  console.log('Cache status:', response.usage);
  return duration;
}

async function main() {
  console.log('--- Test 1: Cold Cache ---');
  await makeRequest(1);
  
  console.log('--- Test 2: Warm Cache ---');
  await makeRequest(2);

  console.log('--- Test 3: Warm Cache ---');
  await makeRequest(3);
}

main().catch(console.error);
