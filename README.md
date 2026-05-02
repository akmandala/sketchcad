# SketchCAD one-page landing (Content Cart Packs)

This repository serves a single marketing page at `/` focused on deterministic **Content Cart Packs** for miniature electronics.

## Anchor sections

- `#packs`
- `#the-standard`
- `#coverage`
- `#contractors`
- `#get-started`

## External links used

- Platform: `https://bomparser.netlify.app/`
- Marketplace: `TBD_MARKETPLACE_URL`

## Redirects

Legacy routes are redirected via `_redirects`:

- `/platform` -> `/#the-standard`
- `/services` -> `/#contractors`
- `/how-we-work` -> `/#packs`
- `/work` -> `/#packs`
- `/faq` -> `/#get-started`
- `/contact` -> `/#get-started`
- `/sketch-to-bom` -> `/#packs`

## Form mechanism

The request form keeps the Netlify form mechanism (`data-netlify="true"`) with `form-name="drop-your-sketch"` to avoid backend changes.
