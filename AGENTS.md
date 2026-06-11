# AGENTS.md — TTB AI-Powered Label Verification
**Version:** 1.1

---

## 1. Agent Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │         POST /api/verify            │
                    │         POST /api/batch             │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────────┐
                    │    PREPROCESSOR (not an AI agent)    │
                    │                                      │
                    │  1. PDF → PNG (client-side, pdfjs)   │
                    │  2. Image resize (server, sharp)     │
                    │  3. Image → base64 string            │
                    │  4. Build field list from BevType    │
                    └──────────────┬───────────────────────┘
                                   │ ExtractionInput
                                   ▼
                    ┌──────────────────────────────────────┐
                    │   AGENT 1: LabelFieldExtractionAgent │
                    │                                      │
                    │   Model: claude-3-5-haiku-latest     │
                    │   Vision + structured JSON output    │
                    │   Temperature: 0                     │
                    └──────────────┬───────────────────────┘
                                   │ ExtractionResult
                                   ▼
                    ┌──────────────────────────────────────┐
                    │   COMPARATOR (not an AI agent)       │
                    │                                      │
                    │   compareFields() — pure functions   │
                    │   Fuzzy / Numeric / Exact matching   │
                    └──────────────┬───────────────────────┘
                                   │ VerificationResult
                                   ▼
                    ┌──────────────────────────────────────┐
                    │      API Response / SSE Event        │
                    └──────────────────────────────────────┘
```

There is one AI agent in this system. All other processing is deterministic code.

---

## 2. V1 Agents

### Agent 1: LabelFieldExtractionAgent

**File:** `lib/ai-provider.ts` — `AnthropicProvider.extractFields()`

**Purpose:** Extract regulated alcohol label fields from a label image and return them as a structured JSON object with per-field confidence ratings.

---

**Input:**

```typescript
interface ExtractionInput {
  imageBase64: string           // Base64-encoded PNG (resized to ≤1568px)
  mimeType: 'image/png' | 'image/jpeg'
  beverageType: BeverageType    // 'spirits' | 'wine' | 'beer'
  importedProduct: boolean      // Drives whether country of origin is requested
  fieldList: FieldConfig[]      // Derived from beverage-fields.ts — single source of truth
}
```

---

**System Prompt:**

```
You are a precise OCR and field extraction assistant for the US Alcohol and Tobacco Tax and Trade Bureau (TTB). Your task is to extract specific regulated fields from an alcohol product label image.

You will be given a label image and a list of fields to extract. For each field:
- Extract the EXACT text as it appears on the label — do not normalize, interpret, or clean the text.
- Return the verbatim text including capitalization, punctuation, line breaks, and spacing exactly as shown.
- If a field is clearly present and readable, return confidence "high".
- If a field is present but partially obscured, ambiguous, or you are uncertain, return confidence "low" and explain why in the reason field.
- If a field is NOT present on the label at all (e.g., ABV is not shown on a beer label), return value null with confidence "high". A clearly absent field is not uncertain — do NOT return confidence "low" for an absent optional field.
- Never infer or guess field values. If you cannot read the text clearly, return confidence "low".

IMPORTANT: Your output must be valid JSON only — no prose, no explanation, no markdown code blocks. Return only the JSON object.
```

---

**Output:**

```typescript
// Raw model response (parsed to ExtractionResult)
interface ExtractionResult {
  fields: Record<keyof LabelFormData, FieldExtraction>
}

interface FieldExtraction {
  value: string | null
  confidence: 'high' | 'low'
  reason?: string
}
```

---

**Model Configuration:**

| Parameter | Value | Reason |
|-----------|-------|--------|
| Model | `claude-3-5-haiku-latest` | Best structured JSON output from vision at the latency required |
| Max tokens | 1500 | Sufficient for full government warning text + all fields in JSON; well within Claude's output limits |
| Temperature | 0 | OCR and extraction — zero creativity required. Deterministic output. |
| Top-p | Default (1.0) | Temperature 0 makes top-p irrelevant |
| Stream | false | Full JSON response required before comparison can run |

---

**Failure Handling:**

| Failure Mode | Detection | Behavior |
|-------------|-----------|---------|
| Model returns non-JSON text | `JSON.parse()` throws | Return all fields as `needs-review` with reason "AI response could not be parsed" |
| Model returns partial JSON (missing fields) | Key absent in parsed object | Missing fields treated as `{ value: null, confidence: 'low', reason: 'Field not returned by AI' }` |
| Anthropic API 429 (rate limit) | HTTP 429 response | Throw `ProviderUnavailableError` → API route returns 503 |
| Anthropic API 5xx | HTTP 5xx response | Throw `ProviderUnavailableError` → API route returns 503 |
| Network timeout | `AbortSignal` fires after 8000ms | Throw `ProviderUnavailableError` → API route returns 503 |
| Image unreadable (model says no text) | All fields return `null` with `confidence: 'low'` | API route returns 422 unreadable |

---

## 3. Orchestrator Workflow

**File:** `app/api/verify/route.ts` (single) and `app/api/batch/route.ts` (batch)

The orchestrator is the API route handler — not a separate service. It coordinates preprocessing → agent → comparison → response.

**Single label orchestration (`/api/verify`):**
Processes one label at a time, validates the form inputs on the server, delegates extraction to the AI provider, and returns a single synchronous HTTP response with the comparison results.

**Batch orchestration (`/api/batch`):**
* **Bulk Intake:** Agent uploads N files concurrently.
* **Spreadsheet Data Entry:** The frontend renders an inline form table, one row per file, for the agent to fill.
* **Concurrent Execution:** `app/api/batch/route.ts` receives the N labels and form submissions and maps them over a controlled concurrency pool (`runWithConcurrencyLimit`). 
* **SSE Streaming:** Instead of waiting for all N labels to finish, the route returns an immediate `text/event-stream`. As each label finishes its 5-second processing cycle, the API yields a JSON event over the wire, and the UI immediately renders that row's PASS / FLAG status.

---

## 4. AI Provider Abstraction

**File:** `lib/ai-provider.ts`

```typescript
interface AIProvider {
  extractFields(input: ExtractionInput): Promise<ExtractionResult>
}
```

**Provider selection** (`lib/provider-factory.ts`):
* Uses `AnthropicProvider` if an API key is set.
* Automatically falls back to `MockProvider` if no key is present, which reads from the 23 datasets in `lib/mock-data.ts`.

---

## 5. V2+ Agent Roadmap (Documented, Not Built)

These are natural extensions documented for completeness beyond the current V1 prototype:

- **COLADataFetchAgent:** Given a COLA application ID, fetches form field data directly from COLA IT API — eliminating manual form entry by the agent entirely.
- **ConfidenceCalibrationAgent:** Post-processes extraction results and re-scores confidence based on image quality metrics before the comparison runs.
- **BatchPriorityAgent:** Analyzes a batch queue and re-orders labels by estimated processing difficulty — easier labels first, so agents see passing results sooner.
- **AuditSummaryAgent:** Generates a plain-language summary of verification session results for audit trail generation.

---

## 6. Agent Safety Rules

| Rule | Enforcement |
|------|------------|
| Model never makes compliance decisions | All pass/flag/needs-review determinations are in `compareFields()` — pure TypeScript. Model only extracts text. |
| Model never sees form data | The agent receives only the image and a list of field names to extract. Form values are never sent to the model. This prevents the model from "checking its own work." |
| No caching of model responses | Every request calls the API fresh — no cached extractions that could mask label changes |
| Temperature locked at 0 | Prevents creative interpolation of partially readable text. Model must report uncertainty via confidence field, not guess. |
| API key never in client bundle | `ANTHROPIC_API_KEY` accessed server-side only — `AnthropicProvider` is only instantiated in API routes, never in components |
| Model response validated before use | `parseResponse()` validates JSON structure; missing or malformed fields default to `needs-review` rather than crashing or silently passing |
| Agent cannot override visual checks | Bold formatting and font size limitations are hardcoded into the UI notice — the model has no mechanism to suppress them |
