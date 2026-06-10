# Test labels — source HTML

This folder contains the **HTML source** files for the 15 test label
designs. These are *not* what the app reads at runtime.

## Where are the JPGs?

The actual label images the app uploads live in:

    public/test-labels/*.jpg

That folder contains 15 committed JPGs — one per test case. Next.js
serves them as static assets, so the deployed app fetches each label
from `/test-labels/<key>.jpg` (no file system access needed).

## I want to test the app — do I have to make my own PNGs?

**No.** Everything is already generated. To test:

1. `npm install && npm run dev`
2. Open `http://localhost:3000`
3. In the left panel, open the **Quick start** dropdown and pick any
   test case (e.g. "Spirits — All Fields Pass")
4. The matching JPG is **auto-uploaded** and the form is auto-filled
5. Click **Verify label**

You can also click the **"Download spirits-pass.jpg"** link that
appears beneath the dropdown if you want the file on your machine.

On the `/batch` page, click **"Seed demo batch (3 labels)"** in the
empty state — it queues three labels (PASS + ABV mismatch + degraded)
in one click.

## When would I regenerate the JPGs?

Only if you edit the HTML source files in this folder. Then run:

    npm run generate-labels

That fires up Puppeteer, opens each HTML file, screenshots the
`.label` element, and writes the JPG to `public/test-labels/`.

## File mapping

| HTML source (this folder)     | Rendered JPG (public/test-labels) |
|-------------------------------|-----------------------------------|
| spirits-pass.html             | spirits-pass.jpg                  |
| spirits-abv-mismatch.html     | spirits-abv-mismatch.jpg          |
| spirits-brand-case.html       | spirits-brand-case.jpg            |
| spirits-brand-mismatch.html   | spirits-brand-mismatch.jpg        |
| spirits-warning-titlecase.html| spirits-warning-titlecase.jpg     |
| spirits-warning-wording.html  | spirits-warning-wording.jpg       |
| spirits-warning-missing.html  | spirits-warning-missing.jpg       |
| spirits-import-pass.html      | spirits-import-pass.jpg           |
| spirits-import-mismatch.html  | spirits-import-mismatch.jpg       |
| spirits-degraded.html         | spirits-degraded.jpg              |
| wine-abv-blank-pass.html      | wine-abv-blank-pass.jpg           |
| wine-abv-blank-flag.html      | wine-abv-blank-flag.jpg           |
| wine-appellation-pass.html    | wine-appellation-pass.jpg         |
| beer-abv-blank-pass.html      | beer-abv-blank-pass.jpg           |
| beer-abv-on-label.html        | beer-abv-on-label.jpg             |
