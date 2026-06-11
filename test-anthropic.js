import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const modelsToTest = [
  'claude-4-5-sonnet-latest',
  'claude-4-5-sonnet-20260210',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-5-sonnet-latest',
  'claude-3-5-sonnet',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-haiku-4-5'
];

async function run() {
  for (const m of modelsToTest) {
    try {
      await client.messages.create({
        model: m,
        max_tokens: 10,
        messages: [{role: 'user', content: 'hello'}]
      });
      console.log(`[SUCCESS] ${m}`);
      return;
    } catch (e) {
      console.log(`[FAIL] ${m}: ${e.status}`);
    }
  }
}
run();
