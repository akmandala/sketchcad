# SketchCAD Prototype

A lightweight browser prototype for sketch-to-diagram electronics block creation.

## What this prototype includes

- Stylus/finger sketch input on a canvas (`PointerEvent` based, iPad/Apple Pencil friendly).
- Basic shape recognition for **rectangle**, **circle**, and **triangle**.
- Auto-conversion of recognized shapes into clean component symbols.
- Editable component metadata (label, `Vin`, `Vout`, `Imax`) for quick DCDC-style annotation.
- Wiring workflow between components with selectable link types:
  - USB
  - SPI
  - I2C
  - UART
  - Power Rail

## Suggested starter symbol dictionary (5 easy-to-recognize symbols)

1. **Rectangle → DCDC Converter**
2. **Circle → MCU Controller**
3. **Triangle → Amplifier / Driver**
4. **Tall Rectangle → Battery & Power Management**
5. **Rounded Rectangle → Network Interface**

These are intentionally simple primitives so users can sketch quickly and still get reliable recognition.

## Run locally

Because this is plain HTML/CSS/JS, no build step is required.

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Next iteration ideas

- Add OCR for text annotation (e.g., convert handwritten `DCDC` to label automatically).
- Add symbol-specific property schemas (e.g., MCU pins, battery chemistry).
- Better shape recognizer (multi-stroke, confidence score, undo).
- Export to JSON/netlist and SVG.
