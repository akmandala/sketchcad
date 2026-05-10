# SketchCAD one-page landing (Beyond-IPC + BodyMax)

This repository serves a single marketing page at `/` focused on:

- Beyond-IPC **BodyMax** component/library discipline
- Content Cart Packs for miniature electronics
- Platform self-serve flow
- Trained contractor network

## Anchor sections

- `#why`
- `#bodymax`
- `#packs`
- `#coverage`
- `#contractors`
- `#get-started`

## External links

- Platform: `https://bomparser.netlify.app/`
- Marketplace: `/marketplace` (placeholder route)

## Redirects

Legacy routes are redirected via `_redirects`:

- `/platform` -> `/#bodymax`
- `/services` -> `/#contractors`
- `/how-we-work` -> `/#packs`
- `/work` -> `/#contractors`
- `/faq` -> `/#get-started`
- `/contact` -> `/#get-started`
- `/sketch-to-bom` -> `/#packs`

## Form mechanism

The request form keeps the Netlify form mechanism (`data-netlify="true"`) with `form-name="drop-your-sketch"` to avoid backend changes.
