# SketchCAD one-page landing (Part Library Delivery)

This repository serves a single marketing page at `/` focused on **production-ready Altium part library delivery**.

## Anchor sections

- `#why-libraries-matter`
- `#what-you-get`
- `#standards`
- `#availability`
- `#how-we-deliver`
- `#complementary`
- `#drop-your-bom`

## Redirects

Legacy routes are redirected via `_redirects`:

- `/platform` -> `/#availability`
- `/services` -> `/#complementary`
- `/how-we-work` -> `/#how-we-deliver`
- `/work` -> `/#what-you-get`
- `/faq` -> `/#drop-your-bom`
- `/contact` -> `/#drop-your-bom`
- `/sketch-to-bom` -> `/#drop-your-bom`

## Form mechanism

The bottom section keeps the Netlify form mechanism (`data-netlify="true"`) with `form-name="drop-your-sketch"` to avoid backend changes.
