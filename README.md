# SketchCAD single-page landing

This repository now serves a single-page marketing site at `/` with anchor sections and a single conversion goal: **Drop your sketch**.

## Sections

- Hero
- Free Snippet Plan (`#free-snippet-plan`)
- Why this is different (`#why-this-is-different`)
- Paid delivery (`#paid-delivery`)
- AI and engineering (`#ai-and-engineering`)
- Drop your sketch form (`#drop-your-sketch`)

## Redirects

Legacy paths are redirected using `_redirects`:

- `/platform` -> `/#why-this-is-different`
- `/services` -> `/#paid-delivery`
- `/how-we-work` -> `/#why-this-is-different`
- `/work` -> `/#why-this-is-different`
- `/faq` -> `/#why-this-is-different`
- `/contact` -> `/#drop-your-sketch`
- `/sketch-to-bom` -> `/#free-snippet-plan`

## Form handling

The drop-your-sketch form uses Netlify Forms attributes (`data-netlify="true"`) so no extra backend dependency is required.
