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
| Cool Blue | `#0088d6` | Cerulean Blue, Castle Arts Premium Soft Touch | 1.33PB 5.17/13.15 |
| Warm Blue | `#5a42ab` | Mauve Deep, Castle Arts Premium Soft Touch | 9.59PB 3.57/13.86 |
| Cool Red | `#c13074` | Middle Purple Pink, Faber-Castell Polychromos 9201 | 6.39RP 4.46/13.88 |

Why RoY/YgB use real pencils and BvR too: compared all-real vs
all-synthetic vs this mix against book-scope classification coverage early
on — the mix won at the time. All three BvR primaries have since moved to
real pencils (see "Warm Blue correction" and "Cool Red correction" below).
See `data/history/` for the two earlier BvR approaches that were tried and
abandoned before landing here.

**Current coverage** (ΔE≤15.3, `scripts/classify_coverage.cjs`):
- Book-scope (9 ranges, 1150 pencils): 802/1150 = **69.7%**
- Combined (11 ranges, 1294 pencils): 879/1294 = **67.9%**

**Status (2026-10-20): all six anchors locked on real pencils** — see the
"Warm Blue correction", "Cool Blue correction" and "Cool Red correction"
writeups below for the full cause/trade-off, same by-eye-overrides-numbers
pattern as Cool Yellow.

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
3. **Replaced BvR with a single synthetic arc** (then: Warm Blue `#5f6bca`
   / Cool Red `#c62d6a`, both Munsell-derived). Superseded 2026-10-19 —
   Warm Blue moved to a real pencil, see "Warm Blue correction" below.
   Cool Blue (never synthetic, but only ever gamut-corrected rather than
   re-picked) also moved to a better real pencil the same day — see
   "Cool Blue correction" below. Cool Red, the last fully synthetic
   anchor, moved to a real pencil the next day — see "Cool Red
   correction" below. All six primary anchors are now real pencils.
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
  diagrams/                    SVG diagram builders. See RENDERING.md in
                                this folder for the full conventions (gap
                                widths, radius bands, the two different
                                cell-boundary styles, a scale gotcha to
                                watch for). build_level1_level2_combo_v2.cjs
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

## Warm Blue correction (2026-10-19) — RESOLVED, five of six anchors now on real pencils

Previous: `#5f6bca` (synthetic, Munsell-derived, 8PB 4.8/13 — never a real
pencil at all). Found while investigating the never-fit "shade" taxonomy:
of 39 shade pencils, 24 sat in the 180–320° hue band spanning both blue
anchors. Outside that band every single one (17/17) was already explained
by the full tint+shade value-shifted search; inside it only 13/24 — and
critically, the 11 still failing weren't spread across the band, they sat
in a tight 288.8–311.8° window centred almost exactly on Warm Blue, not
Cool Blue (whose neighbourhood was already clear after the gamut-clipping
fix, see "Current state" in `_Status.md`). Unlike Cool Blue, Warm Blue had
never been validated against a real pigment at all — pure colour-science
construction from a Munsell target, never checked against a measured
anchor.

Tested real PB-family book-scope pencils near the target, same method as
Cool Yellow — swap candidate in, regenerate all three levels, check both
overall coverage and how many of the 11 cluster pencils rescue:

| Candidate | Hex | Book coverage delta | Cluster rescued |
|---|---|---|---|
| Ultramarine, Caran d'Ache Luminance 6901 | `#1e5cda` | −17 | 10/11 |
| Fra Angelico Blue, Faber-Castell Polychromos | `#2353ce` | −11 | 10/11 |
| Lapis Blue, Derwent Chromaflow | `#1f5ac6` | −18 | 10/11 |
| Cobalt Blue Hue, Newell Prismacolor | `#2561cc` | −13 | 10/11 |
| **Mauve Deep, Castle Arts Premium Soft Touch** | `#5a42ab` | **+3** | **10/11** |
| Ultra Blue, Holbein | `#445bba` | +2 | 8/11 |
| Imperial Violet, Newell Prismacolor | `#5251a7` | +4 | 8/11 |
| Purple Lake, Castle Arts Gold | `#685fbb` | +0 | 1/11 |
| Dark Ultramarine Violet, Faber-Castell Polychromos | `#6062b3` | −9 | 0/11 |

The strong blues rescue most of the cluster but cost real coverage
elsewhere — too saturated/narrow, pulls the whole arc off balance. Mauve
Deep is the only candidate that does both at once. **Same numbers-vs-eye
pattern as Cool Yellow**: Ray's first reaction to a swatch comparison was
"mauve deep is too purple" — but that swatch comparison included *two*
different "Mauve Deep" pencils that exist in the dataset, Castle Arts
Gold's (`#9f59b7`, true Munsell **P** family — genuinely too purple, never
tested as a candidate) and Castle Arts Premium Soft Touch's (`#5a42ab`,
Munsell **PB** family — the actual candidate). Once clarified which one
was on the table, confirmed by eye as fine. **Locked in as the new
canonical Warm Blue.** Old data backed up to
`data/history/*_PREWARMBLUE_backup.json`.

Net effect: book-scope 782→**785** (+3, 68.0%→68.3%), combined
860→**862** (+2, 66.5%→66.6%) — modest on the coarse pure-arc number, as
expected, since this is primarily a value-shifted-space fix. The real
effect shows up there: the full tint+shade+pure sweep across the
non-neutral never-fit taxonomy went from 209/257 (81.3%) to **227/257
(88.3%)** — an 18-pencil gain from this one anchor swap, almost entirely
on the shade side (14/41 → 26/39). Also incidentally resolves Mauve
Deep's own prior standing as one of the never-fit high-neon-chroma
pencils, since an anchor trivially fits itself.

## Cool Blue correction (2026-10-19) — RESOLVED, five of six primary anchors now on real pencils (corrected, was mis-stated as six here; Cool Red was still synthetic until 2026-10-20 — see "Cool Red correction" below)

Previous: Cerulean Blue, Castle Arts Gold (`#0082b5`, 6.77B 4.78/10.78,
gamut-clipped, trueLab-corrected 2026-10-18). Prompted by the Warm Blue
correction above: once Warm Blue became a real, darker, more saturated
pencil, the ΔE between the two blue anchors jumped from 37.1→53.3 on
stored hex (48.6→64.4 on true Lab) — hue separation widened from 56° to
67°. Unlike Warm Blue, Cool Blue had never been checked against
alternative real pencils, only gamut-corrected in place.

Tested real B/PB-family book-scope pencils, same two-axis method:

| Candidate | Hex | Munsell | Book coverage delta | ΔE to Warm Blue |
|---|---|---|---|---|
| Turquoise Blue, Caran d'Ache Pablo 666 | `#01afce` | 4.96B | −24 | 74.5 |
| Turquoise Blue, Holbein | `#0075a8` | 7.41B | −6 | 59.9 |
| Cobalt Blue [hue], Caran d'Ache Pablo 666 | `#00689c` | 9.71B | −14 | 52.1 |
| Ice Blue, Caran d'Ache Luminance 6901 | `#00557f` | 7.63B | −33 | 56.2 |
| Grey Blue, Caran d'Ache Luminance 6901 | `#1976a4` | 0.67PB | −43 | 51.9 |
| Cerulean Blue Middle, Castle Arts Gold | `#00abe4` | 8.03B | +0 | 67.8 |
| Intense Blue, Castle Arts Premium Soft Touch | `#0076ad` | 8.38B | +2 | 57.4 |
| Spectrum Blue, Holbein | `#0069b2` | 1.33PB | +2 | 46.0 |
| Brilliant Blue, Derwent Chromaflow | `#006dab` | 1.27PB | +3 | 47.0 |
| Cerulean Blue Middle, Castle Arts Premium Soft Touch | `#0096da` | 9.71B | +17 | 59.3 |
| True Blue, Newell Prismacolor | `#0083cd` | 1.7PB | +17 | 48.4 |
| **Cerulean Blue, Castle Arts Premium Soft Touch** | `#0088d6` | 1.33PB | **+17** | **51.0** |
| Cerulean Blue [hue], Holbein | `#0082cf` | 1.45PB | +18 | 49.4 |

Four candidates gained +17/+18 book-scope coverage, well clear of
everything else tested — a bigger single-anchor gain than the Warm Blue
fix's own +3. None of them rescued the still-failing shade-greens cluster
(Pthalo/Jungle/Peacock Green etc.), confirming that failure is the
arc→black construction problem, not Cool Blue's placement.

Checked the gain isn't a numbers-only illusion before locking it in (Ray's
challenge: "if we move it more PB, no pencils will be captured anyway?").
Diffed the exact book-scope fit sets old vs new: **23 gained, 6 lost, net
+17.** 21 of the 23 gained are real blues at hue 243–310° — Light
Ultramarine, Sky Blue ×2, Middle Phthalo Blue, Lapis Blue, Blue Orchid,
Cobalt Blue 10%/Deep/Hue, Smalt Blue, Cerulean Blue ×3 variants, Primary
Blue, Blue Violet Lake, Blue Lake, Non-Photo Blue, Light Cerulean Blue —
exactly the real cobalt/ultramarine/phthalo-blue pencils that sit in the
hue gap *between* the old Cool Blue (238°) and Warm Blue (305°), with
nowhere to land until that gap got filled in. The 6 lost are all real
greens (hue 159–199°: Dark Phthalo Green, Tropical Rain, Peridot, Dark
Sap Green, Castle Green Deep, Grass Green) that drift just outside
threshold as the YgB arc's green midpoint shifts slightly. A genuine,
specific trade, not cosmetic rebalancing.

Picked Castle Arts Premium Soft Touch's "Cerulean Blue" over the
numerically-tied Holbein "Cerulean Blue [hue]" — same pigment name as the
outgoing anchor, just the better-calibrated real sample; Ray's call after
comparing swatches ("very similar though, give it a go"). **Locked in as
the new canonical Cool Blue.** Old data backed up to
`data/history/*_PRECOOLBLUEFIX_backup.json`.

Net effect: book-scope 785→**802** (+17, 68.3%→69.7%), combined
862→**881** (+19, 66.6%→68.1%). Also tightens the Warm/Cool Blue family
split: ΔE to Warm Blue drops from 64.4 to 51.0, hue separation from 67.1°
to 47.3° — Cool Blue sits just inside Munsell PB (1.33PB) rather than B,
close enough to the B/PB boundary that it still reads as the cooler,
cyan-leaning end against Warm Blue's violet-leaning 9.59PB. The full
tint+shade+pure sweep across the non-neutral never-fit taxonomy (now 253
after also excluding 4 confirmed-fluorescent pencils, see below) went to
**228/253 (90.1%)**, 25 genuinely unexplained — see "Chroma ceiling
category" below for 7 of those 25 being pulled out as structurally
explained rather than unresolved, bringing the live count to 18.

## Fluorescent pencils excluded from the taxonomy (2026-10-19)

Luminous Rose, Luminous Opera (Holbein) and Neon Yellow, Neon Pink
(Newell Prismacolor) dropped from `never_fit_taxonomy.json` entirely —
confirmed fluorescent/emissive pigments (literal "Neon"/"Luminous"
branding; Neon Yellow's own Lab chroma runs 17.6× its Munsell chroma, see
the fluorescent-pigment section below), not pigments that mix by ordinary
subtractive colour theory. Out of scope for this model rather than
unsolved. Same mechanism as `DROPPED_RANGES` in
`classify_never_fit_taxonomy.cjs` — see `EXCLUDED_FLUORESCENT` there.

## Chroma ceiling category (2026-10-20)

Ray's observation: the 7 "high-neon chroma" pencils still unresolved
after the Cool Blue fix (Fra Angelico Blue, Hollywood Pink, Ultramarine,
Marigold, Purple, Purple Light, French Rose) are the mirror image of the
neutral bands at the other end of the chroma axis — not a coincidental
near-miss worth continuing to chase, a structural ceiling. No mix of the
six primary anchors can exceed the chroma of its own ingredients, and the
anchors' own Munsell chroma (Cool Yellow 10.85, Cool Blue 13.15, Warm
Yellow 13.41, Warm Blue 13.86, Cool Red synthetic 14.0, Warm Red 16.65 —
the outlier) tops out well below all 7 of these pencils (Munsell C
15.71–17.84). Confirmed by testing whether anything available could raise
the ceiling without cost: every anchor candidate pushed toward higher
saturation this session (Fra Angelico Blue as Warm Blue, the earlier
strong-blue Warm Blue candidates, the saturated Cool Blue candidates) did
gain local chroma but cost book-scope coverage everywhere else (−9 to
−28 each time) — the anchors already sit close to the best chroma/
coverage balance the real pencil pool offers.

Added a `'chroma ceiling (exceeds anchor maximum)'` taxonomy category in
`classify_never_fit_taxonomy.cjs`, threshold Munsell C ≥15.65 — set from
the real data's own clean gap between the last entry the full sweep DOES
rescue (Brilliant Yellow, Munsell C 15.60) and the first that never does
(Marigold, 15.71), same by-eye-plus-data-gap method as the neutral bands.
Only applied within pencils already landing in "high-neon chroma (too
saturated)" by the normal nearest-point logic, so it can't misfire on an
unrelated category. Pulled out of the "still unresolved" count the same
way neutral and fluorescent are — explained-and-excluded, not open.
Brings the live genuinely-unexplained count from 25 to **18**.

## Cool Red correction (2026-10-20) — RESOLVED, six of six primary anchors now on real pencils

Previous: synthetic, Munsell-derived (`#c62d6a`, 8.25RP 4.5/14, never a
real pencil). Ray's call: "cannot have 5 pencil based and one not" — the
last fully synthetic anchor left, after Warm Blue and Cool Blue both
moved to real pencils the day before.

Ray's own first candidate, Bengal Rose Deep (Castle Arts Gold, `#cb166a`,
8.04RP 4.41/15.5), tested at −15 book-scope — same pattern as every
other "more saturated real candidate" tried on the other anchors this
project, too strong, pulls the arc off balance. Scanned the wider RP/R
neighbourhood (hue 345–20°, L 30–58, Lab C>40 across the book ranges):

| Candidate | Hex | Munsell | Book delta |
|---|---|---|---|
| Bengal Rose Deep, Castle Arts Gold | `#cb166a` | 8.04RP 4.41/15.5 | −15 |
| Magenta, Derwent Chromaflow | `#a52158` | 8.5RP 3.71/11.85 | −11 |
| Purplish Red, Caran d'Ache Luminance 6901 | `#ba175e` | 8.63RP 4.04/14.24 | −19 |
| Magenta, Holbein | `#c62061` | 9.19RP 4.34/14.5 | −12 |
| **Middle Purple Pink, Faber-Castell Polychromos** | `#c13074` | 6.39RP 4.46/13.88 | **+0** |
| Magenta, Newell Prismacolor | `#cd3765` | 9.9RP 4.71/13.65 | −3 |
| Carmine, Caran d'Ache Pablo 666 | `#ca2857` | 1.27R 4.45/14.1 | −11 |
| **Fuchsia, Faber-Castell Polychromos** | `#d83a70` | 8.97RP 4.97/14.64 | **+0** |
| Purplish Red, Caran d'Ache Pablo 666 | `#b23374` | 5.19RP 4.22/12.71 | −11 |

Only two candidates tie the synthetic exactly at +0 cost: Middle Purple
Pink and Fuchsia. Middle Purple Pink is also the closer visual match to
the outgoing synthetic (L 45.2 vs 45.5, C 61.8 vs 62.8, hue 356.3° vs
2.3° — barely 6° apart), confirmed by Ray looking at the swatch directly
rather than the numbers alone ("looking at the colour itself middle
purple pink is the better option"). **Locked in as the new canonical
Cool Red.** Old data backed up to `data/history/*_PRECOOLREDFIX_backup.json`.

Net effect: book-scope holds exactly at 802/1150 (69.7%, confirmed +0),
combined dips slightly to 879/1294 (67.9%, −2 — from the two extra
non-book ranges, not part of the candidate search). The 18
genuinely-unexplained pencils are completely unchanged — Cool Red sits
nowhere near the green/teal shade cluster, so this correction doesn't
touch that problem at all. **All six primary anchors are now real
pencils, closing out the last item from the original "mix of real and
synthetic" decision (see Decision history #3 above).**

## YgB shade-greens — a proven structural limit, not an open search (2026-10-20)

The 12 pencils left in the "shade (too dark)" category after the Cool
Blue fix (Jungle Green, Beryl Green, Grass Green, Summer Green, Viridian,
Pthalo Turquoise ×2, Castle Arts Premium Soft Touch's Teal Green/Pthalo
Green/Pthalo Green Light/Pthalo Turquoise/Emerald Green/Castle Green)
cannot be reached by any Yellow-Blue construction — real, synthetic, or
hypothetical. This was tested exhaustively rather than assumed.

**Where the problem sits.** Checked each of the 12 against the real,
unmodified YgB arc at full resolution: every nearest match sits at t>0.5
(the G1-to-Cool-Blue half), none in the Yellow-to-G1 half. Checked L2/L3
cross-arcs directly against all 12: consistently 1.2–2.5× *worse* than
the pure L1 arc, ruling out a third-family escape route — mixing in Red
or Blue-Red just pulls hue further from where these greens sit.

**What was tried on the anchors themselves, all ruled out:**
- Per-arc dark mixing targets (a real saturated pigment per family —
  Perylene Brown/Beryl Green/Bleu de Nîmes for RoY/YgB/BvR respectively,
  correctly scoped) instead of mixing toward black: 0/12.
- A self-generated darkened G1 as the shade target, several fractions:
  0/12, no better than black.
- Asynchronous value-drop on both Yellow and Blue (Yellow dropping
  further than Blue — e.g. −15/−10): genuinely rescued **4/12** as pure
  arc points (Jungle Green, Grass Green, Pthalo Green, Pthalo Green
  Light), confirmed clean after finding and fixing a real bug in the test
  harness (`colorFromTrueLab(...).toString()` produces an invalid string
  when called outside a proper spectral.js mix on an extreme synthetic
  Lab point, which then cascades NaN through roughly half a dyadic tree
  if reused — fixed by always re-deriving from the true Lab at every
  generation that touches an original anchor, not just generation 1; the
  4/12 headline was unaffected either way).
- A 315-combination grid over value-drop × hue-rotation on **both**
  primaries together: still capped at exactly 4/12 throughout.
- A theoretical chroma boost to 1.5× any real pencil's chroma (beyond
  what any real pigment could supply, purely diagnostic): still 4/12,
  and several pencils actually got *worse* with more chroma available.
- Reparametrising the real, unmodified primaries at a different blend
  ratio (same two anchors, "g" skewed from 50:50 toward more blue, Ray's
  own proposed test): 0/12 — confirmed this just resamples points already
  present on the same fixed curve, it can't add new colour information.
- Rotating the Blue anchor's hue all the way to literal teal (185°):
  doesn't help either. Traced the path directly — even with the anchor
  sitting exactly at teal, the spectral mixing path is backloaded: it
  only turns teal-hued in the last ~15–19% of its length, by which point
  chroma has already collapsed (75→38 across that stretch).

**The real shape of the problem**, visualised directly (hue vs
lightness, real arc path vs all 12 targets): the 12 split into two
genuinely different groups landing at nearly the same hue —

| | hue | needs L |
|---|---|---|
| Pthalo Green, Pthalo Green Light | 179–187° | 40.0–41.5 |
| Pthalo Turquoise ×2, Viridian, Beryl Green | 179–183° | 50.5–53.0 |
| Jungle Green, Grass Green | 150–154° | 42.6–45.4 |
| Castle Green, Summer Green, Emerald Green | 157–164° | 51.6–61.7 |

A single arc can only hold one lightness value per hue. These pairs sit
within 10° of each other in hue but 10–19 points apart in lightness —
no construction, real or hypothetical, can pass through both halves of
either split at once. Likely explanation: two genuinely different
pigment chemistries (phthalocyanine-based "Pthalo"-named pigments vs
chromium/cadmium-style greens) coincidentally sharing a hue — a real
chemistry fact, not a modelling gap.

**Conclusion**: closed, not open. Reclassify these 12 as a second
structural-explanation category alongside the chroma ceiling and the
neutral bands — a divergent path would be needed to reach them, and a
divergent (forking) path cannot exist within a Level 1 arc without
breaking the model's whole premise: each arc is a single deterministic
two-primary blend, which is what makes the generation ladder, the tint
ladder, and the Level 2/3 cross-arc construction all work the way they
do. A fork would mean two different results from the same starting
point depending on which branch is taken — not a mixing method a reader
could actually use. Brings the live genuinely-unexplained count from 18
to **6** (4 tint, 2 oversaturated — see Open Items below).

## Blind human-vs-model validation test (2026-10-20)

First direct check of whether the model's nearest-point placements agree
with a human eye, independent of the ΔE math. Design: three blank linear
Level 1 arcs rendered large (A3-landscape proportions) with only the two
endpoint labels shown, plus 60 colour swatches shown as plain squares
carrying only an ID number — no name, no range, no computed position
anywhere in the client-facing material (verified by inspecting the
injected JSON). Samples were a stratified, seeded-shuffle selection
(book-scope ranges, pure-L1-arc catches only) so the set couldn't be
cherry-picked. Ray placed each swatch by eye on the matching arc with no
knowledge of the model's own computed position, then positions were
compared back against the private sample file afterward.

**Result: strong agreement overall, with two consistent, explainable
disagreement clusters** — not noise, not a methodology problem:

1. **YgB, blue-leaning end (t≈0.75–0.90):** 6 pencils (Greenish Blue,
   Turquoise Blue, Non-Photo Blue, Phthalo Green, Empire Green, Cobalt
   Green) all placed by eye noticeably earlier (lower t, less blue) than
   the model's own nearest point — consistently by about 0.15.
2. **RoY, mid-arc (t≈0.23 vs 0.42):** 3 near-identical reds (Vermilion,
   Burnt Ochre, Light Cadmium Red — all `#f5xxxx`) placed together by eye
   at t≈0.42, while the model places all three together at t≈0.23 — same
   ~0.19 gap, same pattern of moving as a block.

**Ruled out as a general calibration problem.** Re-checked the opposite
(yellow) end of YgB specifically, including the Cool Blue anchor's own
placement: Cadmium Yellow Lemon (the anchor itself), three different
Spring Green samples, Yellow Green, Luminous Lemon, Leaf Green Light, and
Cerulean Blue (the Cool Blue anchor itself, placed at t=0.996 against a
model value of 0.973) were **all within ~0.05 of the model**, most within
0.02. So the disagreement isn't a left-right calibration drift and isn't
about the endpoint anchors — it's specific to a handful of pencils.

**The mechanism (Ray's observation, confirmed against the data): every
single disagreement is a loose ΔE match (7.8–13.9); every tight match
(ΔE below ~5) placed almost exactly where the model predicted, with zero
exceptions found.** ΔE76 blends hue, chroma and lightness into one
number, so the model can find a genuinely-lowest-distance point even when
the hue itself has drifted, as long as lightness/chroma compensate for
it. A human eye reads hue first — a pencil whose hue has drifted from the
arc's hue at its true nearest point visually "belongs" further along,
where the hue itself lines up, even though that isn't the lowest-ΔE
point. This is independent, human-eye corroboration of the earlier
concern about the ΔE≤15.3 threshold (see the conventional-interpretation-
band discussion elsewhere in the project): pencils in the ΔE 10+ range —
"not the same colour at all" on that scale — are exactly the ones a human
notices don't quite belong, even before being told the number.

**Methodology notes for anyone re-running this:** the first round-trip
through Canva (export → re-import) was lossy enough to make pixel-exact
position recovery unreliable, so the test pivoted to Ray reporting
positions directly as plain decimals (0–1, read left-to-right exactly as
printed on the canvas, left label = 0, right label = 1 — "side" words are
a spoken sanity-check only, never a distance instruction). A later full
screenshot was still useful for cross-validation via exact-hex pixel
matching, filtered to the three known gradient-bar y-ranges to avoid both
gradient-bleed-through false positives (the background bar itself
matching within tolerance over a huge area) and the reference sheet's
duplicate swatches sitting below the arcs.

**Not yet done:** roughly a third of the 60 samples remain unplaced/
unreported. Ray's plan for the next session: repeat the same blind test
against the Level 2 cross arcs in isolation, then Level 3, then the tint
ladders, then look for a pattern across all of them together — this first
pass was the proof of method.

## Never-fit taxonomy staleness bug, found and fixed (2026-10-20)

Ray spotted it directly: exporting a spreadsheet of the Level 1/2/3
"caught" pencils alongside a spreadsheet of the never-fit taxonomy, the
same pencil — Hooker's Green, Castle Arts Premium Soft Touch (`#244038`)
— appeared in **both**, caught at Level 3 (ΔE≈14.9, under the 15.3
threshold) and simultaneously filed as never-fit under "neutral
(Earth-Adjacent)". That shouldn't be possible if both were being computed
from the same current model.

**Root cause**: `data/never_fit_final_153.json` — the source list that
feeds `classify_never_fit_taxonomy.cjs` — was last regenerated at the
Cool Yellow anchor fix (commit `6743cd1`, 2026-10-15) and never rebuilt
since. Every anchor correction after that point (Warm Blue, Cool Blue,
the true-Lab anchor rebuild, Cool Red) only reran the *categorization*
script against this same frozen input, never refreshed which pencils
actually fit under the new anchors. No script in the repo had ever
regenerated this file from scratch — it was migrated whole from the
pre-repo cloud session (see this file's opening line) and there was
never a dedicated builder for it.

**Scope of the drift**: wrote `scripts/build_never_fit_list.cjs` to
regenerate it properly (same scope/threshold as `classify_coverage.cjs`:
all 11 ranges, ΔE≤15.3 against L1∪L2 first, L3 fallback). Fresh count:
**415 never-fit (was 434)** — 44 pencils that now genuinely fit moved out
(mostly rescued by the Warm Blue/Cool Blue/Cool Red corrections), 25 that
no longer fit moved in (expected — anchor swaps aren't purely additive,
moving one shifts the whole geometry). Net −19, landing exactly on
879/1294 combined — **this matches the coverage percentages already
published everywhere in this README**, because `classify_coverage.cjs`
has always computed its headline numbers directly from the live
level1/2/3 data, bypassing this stale file entirely. **The bug only
affected the per-pencil taxonomy breakdown and any spreadsheet built from
it — not the coverage stats.** Reran `classify_never_fit_taxonomy.cjs`
against the corrected list: taxonomy drops from 364 to 344 entries.
Hooker's Green no longer appears anywhere in it. Old versions of both
files backed up to `data/history/*_PRESTALENESSFIX_backup.json`.

**Going forward**: run `node scripts/build_never_fit_list.cjs` then
`node scripts/classify_never_fit_taxonomy.cjs`, in that order, after
*any* anchor change — not just when a taxonomy category itself needs
updating. The old pattern (relabel categories in place, leave the source
list alone) is exactly how this drifted for five anchor fixes running.

## ΔE-threshold positional-precision limitation (2026-10-21)

A real, validated model limitation, found by Ray reasoning through what
"matching a physical pencil against the arc" actually means: it isn't
about the end-to-end ΔE between the two anchors (Cool Yellow→Cool Blue
is ΔE 130.5) — it's about the *local* ΔE step size between neighbouring
generation points along the arc, and that step size is not constant.

**Checked directly against the real Yellow-Blue arc data.** The local
rate of colour change (ΔE per 0.1 of t) ranges from **6.6 at its
shallowest** (t=0.3–0.4) **to 50.1 at its steepest** (t=0.9–1.0, near
Cool Blue) — roughly an 8x difference across the arc. That means a fixed
ΔE≤15.3 (or any fixed threshold) "fits" tolerance corresponds to wildly
different amounts of real positional uncertainty depending on *where*
on the arc a match lands:

| Region | Local ΔE/0.1t | t-width of an ΔE=11 window |
|---|---|---|
| t=0.0–0.1 (near Cool Yellow) | 34.8 | 3.2% |
| t=0.1–0.2 | 12.0 | 9.1% |
| t=0.2–0.3 | 7.5 | 14.7% |
| t=0.3–0.4 | 6.6 | **16.7% (widest)** |
| t=0.4–0.5 | 8.6 | 12.7% |
| t=0.5–0.6 | 8.9 | 12.3% |
| t=0.6–0.7 | 10.2 | 10.8% |
| t=0.7–0.8 | 14.9 | 7.4% |
| t=0.8–0.9 | 21.0 | 5.3% |
| t=0.9–1.0 (near Cool Blue) | 50.1 | **2.2% (tightest)** |

Near either anchor the colour changes fast (steep gradient), so even a
loose ΔE tolerance only buys a few percent of positional ambiguity — a
confident placement. In the shallow middle stretch, the same tolerance
corresponds to **roughly 7x more positional uncertainty** — a pencil
"fitting" there could genuinely belong almost anywhere across a sixth
of the arc's whole length.

**Why this matters beyond being a new finding**: it supplies a real
mechanism for a pattern the project had already found twice,
independently, from a completely different angle — human perception.
In both the Level 1 and Level 2 blind validation rounds (see below),
every tight-ΔE match agreed cleanly with Ray's own placement by eye,
while loose-ΔE matches were the ones repeatedly rejected. This is likely
why: tight matches sit in steep-gradient territory where there's little
room to be positionally wrong, loose matches cluster in shallow-gradient
territory where "within threshold" can mean almost anywhere along a wide
stretch of the arc. Two independent lines of evidence (geometric
analysis of the model's own data, and blind human perception testing)
now point at the same underlying cause.

**Separately, also traced and confirmed** a small, real data-precision
gap specific to the two gamut-clipped anchors (Cool Blue, Warm Yellow):
the real measured Cool Blue pencil has a ~10.2 ΔE gap against its own
stored arc endpoint, because the endpoint is stored as a display hex
(lossy, clamped to sRGB) rather than the true measured Lab — which is
only used internally for generation 1's first mix
(`gen_level1_pure_rows.cjs`'s own comment documents this as a deliberate
design choice, not an oversight). This isn't a reason to change the
anchors — it's a measurement-layer precision gap in any script
(including several written this session) that re-derives Lab from a
stored arc-point hex instead of using the anchor's own `trueLab`
directly. Not yet fixed.

**Not yet decided**: how (or whether) to surface positional confidence
alongside a ΔE match in the model's output — e.g. flagging a match that
lands in a shallow-gradient stretch as lower-confidence even though it's
within threshold. Diagnosed, not yet designed.

## The ΔE ladder visualization (2026-10-22)

Grew directly out of the positional-precision finding above, through a
conversation working out what ΔE actually *is* geometrically. The
clearest image that emerged: each point on the arc has its own ΔE
sphere around it (radius = the fit threshold); the spheres overlapping
along the whole arc trace out a **tube**, and a pencil fits if it falls
anywhere inside that tube. A separate, harder question followed: two
pencils could both sit on the *surface* of the same sphere — one at the
"top" (lighter), one at the "bottom" (darker) — and a raw ΔE check
can't tell them apart, it's a direction-blind scalar. That's exactly
why dL/dC/dH exist as a separate, direction-aware layer in the taxonomy
classifier (tint = top of the sphere, shade = bottom).

**The practical problem this exposed**: every blind-test gradient bar
built so far has only ever shown the *exact* arc colour as a single
thin line. A pencil whose true position is, say, ΔE 6.5 away has never
had anywhere to visually sit — it was always going to look like it
"doesn't match," because the tolerance itself was never shown, only
implied by a number nobody could picture.

**The fix**: `scripts/build_de_ladder.cjs` builds a full ladder of every
integer lightness step from the exact arc colour out to ±15 (clamped to
however far the project's fit threshold reaches), using the arc's real
Lab value at each t and shifting purely in the lightness direction —
the same direction the anchor tint/shade thresholds from the day before
were calibrated against, so the two pieces of work line up rather than
being separate ideas. `scripts/diagrams/build_de_ladder_viz.cjs` renders
it: 31 rows (tint +15 down to shade −15, exact arc bolded in the
middle), each spanning the full t=0→1 width. Every pencil that
currently fits gets placed on the row matching its own real ΔL from its
nearest arc point (not just "fits/doesn't"), so a pencil at ΔE 6.5 has
an actual rung to land on instead of being judged against an impossible
single line.

**What it showed immediately, for Yellow-Blue**: most fitting pencils
cluster within about ±5 rows of the exact arc, a handful sit out at
±10–15, and — independently confirming yesterday's edge-clustering
finding a third way — there's a visible pile-up of swatches at the very
tip of each anchor end, spanning a wide range of rows (rows as far
apart as tint +12 and shade −11 at the Cool Blue end alone). Checked
directly: this isn't a visualisation artefact or something that would
be fixed by extending the anchors — dozens of genuinely different real
pencils (Primary Blue, Sky Blue, Non-Photo Blue, Blue Orchid...) land at
literally the same one or two discrete points (t=1.0000, t=0.9961)
despite a 23-point spread in lightness, because moving away from the
anchor in either t-direction doesn't bring the arc closer to any of
them — it moves toward a different hue entirely. They share a column
because they're similar in **hue**; the ladder is what makes it visible
that they genuinely differ in **lightness**.

A blank version of the ladder (`--clean` flag, no pencil swatches, with
a t-axis scale added along the bottom) was generated for Yellow-Blue and
sent to Ray, to place real pencils against by eye and report back as
e.g. "ΔE 11 tint, t=0.7" — a third round of blind validation, this time
testing against the full tolerance structure instead of a single
impossible line. Results below.

## The ΔE ladder, round 3: a directional bias, not just reduced precision (2026-10-25)

Ran the third blind-validation round against the blank ladder above. 25
real Yellow-Blue-fitting pencils were selected (deliberately stratified
across t and ΔL, weighted toward the shallow-gradient mid-arc stretch
and the anchor-tip pile-up zones — the two places the 2026-10-21
positional-precision finding predicted trouble), shuffled, and shown to
Ray as ID + swatch only (no name, no computed position). He placed each
one on the blank ladder as a (row, t) coordinate by eye.

Selection, shuffle, and scoring: `scripts/score_de_ladder_round3.cjs`
(reads `data/ygb_blind25_round3.json`, writes
`data/ygb_blind25_round3_scored.json`). Ray's own annotated placement
image is saved at `scripts/diagrams/ygb_ladder_round3_ray_placements.png`.

**t-axis (left-right position) was excellent across the board** —
median error around 0.02–0.03 of the arc's length, essentially
pencil-width accurate, including in the shallow-gradient middle where
the model predicted confidence should be lowest. 13 of 25 placements
landed within ±1 row AND ±0.05 t by a fairly tight standard.

**The misses weren't noise — they're located and directional.** Four of
the five big row misses (≥3 rows off) all sit in the mid-arc band
(t≈0.32–0.60, the shallow-gradient stretch), are all shade pencils, and
were all read as darker than they actually measure, by 3–5 rows:

| pencil | real row | Ray's call | real t |
|---|---|---|---|
| Evergreen | shade −5 | shade −10 | 0.59 |
| Grass Green (70%) | shade −8 | shade −13 | 0.60 |
| Castle Green Light | shade −7 | shade −10 | 0.34 |
| Grass Green (Derwent) | shade −11 | shade −14 | 0.32 |

This is the third independent line of evidence for the
ΔE-positional-precision effect (after the loose-ΔE rejection pattern in
both earlier blind-test rounds), and the first time it has shown a
clear *direction* rather than just reduced certainty: in the shallow
part of the arc, shade depth specifically reads as more extreme than it
measures — a consistent bias, not scatter in both directions.

**One outlier doesn't fit that pattern and is still open**: Luminous
Lemon (real tint+10, t≈0.01, right next to the Cool Yellow anchor) was
called only tint+4 — a large miss, but in the opposite direction
(under, not over) and the opposite location (near-anchor, not mid-arc)
from the main cluster. Possible "near-anchor lightness ceiling" effect
— an already-pale swatch may leave less visual room to judge further
lightening — but this is one data point, not a finding. Worth testing
with a few more near-anchor pale placements before concluding anything.

**Next step**: decide whether to run the same round-3 protocol (blank
ladder + stratified 25-pencil blind set) against RoY and BvR, to check
whether the same shallow-gradient shade-direction bias shows up on
those arcs too, or is specific to Yellow-Blue's particular geometry.

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
back it up, so these are chroma-only). **Ceiling raised 2.0→3.0** (Ray,
by-eye review of the xlsx tables): several Munsell C 2–3 pencils
genuinely read as grey, not pastel (Steel Grey, Ice Blue, Winter Lake,
Amethyst Grey, Payne's Grey 30%). Checked whether 2.5 would be a
cleaner line instead — it's worse: the rest of the 2.5–3.0 slice is real
pastel (Seashell Pink, Zircon Red Bright, Peach Beige...), and 2.5 would
wrongly exclude Payne's Grey (mc=2.83) while the handful of grey-reading
outliers above 3.0 (Ivory mc=3.33/3.51, Raisin mc=4.33) sit out of reach
of either line anyway — those need a hue-based check, not a tighter
chroma cutoff, left as a future refinement. Bands simplified to round
0–1/1–2/2–3 at the same time (previously 0–0.5/0.5–1.5/1.5–2.0):

| Band | Munsell C | Count |
|---|---|---|
| True Achromatic | 0–1 | 54 |
| Near-Neutral | 1–2 | 28 |
| Earth-Adjacent | 2–3 | 29 |
| **Total neutral** | ≤3.0 | **111 (30.2%)** |

Everything else is matched to its nearest Level 1/2 point and classified by
which Lab axis dominates the gap:

| Category | Count | % of total 368 |
|---|---|---|
| **tint** (pencil lighter than any nearby model point) | 176 | 47.8% |
| neutral (see bands above) | 111 | 30.2% |
| shade (pencil darker) | 39 | 10.6% |
| high-neon chroma (pencil more saturated than the model reaches) | 20 | 5.4% |
| **tone** (same value as the matched point, just lower chroma — see note below) | 7 | 1.9% |
| genuine hue gap (not a value/chroma issue at all) | 7 | 1.9% |
| low chroma (pencil genuinely muted/grey, but not neutral-band low) | 4 | 1.1% |
| hue gap — unreliable match (see note below) | 3 | 0.8% |
| undersaturated (vivid pencil, nearby anchor is more vivid still — see note below) | 1 | 0.3% |

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

**Classifier fix #4 (Ray, 2026-10-15), same day — "oversaturated" is now
empty, folded into shade.** Ray's follow-up: aren't the 4 "oversaturated"
entries actually shades, since they're all darker than their match
(dL<0)? Checked against the genuinely-vivid "high-neon chroma" entries
that are *also* dark by Munsell Value (Fra Angelico Blue, Perylene
Brown, Ultramarine, Mauve Deep, Violet Blue — Munsell Value 2.66–4.24,
same range) — darkness alone isn't the signal, since those stay
correctly "too saturated" (Lab C 52–75, genuinely vivid). But *within*
the already-narrow oversaturated group (Lab C 29–38, moderate), all 4
real members are also darker than their match — and that specific
combination (moderate-but-more-saturated-than-match, and darker) matches
the already-documented shade asymmetry exactly (some shades need more
saturation at the dark end, not less darkness). Reclassified: when a
pencil meets the oversaturated conditions AND is darker than its match,
call it shade instead. Net effect: **shade grows from 35 to 39**, the
"oversaturated" category currently has zero members (logic kept in the
script for any future pencil that fits the gate without also being
darker — just hasn't occurred yet in this dataset).

**New category added: "tone" (Ray, 2026-10-15), matching the book's own
Ch5 structure directly.** Ray caught that the taxonomy was missing the
classic third colour-theory case — tint = lighter, shade = darker,
**tone = same value, lower chroma**. 7 of the 14 "undersaturated" entries
have |dL|<5 (essentially the same lightness as their matched point) with
substantial negative dC (e.g. Dandelion dL=0.0 dC=−18.8, Pineapple
dL=3.5 dC=−20.4) — genuine tones of the Cadmium Yellow anchor family,
not tints. Split out into its own **"tone"** category; the remaining 7
"undersaturated" entries have larger |dL| and are correctly more
tint-like.

**Classifier fix #6 (Ray, 2026-10-15), same day — exact mirror of fix #4,
applied to the remaining 7 "undersaturated" entries.** Ray's question:
these are the opposite of "oversaturated," so are they also mislabeled?
Checked dL for each: 6 of 7 (Cream, Golden Yellow ×2, Lemon Yellow Light,
Naples Yellow, Deco Yellow) are *lighter* than their matched point
(dL>0), not just less saturated — and "lighter + less saturated" is
exactly the tint pattern already documented in this taxonomy (tints
trend less saturated as they lighten). Reclassified those 6 to tint.
Only **Mustard** (dL=−9.1, darker *and* less saturated) doesn't fit the
tint pattern or the shade pattern (shades that gain chroma as they
darken) — it's genuinely its own case, so "undersaturated" now has just
the one member. Net effect: **tint grows from 170 to 176**.

This makes the taxonomy's top-level shape line up exactly
with the chapter: **tint (176), tone (7), shade (39)**, plus neutral and
the smaller diagnostic categories.

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
versions of existing arc colours, not unrelated hues — of the 176,
**83.5% are within 20° hue of their nearest arc point** (71.6% within a
stricter 15°) — both improved further after the neutral-ceiling fix
pulled 21 ambiguous entries out of this pool. The shade side is even
cleaner: **92.3%** of shade misses
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

**Tints are close to an even split between Level 1 and Level 2 — and
they're geographically lopsided.** Of the 176 tint misses, 49% (87) are
nearest to a pure Level 1 arc point and 51% (89) are nearest to a Level 2
cross-mix point — near-even now that the neutral-ceiling and
undersaturated-to-tint fixes pulled out the ambiguous entries (was a
clearer 44/56 split originally). And
**zero tints land anywhere near RoY (orange) or
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
|dL|≈|dC|): **77.2% (284/368) are clean**, don't touch any boundary zone.
The other **22.8% (84/368)** sit on at least one — down from 1 in 4
before the neutral-ceiling fix, but still a real fraction worth working
through by eye, not a handful of arbitrary edge cases. Specific examples
flagged for Ray's by-eye pass: 13 different "White"-named pencils span
Munsell C 0.13–0.98 across both True Achromatic and Near-Neutral
(plausibly real formulation differences between ranges, not measurement
noise); Viridian and Pthalo Turquoise (same pigment family, different
ranges) land in different categories on tiny measurement differences.
Ray's by-eye pass through the xlsx tables has already found and fixed
three classifier bugs and this neutral-ceiling issue — this is an
actively self-correcting process, not a one-shot classification.

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
**Worked example below is STALE as of 2026-10-19** — built against the
pre-correction synthetic Warm Blue, the exact hex values (BvR arc point,
final mix) will have shifted since the anchor change. The *method* is
still valid, just needs re-running for current numbers before reuse.
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
