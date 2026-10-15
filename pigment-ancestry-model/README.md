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
i↔N-1-i). **Level 3** does the same three-way across all three arcs — three
datasets, not four (see note below). A pencil is classified as "fit" if its
measured colour is within **ΔE ≤ 15.3** (CIE76, D65) of *any* point in
Level 1 ∪ Level 2 (checked first) or Level 3 (checked only if L1/L2 misses).

**Level 3 only has three arcs, not four (Ray's call, 2026-10-15):** the
original four were "Arc1 — aligned" (all three Level 1 arcs forward, no
flip) plus one flipped-arc variant each (Arc2/3/4). Arc1 was dropped —
each anchor role is warm-or-cool within its hue family, and every Level 1
arc pairs an anchor from two *different* families, so "aligned" always
combines a mix of warm and cool sides (2 warm + 1 cool at t=0, 1 warm + 2
cool at t=1, blended through the middle) and never settles toward a clean
warm or cool combination. That keeps it permanently medium-muted — average
chroma 28.7, range only 22.2–41.0 across all 257 points, versus 0.4–70.3
for the three flipped arcs, which actually swing from near-neutral to
vivid. Too muted to ever catch a vivid pencil, never muted enough to catch
a true neutral — it rescued **zero** book-scope pencils (versus 10/8/4 for
Arc4/Arc2/Arc3) before being dropped. Verified the drop doesn't change
coverage at all (771/1150 book-scope, 846/1294 combined, identical to
before) since Arc1 was never contributing. Old 4-arc data backed up at
`data/history/level3_cross_rows_PREARC1DROP_backup.json`.

## Current canonical anchors (as of this handoff)

| Role | Hex | Source | Munsell / LCh |
|---|---|---|---|
| Warm Red | `#e3212f` | Vermilion, Castle Arts Gold | — |
| Warm Yellow | `#ffd800` | Medium Cadmium Yellow (Imit.), Caran d'Ache Luminance 6901 | 4.68Y 8.69/13.41 |
| Cool Yellow | `#e7ed46` | Cadmium Yellow Lemon, Faber-Castell Polychromos 9201 | 1.54GY 9.04/10.85 |
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
- Book-scope (9 ranges, 1150 pencils): 782/1150 = **68.0%**
- Combined (11 ranges, 1294 pencils): 860/1294 = **66.5%**

**Status (2026-10-15): all six anchors now locked**, including Cool
Yellow — see the "Cool Yellow correction" writeup below for the full
cause/trade-off, same pattern as the two Warm Yellow corrections.

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
  level3_cross_rows.json       canonical Level 3 (3 three-way datasets —
                                "Arc1 — aligned" dropped 2026-10-15, see
                                below)
  never_fit_final_153.json     most recent full "pool" (never-fit) pencil list
  matches/                     per-range nearest-match results
  history/                     anchor-change audit trail (see above)
  chapter_*.json               worked-example data for the book's "how to
                                use the navigator" demo (12 chapter colours
                                vs the owned-pencil pool — see
                                scripts/investigations/). STALE as of
                                2026-10-15: built against the pre-correction
                                Cool Yellow anchor (#f6e83b), not yet
                                regenerated against the current one
                                (#e7ed46) — treat any t/generation/ΔE values
                                here as needing a re-run before reuse.
  coolyellow_candidates/       historical record of the 5 Cool Yellow
                                candidates tested (4 rejected, 1 —
                                cadmiumlemon, #e7ed46 — now canonical, see
                                "Cool Yellow correction" above)
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

## Cool Yellow correction (2026-10-15) — RESOLVED, all six anchors now locked

Previous: `#f6e83b` (Lemon Cadmium, Derwent Artists, H=99.4°). Ray's live
judgement: **too warm**, close enough to Warm Yellow to be hard to
distinguish. Same shape as the two Warm Yellow corrections before it —
numbers alone got it wrong first, Ray's eye against a live arc rendering
got it right.

First pass (numbers-led, wrong): four candidates tested against `#e7fa01`
(Ray's own colour-picker marker — later clarified as a *directional*
marker, not a precise target) and ranked by coverage cost:

| Candidate | Hex | Hue | Coverage delta |
|---|---|---|---|
| Lime Green, Derwent Coloursoft | `#d5e42e` | 107.8° | −13 book / −18 combined |
| Lime, Derwent Procolour | `#d1e42f` | 109.0° | −14 / −19 |
| Lemon Yellow, Caran d'Ache Luminance 6901 | `#f1ec29` | 101.8° | −10 / −14 |
| Lemon Lime, Derwent Chromaflow | `#cbdd00` | 107.9° | −31 / −36 |

Lime Green was recommended on these numbers. **Ray rejected it after
testing real pencil swatches against a live rendering of the arc**
("none look right on the arc") — repeat of the exact BvR six-sector
lesson: the metric isn't the whole picture.

Second pass (eye-led, correct): Ray tested a swatch at `#d5f129`
(H=110.8°) and confirmed that reads as "lime" — too far toward green. So
the real window is between the old anchor (99.4°) and that lime boundary.
Searched real pencils across H=99–111°, named pattern made the boundary
visible by itself ("Lemon/Citrus/Cadmium Yellow" up to ~105.7°, then
"Lime/Chartreuse" from ~107.8° on). Tested **Cadmium Yellow Lemon,
Faber-Castell Polychromos 9201 (`#e7ed46`, 1.54GY 9.04/10.85, H=105.7°)**
— confirmed by eye ("greens... placed better... yellow anchor... shows to
be different") and, unlike every candidate in the first pass, this one is
a net **coverage gain**, not a cost: book-scope 771→**782** (+11,
67.0%→68.0%), combined 846→**860** (+14, 65.4%→66.5%), no range lost
ground anywhere. **Locked in as the new canonical Cool Yellow.**
Old data backed up to `data/history/*_PRECOOLYELLOWFIX_backup.json`.

## Open items (read this part)

### 1. Level 1 vs Level 2 — structural finding, not a bug, but worth knowing
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

**Never-fit taxonomy (Ray, 2026-10-15; formalized, refined, and
regenerated after the Cool Yellow correction same day):** pencils that
don't fit either Level 1 or Level 2 — the pool in
`data/never_fit_final_153.json` (the "153" in the filename is stale; this
file is regenerated by hand whenever the canonical anchors change — see
the generation snippet in `scripts/classify_coverage.cjs`'s `classify()`
pattern, same ΔE≤15.3 + L1/L2-then-L3 logic). **Book-scope only, 368
pencils** — Derwent Drawing Pencils and Castle Arts Harmonious Collection
are excluded (`scripts/classify_never_fit_taxonomy.cjs` drops them at the
source, Ray's call: those two ranges were only ever added as a stress
test, not part of the book's 9 ranges). The taxonomy's shape held up
essentially unchanged across the Cool Yellow anchor swap (tint still
dominant at a similar proportion, hue-match confidence nearly identical) —
a good sign the taxonomy reflects something structural about the model,
not an artifact of one specific anchor set.

Each pencil is first checked for being **neutral** (Munsell chroma, not Lab
chroma — Lab C alone is unreliable both ways: "Rose Grey" is Lab C=39
despite the name, while "Graphite"/"Ash"/"Moonstone" are genuinely
near-achromatic at Lab C=2–4 despite not being named "grey" at all).
Neutral bands (Ray, refined same day — an initial cool/warm split by hue
family was tested and dropped, the real hue-family distribution didn't
back it up, so these are chroma-only):

| Band | Munsell C | Count |
|---|---|---|
| True Achromatic | 0–0.5 | 19 |
| Near-Neutral | 0.5–1.5 | 51 |
| Earth-Adjacent | 1.5–2.0 | 12 |
| **Total neutral** | ≤2.0 | **82 (22.3%)** |

Everything else is matched to its nearest Level 1/2 point and classified by
which Lab axis dominates the gap:

| Category | Count | % of total 368 |
|---|---|---|
| **tint** (pencil lighter than any nearby model point) | 191 | 51.9% |
| neutral (see bands above) | 82 | 22.3% |
| shade (pencil darker) | 35 | 9.5% |
| high-neon chroma (pencil more saturated than the model reaches) | 20 | 5.4% |
| undersaturated (vivid pencil, nearby anchor is more vivid still — see note below) | 14 | 3.8% |
| low chroma (pencil genuinely muted/grey, but not neutral-band low) | 8 | 2.2% |
| genuine hue gap (not a value/chroma issue at all) | 8 | 2.2% |
| hue gap — unreliable match (see note below) | 6 | 1.6% |
| oversaturated (moderate pencil, anchor nearby is even less saturated — see note below) | 4 | 1.1% |

**Classifier fix #1 (Ray, 2026-10-15):** found 6 entries (Dark Sap Green,
Walnut Brown Light, Lagoon, Indanthrone Blue, Hooker's Green, Walnut
Brown) where the *matched* model point itself was near-grey (matched
chroma 2.2–11.4) — not the pencil. Comparing dL/dC/dH against a
near-achromatic anchor is unreliable for every axis, not just hue (the
earlier hue-instability fix only protected the "hue gap" label, leaving
tint/shade/chroma exposed to the same bad anchor). These were landing in
"shade" or "high-neon chroma" purely because of which axis happened to
dominate against a near-meaningless baseline — e.g. Dark Sap Green
(pencil chroma 13.1) was labeled "too saturated" against a matched point
at chroma 2.2 and 179° away in hue, essentially the opposite colour.
Fixed: when the matched point's own chroma is too low to be a trustworthy
comparison baseline, classify as **"hue gap (unreliable match)"** instead
of making a directional claim that isn't really about the pencil.
Confirmed genuine by checking all 26 original "high-neon chroma" entries'
matched-point chroma — only these had a near-grey anchor (2.2–11.4);
everything else compares against a matched point with real chroma (22+)
and is a legitimate "needs more saturation than anything nearby" call.

**Classifier fix #2 (Ray, 2026-10-15):** mirror image of fix #1. 14
entries — Golden Yellow, Mustard, Butterscotch, Pineapple, Dandelion,
Naples Yellow, Yellow Ochre and others, all real pencil chroma 48.8–68.9
— were landing in "low chroma (too muted/grey)", which is visually
false: these are vivid golds and ochres, not muted. They only looked
"low chroma" because their matched point was an *even more* vivid
anchor (chroma 68–82, right where the Cadmium Yellow anchors sit) —
relatively less saturated than an extreme anchor isn't the same as
muted in any absolute sense. Split out into a new **"undersaturated"**
category. Clean break in the real data: genuinely muted pencils top out
at Lab chroma 27.3; the false positives start at 48.8 — no ambiguous
middle ground, so C=35 is a safe dividing line.

**Classifier fix #3 (Ray, 2026-10-15):** mirror of fix #2, found by Ray
spot-checking the xlsx tables directly against Munsell values. Holly
Green, Ice Blue, Pthalo Green Light, Peacock Green (Munsell C 6.5–9.44,
Lab C 29.1–38.2) were landing in "high-neon chroma" — but by Munsell
terms (the scale that's tracked "does this read as vivid" reliably
throughout this whole taxonomy) they're only moderately saturated, not
genuinely high/neon chroma. They only looked "too saturated" because
their matched point was even *less* saturated. Clean gap in the real
data: 9.44 (Peacock Green) to 10.28 (Perylene Brown), so Munsell C<10 is
the line. Split out into **"oversaturated"** — gated on Lab C<50 too, so
it doesn't also catch Neon Yellow: Neon Yellow's own Munsell chroma is
even lower (5.28) but its Lab chroma (92.7) genuinely exceeds the
model's own maximum anywhere (87.3, the Warm Yellow anchor) — a real
"too saturated" case, not a mislabeling, and its Munsell reading is
separately known to be unreliable (likely fluorescence-related, see
below).

**Calibration note, useful for any future by-eye pass:** across the 24
original "high-neon chroma" entries, Lab chroma runs roughly **4–6×**
Munsell chroma for ordinary pigments (e.g. Holly Green 5.9×, Mauve Deep
4.4×, French Rose 4.4×) — so a vivid pigment reading Munsell C 10–20 is
normal, not suspiciously low. **Neon Yellow is the one genuine outlier**
at 17.6× (next highest is Luminous Green at 6.7×) — consistent with it
being a literal fluorescent/"Neon"-branded, sRGB+P3-gamut-clipped
pigment. Fluorescent pigments emit at different wavelengths than they
absorb, which breaks the assumptions standard Munsell-renotation
conversion relies on, so its Munsell chroma (5.28) likely just doesn't
mean what it means for every other pencil here — trust its Lab chroma
(92.7, the actual spectrophotometer measurement) instead.

**Tint still dominates even after pulling neutrals out** — about half the
pool fails because it's lighter than anything the model produces.
Structural cause: Level 1/2/3 are built entirely from mixing between
saturated primaries — there's no "toward white" dilution step anywhere in
the pipeline, so the palest reachable colour at any hue is just the
lighter of that arc's two anchors. Ray independently hue-tested a sample
of the tint pool by eye and confirmed most genuinely read as lighter
versions of existing arc colours, not unrelated hues — of the 191,
**78.5% are within 20° hue of their nearest arc point** (66.5% within a
stricter 15°). The shade side is even cleaner: **94.3%** of shade misses
are within 15° hue of their nearest arc point — genuinely darker versions
of existing arc colours (Phthalo Green, Ultramarine, Viridian, Royal Blue,
Cornflower Blue). One asymmetry worth knowing: tints trend *less*
saturated as they lighten (consistent with a "blend toward white" fix),
but many shades are *more* saturated than their nearest arc point (Cobalt
Blue Deep, Ultramarine, Violet) — classic dark-and-vivid pigments
(phthalos, ultramarines, cobalts) the model's dark end doesn't reach. A
generic "blend toward black" wouldn't rescue these — it only desaturates
further, moving away from the target. The dark anchors themselves may
need more chroma, not a dilution layer.

**Tints are NOT mostly Level 1 — and they're geographically lopsided.**
Of the 191 tint misses, only 44% (84) are nearest to a pure Level 1 arc
point — the majority, 56% (107), are actually closer to a Level 2
cross-mix point. And **zero tints land anywhere near RoY (orange) or
RoY×YgB** — every one clusters in the green-through-violet half of the
wheel (Yellow-Blue, Blue-Red, and the YgB×BvR seam between them). Tracks
with real pencil sets: sky blues, pastel greens, lavenders are common
named "light" pencils; light oranges/warm pastels much less so, and the
RoY arc's own light end (Warm Yellow) is already high enough to cover
most of what exists there. So a tint "Level 4" fix wouldn't need to touch
the whole wheel evenly — it's specifically a green/violet problem, and
over half of it would need to interact with Level 2's cross-mixing, not
just extend the pure arcs.

**How clean are these calls, honestly?** Checked every pencil against
three boundary zones (Munsell band edges, weak-hue-match tint/shades at
dH 15–25°, and tint/shade/low-chroma/high-neon coin-flips where
|dL|≈|dC|): **74.5% (274/368) are clean**, don't touch any boundary zone.
The other **25.5% (94/368)** sit on at least one — about 1 in 4 is a
genuine judgment call, not a handful of arbitrary edge cases. Specific
examples flagged for Ray's by-eye pass: 13 different "White"-named
pencils span Munsell C 0.13–0.98 across both True Achromatic and
Near-Neutral (plausibly real formulation differences between ranges, not
measurement noise); Viridian and Pthalo Turquoise (same pigment family,
different ranges) land in different categories on tiny measurement
differences.

**Worth considering: a tint "Level 4" (each arc point blended toward
white) would likely rescue most of the tint pool**, and is well-supported
by both the structural cause and the hue-match evidence above. A matching
fix for shades is a separate, harder problem (see asymmetry above). An
earlier, now-abandoned pipeline (`test_bvr_split.cjs`'s `LADDER_SUPERSET`
idea, not migrated into this handoff) tried something close to the tint
fix but was never carried into the canonical model. **Book context
(2026-10-15): the chapter order changed — Ch3 Hue, Ch4 Arcs, Ch5 Tints/
Tones/Shades, Ch6 Value, Ch7 Chroma.** This makes Tints/Tones/Shades its
own chapter, separate from Arcs — current thinking is this should stay a
genuinely separate operation (take any arc colour, show the white/grey/
black blend ladder) rather than extending the Level 1/2/3 arc geometry
itself, so Ch4 stays purely about hue. Not actioned yet — still at the
"confirm the concept, build book-ready material" stage, Ray's call on
scope before anything gets built as an actual figure.

### 2. The Level 2 cross-arc "rescue" method — a reusable technique
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

### 3. Olive/dechroma dead end (book Chapter 5 pre-thinking)
Ray's plan for a Chapter 5 demo: pick a green via the arc, mix it
(chapter-3 style), then "dechroma" (pure chroma reduction, value held) to a
muted role colour like Olive. **Tested and failed as originally framed**:
the YgB Level 1 arc's hue and lightness are coupled (hue rotates toward
blue-green as lightness drops), so no point on the arc combines a muted
target's hue AND value at high chroma — the nearest-hue arc point to real
"Olive" pencil (`#818659`, L=54.5 C=25.5 H=112.0) sits at L=87 (dL=−33,
dC=−53 just to reach it). A pure value-held dechroma cannot work from a
Level 1 starting point. **Resolution per item #2 above: use the Level 2
cross-arc method instead** (green × violet cross-mix), which is what
actually nailed the `#00bb00 → #497249` example. Ray's note: *"Keep this as
a method to come back to shortly"* — i.e. apply the Level 2 cross-mix
approach to redo the Chapter 5 olive demo properly, rather than the
dechroma framing. See `scripts/investigations/build_olive_dechroma.cjs`
(the failed attempt, kept for the record of why it fails) and
`build_crossarc_demo.cjs` (the method that works).

### 4. Not yet started
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
