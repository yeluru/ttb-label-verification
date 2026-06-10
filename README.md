# TTB AI-Powered Label Verification

**Author:** Venkata Ravi Kumar Yeluru
**Assignment:** US Treasury / TTB Take-Home Assessment — AI-Powered Label Verification Prototype

A Next.js 14 prototype that automates the field-matching step of the TTB COLA
review process. Compliance agents upload an alcohol label image and the
corresponding form data; the app extracts regulated fields from the label with
Claude Vision and returns a structured per-field PASS / FLAG / NEEDS REVIEW
result in under five seconds. Batch mode processes many labels in parallel and
streams results back over Server-Sent Events.

This is a standalone proof-of-concept built for Treasury evaluation. There is no
COLA IT integration, no authentication, and no data persistence.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic key (optional — see "Without an API key" below)
cp .env.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Run the dev server
npm run dev
# Open http://localhost:3000

# 4. Build for production
npm run build && npm start
```

### Without an API key

If `ANTHROPIC_API_KEY` is not set, the app falls back to a `MockProvider` that
mirrors the form data back as the "extracted" values. This lets you click
through the UI without spending tokens, but it does *not* actually read the
image — every test case will appear to pass. Set the key to see real
extraction.

### Optional — regenerate test labels

The 15 test label JPGs in `public/test-labels/` are committed to the repo so
the deployed app and the README links work out of the box. To regenerate them
(after editing `scripts/generate-labels.mjs`):

```bash
npm run generate-labels
```

This rasterizes the HTML source files in `test-labels/html/` to JPGs using
Puppeteer.

---

## Approach

The application is organized as a modular Next.js 14 monolith. Frontend and API
live in the same project so a single `git push` deploys the whole stack to
Vercel.

```
                ┌────────────────────────────────────────────┐
                │                                            │
                │   Agent uploads label  +  fills form       │
                │                                            │
                └──────────────────────┬─────────────────────┘
                                       │
                  (PDF → PNG on the client via pdfjs-dist)
                                       │
                                       ▼
            POST /api/verify    POST /api/batch (SSE stream)
                                       │
                ┌──────────────────────┴─────────────────────┐
                │  1. sharp — resize image to ≤ 1568px       │
                │  2. AnthropicProvider → claude-3-5-sonnet  │
                │     · temperature 0, max_tokens 1500       │
                │     · strict JSON schema, field-by-field   │
                │  3. compareFields() — fuzzy / numeric /    │
                │     exact matching per FR-04 rules         │
                └────────────────────────────────────────────┘
                                       │
                                       ▼
                       PASS / FLAG / NEEDS REVIEW
```

**Separation of concerns.** Business logic lives in `/lib`. The pages in `/app`
are presentation-only; they never instantiate the AI provider directly. The API
routes are the only place where Anthropic is contacted. This means the AI key
never reaches the client bundle and the model never sees the agent's form
values — it only receives the image and a list of field *names* to extract.
Comparison happens entirely in `compareFields()` (pure TypeScript) so the
verdict is deterministic and auditable.

**Why one AI agent, not several.** All compliance decisions live in
`compareFields()`. The AI is a glorified OCR — it extracts text and tags each
field as `high` or `low` confidence. Everything downstream — pass / flag /
needs-review, overall verdict, optional-field semantics — is rule-based. This
keeps the system explainable and prevents the model from "creatively
interpreting" labels.

**Streaming batch.** `/api/batch` runs `Promise.allSettled` across N labels and
emits an SSE `result` event as each settles, plus a final `done` event with
aggregate counts. One failure never blocks the rest.

---

## Tools used

| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Web framework — pages + API routes in one project |
| TypeScript (strict mode) | Type safety, especially across the comparison + AI parsing layer |
| Tailwind CSS 3 | Utility-first styling — government-appropriate Enterprise Minimal theme |
| Lucide React | Icon set — used for status indicators (CheckCircle2 / XCircle / HelpCircle) |
| Anthropic SDK | Calls `claude-3-5-sonnet-20241022` with vision input + structured JSON output |
| sharp | Server-side resize of label images to ≤ 1568px on the long edge |
| pdfjs-dist | **Client-side** PDF page-1 → PNG rasterization (server can't run canvas natives on Vercel) |
| Puppeteer | Build-time only — rasterizes the HTML test labels to JPG so the repo carries the test set |
| Vercel | Deployment target — `runtime = 'nodejs'` + `dynamic = 'force-dynamic'` on both API routes |

---

## Assumptions

- **Government firewall.** The deployed prototype assumes outbound HTTPS to
  `api.anthropic.com` is allowed. If TTB internal hosting blocks Anthropic, the
  provider abstraction (`lib/ai-provider.ts`) accepts an alternate
  implementation behind the same interface.
- **Label format.** Labels are submitted as JPG, PNG, or PDF. PDFs are
  rasterized on the client to PNG before upload; the server never sees raw PDF
  bytes.
- **Image quality.** Labels are at least readable to a human. Angled or
  partially obscured fields surface as `needs-review` rather than hard errors.
- **One beverage type per batch.** Mixed-type batches are out of scope per the
  PRD; both the beverage type and the import toggle apply to the whole batch.
- **Test data only.** No real TTB labels are bundled. Every JPG in
  `public/test-labels/` is generated from the HTML source in
  `test-labels/html/`.
- **Network latency.** The < 5-second SLA assumes Anthropic's median vision
  latency holds. Cold function starts on Vercel can add ~500–1500ms on the
  first request; subsequent requests are well within budget.

---

## Trade-offs and known limitations

- **Bold formatting cannot be verified.** TTB requires the government warning
  to be in bold. Claude Vision does not reliably expose font-weight metadata
  from a rasterized image. The UI displays a permanent "Visual limitation"
  notice on every result instructing the agent to confirm bold formatting
  manually.
- **Font size / prominence cannot be verified.** Same rationale — font
  prominence is a layout property, not a textual property. The same notice
  covers this.
- **No COLA IT integration.** Form data is entered by hand or via the
  "Load Sample" dropdown. A future integration could pull form data directly
  given a COLA application ID.
- **MockProvider always passes.** When no API key is present, the mock
  provider returns the same value the form submitted. This is useful for
  clicking through the UI but it does *not* exercise real OCR — every test
  case will look like PASS. Use a real key to validate FLAG and NEEDS REVIEW
  behavior.
- **No automated test suite.** PRD Section 9's 27 manual test cases are the
  acceptance criteria. The pure functions in `lib/field-comparison.ts` are the
  highest-value candidates for unit tests if this moves past prototype.
- **Vercel function timeout.** Hobby tier is 10 seconds; batches above ~6–8
  labels need Vercel Pro for the 60-second timeout. The README on Vercel
  recommends Pro.
- **No retry on Anthropic 429 / 5xx.** A 503 surfaces immediately to the
  agent with a "service temporarily unavailable" message and the form data is
  preserved so they can retry.
- **AI vision accuracy on real-world labels.** Test images are clean HTML
  screenshots. Production label artwork (foil-stamped, embossed, low-contrast
  print) will see lower extraction confidence than these tests demonstrate.

---

## Project layout

```
app/
  layout.tsx              Root layout — Inter + JetBrains Mono fonts, top nav
  page.tsx                Single Verify page (/)
  batch/page.tsx          Batch Verify page (/batch)
  api/verify/route.ts     POST /api/verify — single label
  api/batch/route.ts      POST /api/batch — SSE streaming batch
  globals.css             Tailwind directives, base styles
components/               UI primitives + result rows + form fields
lib/
  types.ts                Single-source-of-truth TypeScript types
  beverage-fields.ts      Field registry per beverage type (drives form + prompt)
  field-comparison.ts     compareFields(), TTB warning text, fuzzy + numeric + exact algorithms
  ai-provider.ts          AnthropicProvider + MockProvider + system prompt
  provider-factory.ts     Selects provider based on ANTHROPIC_API_KEY
  validation.ts           Form-side required-field validation
  image-preprocessor.ts   sharp-based server-side resize
  pdf-preprocessor.ts     pdfjs-dist client-side PDF → PNG
  mock-data.ts            15 test datasets matching the JPGs in public/test-labels/
public/test-labels/       Committed JPGs (regenerated by scripts/generate-labels.mjs)
test-labels/html/         HTML source for each test label (source of truth)
scripts/generate-labels.mjs  Puppeteer-driven build script
```

---

## Mapping test cases to test labels

Each test case from PRD Section 9 maps to one of the 15 datasets in
`lib/mock-data.ts` and the corresponding JPG in `public/test-labels/`.

| Dataset (Load Sample) | Label JPG | Expected |
|-----------------------|-----------|----------|
| Spirits — All Fields Pass | spirits-pass.jpg | PASS |
| Spirits — ABV Mismatch (FLAG) | spirits-abv-mismatch.jpg | FLAG (ABV) |
| Spirits — Brand Casing (PASS) | spirits-brand-case.jpg | PASS |
| Spirits — Brand Mismatch (FLAG) | spirits-brand-mismatch.jpg | FLAG (brand) |
| Spirits — Warning Title Case (FLAG) | spirits-warning-titlecase.jpg | FLAG (warning) |
| Spirits — Warning Wording Changed (FLAG) | spirits-warning-wording.jpg | FLAG (warning) |
| Spirits — Warning Missing (FLAG) | spirits-warning-missing.jpg | FLAG (warning) |
| Spirits — Import Match (PASS) | spirits-import-pass.jpg | PASS |
| Spirits — Import Mismatch (FLAG) | spirits-import-mismatch.jpg | FLAG (country) |
| Spirits — Degraded Image | spirits-degraded.jpg | NEEDS REVIEW |
| Wine — ABV Blank Pass | wine-abv-blank-pass.jpg | PASS |
| Wine — ABV on Label, Blank Form (FLAG) | wine-abv-blank-flag.jpg | FLAG (ABV) |
| Wine — Appellation Match (PASS) | wine-appellation-pass.jpg | PASS |
| Beer — ABV Blank Pass | beer-abv-blank-pass.jpg | PASS |
| Beer — ABV on Label, Blank Form (FLAG) | beer-abv-on-label.jpg | FLAG (ABV) |

To run a test case on the deployed app: open the URL, select the matching
"Load Sample" entry, download the corresponding JPG from `public/test-labels/`
and upload it, then click **Verify Label**.

---

## Deployment to Vercel

1. Push this repository to GitHub.
2. In Vercel: **New Project** → import the GitHub repo.
3. Set the environment variable `ANTHROPIC_API_KEY` in **Project Settings →
   Environment Variables**.
4. Deploy. The first build takes ~90 seconds.
5. Recommended: upgrade the project to **Vercel Pro** so batch function timeout
   is 60s (Hobby caps at 10s).

The deployed URL serves both the UI and the API from one Next.js application
— no separate API server is needed.

---

## Security notes

- `ANTHROPIC_API_KEY` is never exposed to the client. `AnthropicProvider` is
  only instantiated inside server-side API routes.
- `.env.local` is in `.gitignore`; `.env.example` is committed as a template.
- No image bytes or form data are persisted anywhere. The Vercel function
  discards all state when the invocation ends.
- HTTPS is enforced by Vercel on all traffic.
