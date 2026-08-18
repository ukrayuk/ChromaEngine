# Pencil spectral data

`parse_pencils.js` turns colour-reference-tool text blocks into a single structured dataset, deduplicating as you go. Two source formats are accepted, auto-detected per file:

- **Legacy manual paste** — the "091 Purple Lake / Castle Arts Gold Coloured Pencils / Source / ... / sRGB ... hex #xxxxxx" format, name/brand as bare lines above a `Source` anchor.
- **Tampermonkey scrape (ArtistPigments)** — explicit `PENCIL_ID:` / `PENCIL_NAME:` / `BRAND:` / `URL:` header lines, section headers in caps (`SOURCE`, `CIE-L*A*B*`, etc.), blocks separated by a line of `=` characters. A file is treated as this format if it contains a `PENCIL_ID:` line anywhere.

## Usage

Paste or save one or more blocks (any number, any order, either format) into a plain text file, then:

```
node parse_pencils.js yourfile.txt
```

Each pencil is reported as:

- **ADDED** — new pencil, written into `master.json`
- **DUPLICATE** — identical hex already present, skipped safely (if the paste carries a `URL` the existing record didn't have, it's backfilled in and noted as `[url filled in]` — no colour data is ever touched on a duplicate)
- **CONFLICT** — same pencil identity but a different hex than what's on file — flagged, not overwritten, so you can check by hand which reading is correct

Run it as many times as you like across sessions; duplicates are caught across separate runs too, not just within one paste.

Extracts: brand/range, product code, colour name, source page URL (Tampermonkey format only), device + mode + spectral range, paper, full Lab (D50 and D65, 2°), LCh, OK-Lab, Munsell notation, ISCC-NBS name, sRGB hex + gamut status (Mapped/Clipped pairs handled, Clipped preferred), and P3 RGB.

Use `--dry-run` to parse and report without writing to `master.json`.
