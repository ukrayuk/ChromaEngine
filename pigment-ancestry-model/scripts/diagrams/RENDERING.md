# Diagram Rendering Conventions

Reference for anyone (human or Claude session) touching a diagram script in
this folder. Supersedes the "Diagram Rendering Conventions" section of the
old "Pigment Ancestry Model — Arc Construction Reference" artifact (3 Oct
2026) — that artifact is being kept as a historical record, not updated
further; this file is the current source of truth.

There are two distinct diagram families in this folder, built for different
purposes, with different cell-boundary conventions. Don't mix them up.

## Family 1 — generation-ladder diagrams

`build_level1_pure_circular_filled.cjs`, `build_level3_cross_circular_filled.cjs`,
`build_level1_level2_combo_v2.cjs`. Show the full dyadic subdivision
structure: radius = generation depth, each ring is one generation.

- G0+G1 share one ring band, 3 segments (G0 anchor / G1 blend / G0 anchor),
  split at `EDGE_T = 0.25` (i.e. t=0–0.25 / 0.25–0.75 / 0.75–1).
- G2–G8 each get their own ring, showing ONLY that generation's new colours
  (not the full accumulated set).
- Cells are fully contiguous (no inset), with a **permanent 1px white
  stroke** between neighbours — safe here because each ring has a modest
  cell count (at most 128 new cells per arc at G8), unlike Family 2 below.
- `RADIAL_GAP = 1` between generation rings.
- `HOLE_R = 80` (empty centre hole before G0 starts), `BAND_1 = 46` per
  generation (standalone Level 1, Level 3; the combo's Level 1 half matches
  this exactly since it's the same visual unit).

Angular gaps, current state:

| Diagram | Layout | Gap |
|---|---|---|
| Standalone Level 1 | 3 arcs, 120° apart | 10° flat gap, 55° half-span each |
| Standalone Level 3 | 3 arcs, 120° apart (Arc1 — aligned dropped 2026-10-15) | 10° flat gap, same as Level 1 |
| Level 1+2 combo, Level 1 half | 3 arcs, 120° apart | 10° flat gap, same as standalone |
| Level 1+2 combo, Level 2 half | 3 zones of 2 petals, floating outside Level 1 with a radial gap (`STEM_GAP = 78`) + connector stem/dot back to Level 1's rim | `OUTER_GAP_WITHIN_DEG = 3` (within a pair), `OUTER_GAP_BETWEEN_DEG = 11` (between zones) — ported from the "Nine-Arc Composite" reference artifact's own constants, not re-derived |

**Standalone Level 2** (`build_level2_standalone.cjs`) is currently **not
runnable** — it depends on `level2_standalone_rows.json`, which was never
migrated into this repo (the comment at the top of the file says so). It
also uses a third, different gap convention (flat `WIDE_HALF = 3°` between
zones, linear-width `SEAM_LINEAR_HALF = 2.8` within a pair) that predates
the Level 1+2 combo's. Needs either its data generator migrated or
`level2_cross_rows.json` adapted to its expected shape before it can be
regenerated — flagged here so it isn't assumed current.

Slot/flip choices in the combo (RoY×YgB and YgB×BvR swap+reverse both
slots; BvR×RoY swaps slots but only reverses the flipped dataset) were
chosen empirically by minimising hue distance at each seam, not copied from
the standalone Level 2 diagram — its seam sits at a different point in each
petal's own t-span there.

## Family 2 — full-resolution "quick ref" diagrams

`build_summary_level2_ring.cjs`, `build_summary_rings.cjs` (the 3-ring
composite: Level 1 inner, Level 2 middle, Level 3 outer). Show the finished
primary-to-primary gradient at full resolution (all 257 points, G0–G8
merged and sorted by t) as ONE band per arc — no generation-doubling
ladder.

- **No stroke between cells.** At 257 abutting cells in one ring, a stroke
  rendered as a washed-out moiré (confirmed early on). Flat fill only.
- **Moiré/flicker fix**: even without a stroke, 257 adjacent flat-fill
  wedges don't rasterise to a perfectly shared edge — sub-pixel rounding
  leaves a hairline seam that reads as fine lines shimmering on screen
  (the renderer can't resolve a true zero-width join). Fixed with
  `SEAM_EPS_DEG = 0.03`: every cell gets a tiny angular overlap with its
  neighbours, small enough not to visibly eat into any real gap (the
  narrowest intentional one, Level 2's within-pair gap, is still ~15× that
  size). Applied in both scripts' `drawFullArc`.
- Gaps are **constant-LINEAR-width**, via `polar_lib.cjs`'s
  `angularHalfWidthAt(r, linearHalf) = asin(linearHalf/r)` — a genuine
  physical width at that ring's radius, not a fixed degree span (confirmed
  correct for "a straight line, equal gap" earlier in the project).

Gap convention, current state (2026-10-16, Ray's review):

| Gap | Width | Why |
|---|---|---|
| Level 1, between arcs (0°/120°/240°) | 60px on-screen | Matched to Level 2's between-pair gap — same angular position, both mark a boundary between unrelated hue families |
| Level 2, between pairs (0°/120°/240°, over each Level 1 arc's centre) | 60px on-screen | Needs to read as clearly separate — different families meeting |
| Level 2, within a pair (at each zone's own seam) | 10px on-screen | A join, not a separation — the two arcs in a pair are close relatives. (Went through 50px and 0px during review before landing here — 0px read as fully merged, which lost the "two arcs" distinction; 10px was the original value and confirmed correct on review.) |
| Level 3, between arcs (0°/120°/240°) | ~9–10px on-screen (unchanged, legacy `3mm` value) | Confirmed fine as-is — no established closer/farther relationship between the three arcs to justify an uneven gap (unlike Level 2's pairs) |

### The RENDER_SCALE gotcha

`build_summary_rings.cjs`'s canvas was grown from 1800 to 3000 viewBox
units at some point (to fit three rings without clipping) but its CSS
render size stayed at 1800px — so **1 viewBox unit only renders as 0.6
actual on-screen px**. `build_summary_level2_ring.cjs`'s viewBox (1800)
still matches its CSS size (1800px) 1:1, so it needs no correction.

Any gap in `build_summary_rings.cjs` specified as a direct on-screen px
target (the table above) goes through an explicit `RENDER_SCALE = 1800/3000`
correction before being converted to viewBox units — e.g. `60 / RENDER_SCALE`
for a genuine 60px gap, not `60` directly. **Before changing any gap value
in that file, check whether it's gone through this correction** — a bare
mm-based constant (like the old `L1_GAP_MM`/`L2_WITHIN_MM` pattern) will be
silently 0.6× too small once rendered.

`PX_PER_MM = 6` (used in `build_summary_level2_ring.cjs` and for Level 3's
unchanged gap in `build_summary_rings.cjs`) is still an unconfirmed
assumption — "1800 viewBox units ≈ 300mm" was never checked against a real
print/canvas size. Recalibrate if that's ever given.

## Shared geometry helper

`polar_lib.cjs` — `polar()`, `annularWedgePath()`, `angularHalfWidthAt()`,
`boundsSymmetric()`/`boundsAsymmetric()` (Level 1/3 vs. Level 2's gap
shapes), `drawArc()`. Required by every script in this folder except the
oldest ones that predate it (check each script's own `require`s). Was
missing from the repo until 2026-10-16 even though two committed scripts
depended on it — if a diagram script fails with `Cannot find module
'./polar_lib.cjs'`, that's this file not being where it's expected, not a
logic bug.

## Rendering a script

Every `build_*.cjs` here writes a standalone `.html` file (inline SVG, no
dependencies) to its own directory when run with plain `node`. To get a
PNG, screenshot that HTML with Playwright (chromium) — see any
`screenshot_*.cjs` in the project's working scratchpad for the pattern
(not committed here, since they're throwaway per-session scripts, not part
of the generation pipeline).
