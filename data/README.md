# Pencil spectral data

`parse_pencils.js` turns pasted colour-reference-tool text blocks (the "091 Purple Lake / Castle Arts Gold Coloured Pencils / Source / ... / sRGB ... hex #xxxxxx" format) into a single structured dataset, deduplicating as you go.

## Usage

Paste one or more blocks (any number, any order) into a plain text file, then:

```
node parse_pencils.js yourfile.txt
```

Each pencil is reported as:

- **ADDED** — new pencil, written into `master.json`
- **DUPLICATE** — identical hex already present, skipped safely
- **CONFLICT** — same pencil identity but a different hex than what's on file — flagged, not overwritten, so you can check by hand which reading is correct

Run it as many times as you like across sessions; duplicates are caught across separate runs too, not just within one paste.

Extracts: brand/range, product code, colour name, device + mode + spectral range, paper, full Lab (D50 and D65, 2°), LCh, OK-Lab, Munsell notation, ISCC-NBS name, sRGB hex + gamut status (Mapped/Clipped pairs handled, Clipped preferred), and P3 RGB.

Use `--dry-run` to parse and report without writing to `master.json`.
