# SketchCAD Prototype (Clean UI Rebuild)

This version rebuilds the UI to match a cleaner workflow:

- **Left narrow panel = chat interface only**
- **Main area = large canvas for sketching**
- **Only one canvas button = Symbol Helper (placeholder)**

## User flow

1. Sketch electronics blocks directly on canvas (stylus/finger friendly via `PointerEvent`).
2. Click **Analyze Sketch** to summarize recognized blocks for LLM context.
3. Click **Generate Design Snippet** to output a structured JSON snippet.

## Current recognition map (starter)

- Rectangle → DCDC Converter
- Circle → MCU Controller
- Triangle → Amplifier / Driver
- Tall Rectangle → Battery & Power Mgmt
- Rounded shape → Network Interface

## Run

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Notes

- Chat is currently local mock messaging.
- Symbol Helper button is a placeholder for the page you will upload later.
