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

const SYSTEM_PROMPT = `You are a precise OCR and field extraction assistant for the US Alcohol and Tobacco Tax and Trade Bureau (TTB). Your task is to extract specific regulated fields from an alcohol product label image.

You will be given a label image and a list of fields to extract. For each field:
- Extract the EXACT text as it appears on the label — do not normalize, interpret, or clean the text.
- Return the verbatim text including capitalization, punctuation, line breaks, and spacing exactly as shown.
- If a field is clearly present and readable, return confidence "high".
- If a field is present but partially obscured, ambiguous, or you are uncertain, return confidence "low" and explain why in the reason field.
- If a field is NOT present on the label at all (e.g., ABV is not shown on a beer label), return value null with confidence "high". A clearly absent field is not uncertain — do NOT return confidence "low" for an absent optional field.
- Never infer or guess field values. If you cannot read the text clearly, return confidence "low".

IMPORTANT: Your output must be valid JSON only — no prose, no explanation, no markdown code blocks. Return only the JSON object.`;

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

async function testConfig({ maxTokens }) {
  console.log(`\n--- Testing Sonnet 4.5: max_tokens=${maxTokens} ---`);
  
  const image = sharp(originalBuffer);
  const resized = await image.resize({
    width: 800,
    height: 800,
    fit: 'inside',
    withoutEnlargement: true
  }).jpeg({ quality: 80 }).toBuffer();
  
  const imageBase64 = resized.toString('base64');
  const t0 = Date.now();
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      temperature: 0,
      system: SYSTEM_PROMPT,
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
    console.log(`API Latency: ${duration}ms`);
  } catch (err) {
    console.log(`API Error: ${err.message}`);
  }
}

async function main() {
  await testConfig({ maxTokens: 1500 });
  await testConfig({ maxTokens: 400 });
  await testConfig({ maxTokens: 300 });
}

main().catch(console.error);
