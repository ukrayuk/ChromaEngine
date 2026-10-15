# Pigment Ancestry Model — engineering handoff

This is the technical/data-engineering side of Ray's "Pigment Ancestry Model"
(Colour Family Arc System) for *Colour Theory for the Coloured Pencil
Artist* (Studio Artistry by Ray). It's the migrated output of a long cloud
session whose work never made it into a repo — this folder is everything a
fresh session needs to pick the work back up without replaying that history.

Read this file fully before touching the data or scripts. The second most
important thing to read is **"Open items"** near the bottom — that's the
actual unfinished work.

## What the model is

Six hue "roles" (Warm Red, Warm Yellow, Cool Yellow, Cool Blue, Warm Blue,
Cool Red) anchor three **Level 1 arcs**, each spanning one warm + one cool
primary from two *different* colour families (cross-family ancestry pairs,
not same-family warm/cool pairs):

- **Red-Yellow (RoY)** → Orange
- **Yellow-Blue (YgB)** → Green
- **Blue-Red (BvR)** → Violet

Each arc is a **dyadic recursive-midpoint subdivision**: start with the two
endpoint anchors (generation 0), then at each generation mix every adjacent
pair 50:50 via spectral.js (Kubelka-Munk pigment mixing, not RGB blending).
8 generations → 257 points per arc (2, 3, 5, 9, 17, 33, 65, 129, 257).

**Level 2** cross-mixes two adjacent Level 1 arcs point-for-point at the same
t/generation (both "like" — position i↔i — and "flipped" — position
i↔N-1-i). **Level 3** does the same three-way across all three arcs. A
pencil is classified as "fit" if its measured colour is within **ΔE ≤ 15.3**
(CIE76, D65) of *any* point in Level 1 ∪ Level 2 (checked first) or Level 3
(checked only if L1/L2 misses).

## Current canonical anchors (as of this handoff)

| Role | Hex | Source | Munsell / LCh |
|---|---|---|---|
| Warm Red | `#e3212f` | Vermilion, Castle Arts Gold | — |
| Warm Yellow | `#ffd800` | Medium Cadmium Yellow (Imit.), Caran d'Ache Luminance 6901 | 4.68Y 8.69/13.41 |
| Cool Yellow | `#f6e83b` | Lemon Cadmium, Derwent Artists Pencils | — **SEE OPEN ITEMS: this is under active revision** |
| Cool Blue | `#0082b5` | Cerulean Blue, Castle Arts Gold | — |
| Warm Blue | `#5f6bca` | synthetic (Munsell-derived) | 8PB 4.8/13 |
| Cool Red | `#c62d6a` | synthetic (Munsell-derived) | 8.25RP 4.5/14 |

Why RoY/YgB use real pencils and BvR uses synthetic (Munsell/colour-science
derived) anchors: compared all-real vs all-synthetic vs this mix against
book-scope classification coverage — the mix won, and BvR's own coverage
jumps substantially on synthetic anchors while RoY/YgB do best on their real
ones. See `data/history/` for the two earlier BvR approaches that were
tried and abandoned before landing here (below).

**Current coverage** (ΔE≤15.3, `scripts/classify_coverage.cjs`):
- Book-scope (9 ranges, 1150 pencils): 771/1150 = **67.0%**
- Combined (11 ranges, 1294 pencils): 846/1294 = **65.4%**

## Decision history (condensed)

1. **BvR started as a single real-pencil arc** (Ultramarine → Magenta).
   Weak coverage on magentas/fuchsias/berries. → `data/history/*_REALANCHORS_backup.json`
2. **Tried splitting BvR into two sub-arcs** (Blue-Violet + Violet-Red,
   bridged by a shared "Purple" G1 midpoint anchor, giving 6 Level-1 arcs
   total instead of 3). A narrow pool-count metric said this was *better*
   (1796/1825 placed vs 1781/1825), but it was visually wrong — the two new
   sub-arcs produced muddy, desaturated colour exactly at the seam they
   were meant to fix (visible in a live rendering, not caught by the
   metric). **Abandoned.** This is the "stop, regroup, start again" moment
   that produced the current model. Lesson: a fit-count metric can pass
   while the actual colour is wrong — always confirm with a rendered
   swatch/diagram, not just the number. (Same lesson relearned below with
   Cool Yellow.)
3. **Replaced BvR with a single synthetic arc** (current: Warm Blue
   `#5f6bca` / Cool Red `#c62d6a`, Munsell-derived). This is what's locked
   in now.
4. **Warm Yellow**: started as Yellow Ochre (`#f7c81e`, chroma 11.61,
   chosen by hue-precision-first search). Found a systematic cross-brand
   gap — every pencil range is missing a vivid "Cadmium Yellow"-type
   pencil near the model's warm-yellow position. Swapped to Lemon, Lyra
   Rembrandt Polycolor (`#ffd200`) 2026-10-04, confirmed by Ray's own
   independent by-eye audit. Ray then caught his own slip in the exact hex
   — corrected to `#ffd800` (Medium Cadmium Yellow Imit., Caran d'Ache
   Luminance 6901) 2026-10-09. **This is the current value.**
   `data/history/*_PREVIVIDYELLOW_backup.json` = before the `#ffd200` swap;
   `data/history/*_PREFFD800FIX_backup.json` = after `#ffd200`, before the
   `#ffd800` correction.
5. **ΔE fit threshold** raised from 14 to **15.3** at anchor sign-off — this
   is the only threshold used everywhere now.

## Repo layout

```
lib.cjs                        core math: hexToLabD65, mixSpectral (50:50
                                dyadic step), mixN (equal-N mix), mixTrueShare/
                                mixTrueEqual (solves for the factors that
                                give a TRUE concentration share — spectral.js
                                weights by factor²×tintingStrength²×luminance,
                                NOT by the raw factor), labDist (CIE76)
package.json                   spectral.js ^3.0.0 — run `npm install`
data/
  level1_pure_rows.json        canonical Level 1 (3 arcs × 257 points)
  level2_cross_rows.json       canonical Level 2 (6 cross-arc datasets)
  level3_cross_rows.json       canonical Level 3 (4 three-way datasets)
  never_fit_final_153.json     most recent full "pool" (never-fit) pencil list
  matches/                     per-range nearest-match results
  history/                     anchor-change audit trail (see above)
  chapter_*.json               worked-example data for the book's "how to
                                use the navigator" demo (12 chapter colours
                                vs the owned-pencil pool — see
                                scripts/investigations/)
  coolyellow_candidates/       test rows for 4 candidate Cool Yellow
                                replacements (see Open items)
scripts/
  gen_level1_pure_rows.cjs     THE canonical generator — edit ARCS here to
                                change an anchor, then re-run this, then
                                gen_level2_cross_rows.cjs, then
                                gen_level3_cross_rows.cjs (each reads the
                                previous level's output)
  gen_level2_cross_rows.cjs
  gen_level3_cross_rows.cjs
  classify_coverage.cjs        official book-scope/combined coverage numbers
                                + per-range breakdown; also the template for
                                testing a candidate anchor swap (loadModel()
                                takes any L1/L2/L3 file triple)
  diagrams/                    SVG diagram builders. build_level1_level2_combo_v2.cjs
                                is the proven, bug-fixed reference pattern
                                (polar wedge math, "filled" cell style —
                                contiguous cells + white 1px stroke). Needs
                                Playwright (chromium) to screenshot the HTML
                                it writes; see any script for the pattern.
                                NOTE: there were many more exploratory diagram
                                variants in the original session (circular,
                                circular_gapped, circular_tiles, straight,
                                etc.) that were NOT migrated — combo_v2 and
                                the two circular_filled builders here are the
                                ones confirmed current. Rebuilding another
                                variant from scratch using combo_v2's pattern
                                is straightforward if needed.
  investigations/              live/recent working threads, not yet "done":
                                chapter worked-examples, the Level-2
                                cross-arc rescue method, the olive/dechroma
                                dead-end, the Cool Yellow candidate tests —
                                see Open items below for what each means
reference_images/              a handful of the most recent/important
                                rendered outputs (PNG/SVG), for quick visual
                                reference without re-running anything
```

To regenerate the full model after an anchor change:
```
node scripts/gen_level1_pure_rows.cjs
node scripts/gen_level2_cross_rows.cjs
node scripts/gen_level3_cross_rows.cjs
node scripts/classify_coverage.cjs
```
`master.json` (the measured pencil database, 1825 pencils) is expected at
`/home/user/chromaengine/data/master.json` on the original machine — on a
fresh clone, point scripts at wherever ChromaEngine's `data/master.json`
actually lives.

## Open items (read this part)

### 1. Cool Yellow anchor — active, unresolved
Current: `#f6e83b` (Lemon Cadmium, Derwent Artists). Ray's live judgement:
**too warm**. He pushed a colour picker toward `#e7fa01` — **not a precise
target, a directional marker** (push the hue further toward green/vivid
chartreuse until it reads right by eye, don't try to numerically match that
exact hex).

Four candidates were tested (`data/coolyellow_candidates/`,
`scripts/investigations/gen_coolyellow_test_set.cjs` +
`compare_coolyellow_test.cjs`):

| Candidate | Hex | Hue match to `#e7fa01` | Gamut | Coverage delta |
|---|---|---|---|---|
| Lime Green, Derwent Coloursoft | `#d5e42e` | ~exact (107.8° vs 107.6°) | clean | −13 book / −18 combined |
| Lime, Derwent Procolour | `#d1e42f` | 109.0° | clean | −14 / −19 |
| Lemon Yellow, Caran d'Ache Luminance 6901 | `#f1ec29` | 101.8° (only ~⅓ of the shift) | clean | −10 / −14 |
| Lemon Lime, Derwent Chromaflow | `#cbdd00` | ~exact (107.9°) | sRGB-clipped | −31 / −36 |

**Lime Green was recommended on these numbers — Ray rejected it after
testing real pencil swatches against a live rendering of the arc** ("none
look right on the arc, they really do not fit at all"). This is a repeat of
the exact lesson from the BvR six-sector episode: the metric isn't the
whole picture, the rendered result is. **Next step: Ray needs to be at his
own machine, testing candidate hexes against the live arc rendering by eye
— that's the actual bottleneck, not more numeric search.** Don't just
re-run the coverage comparison and recommend a winner from the table again.

### 2. Level 1 vs Level 2 — structural finding, not a bug, but worth knowing
Tested all 273 real pencils in green-hue territory (H 100–190°, C>15)
against the model: only **43.2%** fit on the pure YgB Level 1 arc alone,
but **80.6%** fit once Level 2 is included. The worst-fitting ones on
Level 1 alone are *all* muted/earthy greens (Khaki Green ΔE 42→4 via L2,
Olive Green 43.4→9.1, Willow Green, Pale Sage, Light Moss, Bohemian Green
Earth). Cause: the pure Level 1 arc is a straight high-chroma blend between
two vivid primaries — it structurally only passes through vivid green
territory. Muted real-world greens only get reached by Level 2 cross-mixing
(blending with a BvR-family violet knocks chroma/value down together).
**This is expected, not broken** — but if any tool renders real pencil
swatches against the plain Level 1 wheel for visual QA, most real greens
will look like they "don't fit," which is exactly what's going on in item
#1 above. Worth deciding whether a "colour lab"-style QA tool should show
Level 2 alongside Level 1 so muted colours have a place to visually land.

### 3. The Level 2 cross-arc "rescue" method — a reusable technique
Worked example: target `#497249` (muted sage-green) doesn't fit the pure
YgB arc at all, but fits **ΔE 8.7** on the `YgB × BvR — like` Level 2
dataset. Recipe: YgB arc point at t=0.430 (G7) = `#49c454` (a vivid green,
Cool Yellow + Cool Blue mix) cross-mixed 50:50 with the BvR arc point at
the *same* t/generation = `#79478e` (a violet, Warm Blue + Cool Red mix) →
`#5f8561`, ΔE 8.7 from target. See
`scripts/investigations/build_crossarc_demo.cjs` for the full worked
pattern. **Use this method whenever a muted/earthy target doesn't fit
Level 1 — check Level 2 (adjacent-arc cross-mix) before reaching for any
kind of "dechroma" transform.**

### 4. Olive/dechroma dead end (book Chapter 5 pre-thinking)
Ray's plan for a Chapter 5 demo: pick a green via the arc, mix it
(chapter-3 style), then "dechroma" (pure chroma reduction, value held) to a
muted role colour like Olive. **Tested and failed as originally framed**:
the YgB Level 1 arc's hue and lightness are coupled (hue rotates toward
blue-green as lightness drops), so no point on the arc combines a muted
target's hue AND value at high chroma — the nearest-hue arc point to real
"Olive" pencil (`#818659`, L=54.5 C=25.5 H=112.0) sits at L=87 (dL=−33,
dC=−53 just to reach it). A pure value-held dechroma cannot work from a
Level 1 starting point. **Resolution per item #3 above: use the Level 2
cross-arc method instead** (green × violet cross-mix), which is what
actually nailed the `#00bb00 → #497249` example. Ray's note: *"Keep this as
a method to come back to shortly"* — i.e. apply the Level 2 cross-mix
approach to redo the Chapter 5 olive demo properly, rather than the
dechroma framing. See `scripts/investigations/build_olive_dechroma.cjs`
(the failed attempt, kept for the record of why it fails) and
`build_crossarc_demo.cjs` (the method that works).

### 5. Not yet started
- Chapter 5's full chroma/value concept demo (4 axes: hue-only,
  value+chroma together, chroma-only, value-only — feasibility already
  probed in principle: hue-only layering works well from a mid-chroma base
  like Yellow Ochre but fails badly from a high-chroma base like
  Vermilion — not yet built as an actual book figure).
- The "two discrete endpoint colours per quad" alternative Chapter 5
  approach (an image Ray shared of two rendered spheres) — explicitly a
  todo he's tracking separately, not actioned here.
- BvR arc demos for the "how to use the navigator" chapter — explicitly
  deferred by Ray ("with a short line that it will be looked at later").
- P3-vs-sRGB gamut investigation: 18.3% of 1825 pencils are sRGB-clipped,
  70.7% of those rescued under P3 — and critically, several of *our own
  anchors* are themselves measurably chroma-clipped by the sRGB pipeline
  (e.g. the Lemon anchor loses ~13.7 points of true chroma via the sRGB
  round-trip). Flagged as a legitimate future investigation, not actioned —
  anchors remain locked on sRGB-derived hex values throughout.

## Working conventions worth preserving

- Always use **spectral.js v3.0** Color-class API (`new spectral.Color(hex)`,
  `spectral.mix([c,w],...)`, `spectral.gradient(t,[a,0],[b,1])`) — not the
  old 2.0.2 flat-hex-string API.
- Lab is always **D65 2°**, computed via `hexToLabD65` in `lib.cjs`
  (XYZ→Lab, Xn=0.95047 Yn=1.0 Zn=1.08883) — not the master.json
  `lab_d50_2` field directly.
- ΔE is CIE76 (`labDist`) throughout, not CIE2000 or OKLab ΔE — chosen for
  consistency with every number already produced, though note item #2 in
  "open items" above re: CIE76's non-uniformity (same ΔE represents a
  bigger perceptual shift on low-chroma colours like Cool Blue than
  high-chroma ones like Warm Yellow — confirmed by a split-swatch visual
  test, not yet acted on beyond noting it).
- Before changing any canonical anchor: back up the three current
  `data/level*_*.json` files with a descriptive `_BACKUP` suffix (matching
  the existing `data/history/` pattern) before overwriting, regenerate all
  three levels, rerun `classify_coverage.cjs`, and **always render a visual
  check before recommending the change** — the coverage number alone has
  been actively misleading twice now (the BvR six-sector split, and
  Lime Green).
