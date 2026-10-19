# Status — Pigment Ancestry Model

Living dashboard for this work. Read this *before* `README.md` when
resuming on either machine — README has the deep methodology and decision
history, this file has where things stand *right now*. This repo is the
bridge between Ray's cloud session and his own machine's session: **pull
before starting work, push after any change that matters.** Any Claude
session working in `pigment-ancestry-model/` should update this file when
something changes — current state, a resolved item, a new finding — no
need to ask permission first.

**Last updated:** 2026-10-19 (this session, after the Warm Blue anchor
correction — 227/257, 88.3%, now explained)

## Current state — MILESTONE: Warm Blue moved to a real pencil, 227/257 non-neutral never-fit pencils now explained

- **Warm Blue anchor corrected (2026-10-19)**: synthetic (`#5f6bca`,
  Munsell-derived, never a real pencil) replaced with **Mauve Deep, Castle
  Arts Premium Soft Touch (`#5a42ab`, 9.59PB 3.57/13.86)**. Found by
  noticing the never-fit "shade" taxonomy clustered heavily (24/39) in the
  180-320deg hue band spanning both blue anchors, and that outside that
  band every single shade pencil (17/17) was already explained by the
  value-shifted search while inside it only 13/24 were -- the 11 still
  failing sat in a tight 288.8-311.8deg window centred on Warm Blue
  specifically, not Cool Blue (whose neighbourhood was already clear after
  the gamut-clip fix). Tested real PB-family candidates the same way as
  Cool Yellow: strong blues (Ultramarine, Lapis Blue, Fra Angelico Blue,
  Cobalt Blue Hue) rescued 10/11 of the cluster but cost book-scope
  coverage (-9 to -18); Mauve Deep is the one that both rescued 10/11 AND
  gained coverage (+3). Same numbers-vs-eye pattern as Cool Yellow: Ray's
  first look at a swatch comparison said "too purple" -- turned out to be
  a mix-up between two different "Mauve Deep" pencils in the dataset
  (Castle Arts Gold's, `#9f59b7`, genuinely Munsell **P** family; Castle
  Arts Premium Soft Touch's, `#5a42ab`, Munsell **PB** -- the actual
  candidate), confirmed fine once clarified which one was on the table.
  Full writeup and candidate table: README "Warm Blue correction".
  Coverage: book-scope 782->**785** (+3, 68.0%->68.3%), combined
  860->**862** (+2, 66.5%->66.6%). Full value-shifted sweep: **209/257
  (81.3%) -> 227/257 (88.3%)**, an 18-pencil gain, almost entirely on the
  shade side (14/41 -> 26/39 -- see updated breakdown below). Old data
  backed up to `data/history/*_PREWARMBLUE_backup.json`.

## Previous milestone (2026-10-18): gamut-clipped anchors corrected, 209/257 non-neutral never-fit pencils explained

- **Two of the four real-pencil Level 1 anchors were sRGB-gamut-clipped**
  (Warm Yellow, Cool Blue — confirmed via `master.json`'s own
  `srgb_gamut_status` field; Cool Blue is clipped even in P3). The stored
  hex was always the correct DISPLAY colour, but `spectral.Color(hex)`
  re-estimates a reflectance curve FROM that already-clipped hex for
  mixing, understating real pigment saturation in everything mixed from
  it. Raw spectral reflectance (the real fix) was lost to a drive failure,
  but Lab->XYZ->linear-RGB->gamma-encode is lossless, reversible linear
  algebra with no inherent 0-255 bound — `lib.cjs`'s new
  `colorFromTrueLab`/`mixSpectralTrueLab` skip the hex string and build
  the anchor's spectral.Color from its real measured `lab_d65_2` instead,
  used only for Level 1's first generation (where a raw anchor gets
  mixed). Warm Yellow recovers its true chroma exactly; Cool Blue (further
  outside gamut) recovers about a quarter of the gap — the rest is the
  reflectance estimator's own one-to-many ambiguity, not something more
  arithmetic can fix without the lost spectral data. Warm Red and Cool
  Yellow confirmed already in-gamut, untouched. All three levels
  regenerated (L2/L3 both inherit from L1). See README for the full
  writeup and the commit history for exact before/after chroma numbers.
- **All six anchors are now locked**, including Cool Yellow — see README
  "Cool Yellow correction" for the full writeup. This closes out weeks of
  anchor-correction work (BvR six-sector dead end → synthetic BvR, two
  Warm Yellow corrections, Lime Green rejected, now Cadmium Yellow Lemon
  locked for Cool Yellow).
- Coverage: **68.0% book-scope (782/1150), 66.5% combined (860/1294)**, at
  ΔE≤15.3. Verified reproducible via `scripts/classify_coverage.cjs`. The
  Cool Yellow fix was a genuine GAIN (+11 book / +14 combined), unlike
  every other candidate tested (all cost coverage) — first anchor change
  in this project that didn't trade accuracy for appearance. The
  gamut-clipped anchor fix (above) holds this coarse pure-arc number
  steady (localized shift, doesn't flip binary pass/fail for most
  pencils) but moves real ground at the value-shifted level — see below.
- **Full value-shifted search (tint+shade, all three levels) now explains
  209/257 (81.3%) of the non-neutral never-fit taxonomy**, up from a
  baseline of 0% before this session's work (the original taxonomy only
  ever compared against PURE L1/L2 points). Built by generating a 0.1-0.9
  step tint AND shade ladder from every point in L1+L2+L3 and taking the
  nearest match across the whole set. Two categories fully dissolved —
  **tone (7/7) and hue gap (6/6)** — meaning not one taxonomy "hue
  mismatch" survived once tested against the real value-shifted space;
  every one was a tint or shade the old pure-only search couldn't see.
  Also **low chroma (5/5)** and **undersaturated (1/1)**. The **"hue gap +
  tint (too light) (combo)" category is new this session** (32 pencils) —
  found by widening the existing hue-gap rule to not require a small `dL`,
  catching pencils that had a real hue gap AND a lightness gap
  simultaneously but got mislabeled pure "tint" because `dL` numerically
  dominated the old dL-vs-dC tiebreak; **100% of these (32/32) resolve**
  once tested against the full ladder, mostly on a Level 2 cross arc
  (overwhelmingly YgB×BvR) — a real, concentrated gap in that one arc's
  pastel region, not scattered noise. **48 pencils remain genuinely
  unexplained**, concentrated almost entirely in two places that are real
  model limits, not search gaps: **27 shade** (see "Shade-direction
  investigation" below) and **14 high-neon-chroma** (likely still beyond
  gamut even after the anchor fix), plus 6 tint stragglers and 1
  hue-gap-unreliable case already confirmed as genuine outliers. Full list
  with per-pencil fail reason sent to Ray as a CSV (`still_unresolved.csv`,
  matches his review-spreadsheet columns) — not yet committed to the repo
  as a tracked file, scratchpad-only right now.
- **Level 3 is 3 arcs, not 4** — "Arc1 — aligned" dropped (Ray's call): it
  always mixed a blend of warm and cool anchors, stayed permanently
  medium-muted, rescued zero book-scope pencils. Coverage unaffected.
- Never-fit taxonomy regenerated against the new anchors (368 book-scope
  pencils, down from 379) — shape held essentially unchanged across the
  anchor swap, a good sign the taxonomy reflects the model's structure,
  not one specific anchor set. See README "Open items" #1 for full numbers.
- **Book chapter order changed (2026-10-15):** Ch3 Hue, Ch4 Arcs, Ch5
  Tints/Tones/Shades, Ch6 Value, Ch7 Chroma. Tints/Tones/Shades is now its
  own chapter, separate from Arcs — relevant to Open items #1 below.
- **Chapter worked-example data is STALE** (`data/chapter_*.json`) — built
  against the pre-correction Cool Yellow anchor, not yet regenerated. Flag
  before reusing any t/generation/ΔE value from those files.
- **Correction (2026-10-18): there is only ever one active session** —
  this cloud session (`session_01X5dmXMWGXhLU1XoXY5WjKm`). The earlier
  note about a second session on Ray's own machine
  (`session_015oNn7JJnmfrU2nTdNo75yn`) was inaccurate/stale — Ray
  confirmed this cloud session is the only one he's used. No concurrent-
  edit risk from a second session; don't assume one exists.

## Shade-direction investigation (2026-10-17/18) — real problem identified; partly resolved 2026-10-19 (anchor, not the math itself)

**Update 2026-10-19**: the cluster of shade failures sitting right at the
blue anchors turned out to be an anchor-accuracy problem, not the
arc→black direction problem this section describes — see "Current state"
above and README "Warm Blue correction". Fixing Warm Blue rescued 12 of
the shade pencils in that cluster (14/41 → 26/39). The DIRECTION problem
documented below is still real and still unfixed for whatever's left —
the Warm Blue fix explains why so many failures happened to sit in that
one hue neighbourhood, it doesn't touch the underlying arc→black
construction issue for shades elsewhere on the wheel.

Extensive testing this session on why shade (arc → black) rescues so much
worse than tint (arc → white): L1-only 28.2% (11/39), L1+L2 33.3%
(13/39), full L1+L2+L3 still only 33.3% (14/41 against the post-anchor-fix
taxonomy) — adding more levels barely moves it, unlike tint where it
closed almost the whole gap. This is NOT a resolution/coverage problem.

**Reverse-direction test (Ray's idea) confirmed the real pigments ARE on
the right arcs.** Taking each failing shade pencil's own real colour and
lightening IT toward white (instead of darkening the arc toward black)
rescues **39/39 (100%)** — every one lands cleanly back on its pure arc,
most within ΔE 1-5. So the hue/chroma identity is correct; only the
*direction* of the shade construction is wrong.

**Root cause, confirmed with real pigment data (Ray supplied Color Index
codes from artistpigments.org for several failing pencils):**
Bleu de Nîmes = PB15:3 (Phthalo Blue) + PV23 (Dioxazine Violet), both
extremely high-tinting-strength pigments that get dark by STACKING chroma,
not by adding a neutral. Carmine Lake = PR179 + PBk7 (genuinely contains
black) and Dark English Green = PG7 + PBk9 (ditto) — yet even these still
needed real lightening to match, because the ACTUAL black pigments used
(PBk7 carbon black, PBk9 bone/ivory black) aren't neutral the way
`#000000` is. Checked directly: PBk9-type bone black (`#1C1814`,
real-world reference) sits at Lab C≈9.3 from pure black, with a
persistent warm/brown undertone even when tinted up — and swapping the
model's shade-mix target from `#000000` to this more "realistic" black
made results *worse* overall (8/39), not better, because it fights the
many blue-family shade pencils. Holbein's own "Black" pencil
(`#262628`, in the Neutral taxonomy, not Shade) is the closest real
measurement to true neutral available (Munsell `8.47PB 1.5/0.28` —
chroma so low the hue reading is essentially noise) but using it as the
shade target also didn't help (same 11/39 either way, since it never
reaches true L=0). **Conclusion: no substitute "black" fixes this,
because different pencils are built from different dark/strong pigments
(PBk7, PBk9, PG7-alone, PB15:3+PV23 seen so far) — there's no single right
answer to "what black." The structural problem is the arc→black
construction itself, not which colour sits at its dark end.** The working
alternative (lighten the real pencil, check it lands on the arc) isn't
yet built into anything reusable — it's a validation test, not a shade
model. Open question for whenever this gets picked back up: can a shade
ladder be built FROM this reverse relationship instead of the forward
one.

## Level 2 diagram — re-laid out, pencil-placement data gathered (2026-10-17)

Reworked from the original side-by-side "like"/"flipped" layout (hard to
compare the two cross-pairing orientations) to a stacked radial layout:
Level 1 innermost (200-400), "like" middle (440-620), "flipped" outermost
(640-820) and wider-banded — not because either pairing is more
"correct" (they're equally valid, different mixes), but because real
pencils land on "flipped" roughly 2x as often as "like" in every one of
the 3 zones (64%/36% split, book-scope: 340 vs 194 of 534 Level 2 fits;
RoY×YgB alone is closer to 3:1). Gap geometry also fixed: a straight
radial-line gap tapers in exact proportion to `rOuter/rInner` no matter
which radius its angle is calibrated at (confirmed with the actual math,
not just visually) — the real fix is solving the gap angle separately at
each ring's inner and outer radius and connecting those two points with a
straight line instead of one through centre, giving a true constant-width
cut. Current artifact: https://claude.ai/artifact/MSm8TBvNeC1scWWaoFzNmN
(regenerated against the corrected anchor data, not yet committed as a
repo script — still scratchpad-only, same status as the tint/shade ring
prototype below).

## Open items (priority order)

1. **Never-fit taxonomy — now lines up exactly with the book's own Ch5
   structure (Tints/Tones/Shades).** 368 book-scope pencils (post Cool
   Yellow correction). Neutrals pulled out first via **Munsell chroma**,
   ceiling raised 2.0→3.0 (Ray, by-eye: several mc 2-3 pencils genuinely
   read grey, not pastel — checked 2.5 instead, it's worse): True
   Achromatic 0-1 (54), Near-Neutral 1-2 (28), Earth-Adjacent 2-3 (29) —
   **111/368 (30.2%)**.
   **Categories as of 2026-10-19** (after the Warm Blue anchor correction
   — see "Current state" above; the 2026-10-18 and 2026-10-15 numbers
   below this paragraph are now stale, kept for history): tint 146
   (39.7%), shade 39 (10.6%), hue gap + tint (combo) 28 (7.6%), high-neon
   chroma 15 (4.1%), tone 13 (3.5%), hue gap 8 (2.2%), hue gap (unreliable
   match) 4 (1.1%), low chroma 2 (0.5%), undersaturated 1 (0.3%),
   oversaturated 1 (0.3%, a category that had sat empty since 2026-10-15,
   now has its first member again from the anchor shift).
   **2026-10-18 numbers (stale):** tint 141 (38.3%), shade 41 (11.1%), hue
   gap + tint (combo) 32 (8.7%), high-neon chroma 18 (4.9%), tone 10
   (2.7%), hue gap 6 (1.6%), low chroma 5 (1.4%), hue gap (unreliable
   match) 3 (0.8%), undersaturated 1 (0.3%).
   **2026-10-15 numbers (stale, pre-anchor-fix, pre-combo-category):** tint
   47.8% (176), shade 10.6% (39), high-neon 5.4% (20), tone 1.9% (7), hue
   gap 1.9% (7), low chroma 1.1% (4), hue gap (unreliable match) 0.8% (3),
   undersaturated 0.3% (1, down to just Mustard).
   **Six classifier fixes total, all from Ray's by-eye review of the
   xlsx tables**: #1 Dark Sap Green etc. mislabeled "too saturated" when
   their matched point was near-grey → "hue gap (unreliable match)". #2
   Golden Yellow/Mustard etc. (genuinely vivid, chroma 49-69) mislabeled
   "too muted" because their match was *even more* vivid → "undersaturated".
   #3 Holly Green etc. (Munsell C 6.5-9.44, only moderate) mislabeled "too
   saturated" because their match was even less saturated → "oversaturated".
   #4 those same 4 are ALSO darker than their match → reclassified again,
   this time to "shade" (oversaturated now empty, logic kept for future
   cases). #5 "tone" was missing entirely (Ray's own catch) — same value
   as the match, just lower chroma, the classic third colour-theory case.
   7 of the 14 "undersaturated" entries have |dL|<5 (Dandelion dL=0.0,
   Pineapple dL=3.5) — genuine tones, not tints. Split into their own
   category. #6 (exact mirror of #4, on the remaining 7 "undersaturated"):
   6 of 7 (Cream, Golden Yellow ×2, Lemon Yellow Light, Naples Yellow,
   Deco Yellow) are LIGHTER than their match (dL>0), matching the
   documented tint pattern (less saturated as they lighten) — reclassified
   to tint. Only Mustard (darker AND less saturated) doesn't fit either
   pattern, stays the sole "undersaturated" entry. Also found: Lab chroma
   runs ~4-6x Munsell chroma for ordinary vivid pigments; Neon Yellow is
   the one outlier at 17.6x (fluorescent pigments break standard Munsell
   conversion) — trust its Lab chroma (92.7, exceeds the model's own max
   of 87.3), not its Munsell reading. Checked the remaining 7 "hue gap"
   entries (Primrose Yellow, Pink, Terre Verde Deep, Rose Pink, Violet
   Pink, Burnt Sienna 10%, Clay Rose) for a similar bug — no clean split
   found this time (Ray's call: these stay as genuine oddities, real hue
   mismatches, not a classifier error). Hue-match testing confirms
   tints/shades are genuinely lighter/darker versions of real arc colours
   (83.5%/92.3% within 20°/15° hue). Tints split close to evenly between
   Level 1 and Level 2 (49%/51%) — zero land near RoY/orange, all cluster
   in green-violet territory. Asymmetry: tints desaturate as they lighten
   (a white-blend fix would work), shades often saturate further as they
   darken (wouldn't be rescued by a black-blend). **Resolved 2026-10-16:
   yes, Level 4 tint ladder built and committed** — see "Level 4 tint
   ladder" section below, now includes Level 3 too. 77.2% of taxonomy
   calls are clean, 22.8% are boundary/judgment cases. This is an actively
   self-correcting process via the xlsx review, not a one-shot
   classification — many real fixes found over the life of this item,
   most recently the hue-gap+tint combo category (2026-10-17/18, see
   above).
2. **Chapter 5 — olive/dechroma demo.** Pure-dechroma-from-Level-1 framing
   fails geometrically (README "Open items" #3). Resolution method found
   and proven on a different example (`#00bb00 → #497249` via Level 2
   cross-mix, README "Open items" #2) — Ray's note: *"keep this as a
   method to come back to shortly."* Not yet reapplied to redo the actual
   olive demo.
3. **Chapter 5 — chroma/value concept demo.** Feasibility probed in
   principle only (hue-only layering works from a mid-chroma base, fails
   from a high-chroma one). Not yet built as an actual figure.
4. **Chapter worked-example data needs regenerating** against the new Cool
   Yellow anchor (`data/chapter_*.json` — the 12-colour "how to use the
   navigator" demo). Not urgent but will produce wrong numbers if reused
   as-is.
5. Not started: the "two discrete endpoint colours per quad" alternative
   Chapter 5 approach (Ray's own todo, tracked separately); BvR arc demos
   for the navigator chapter (explicitly deferred); P3-vs-sRGB gamut
   investigation (flagged, not actioned).
6. **Level 2 standalone diagram (`build_level2_standalone.cjs`) can't
   currently be regenerated** — depends on `level2_standalone_rows.json`,
   never migrated into this repo. Two ways to unblock: find/migrate the
   original `gen_level2_standalone_rows.cjs` generator if it still exists,
   or adapt the current canonical `level2_cross_rows.json` into the
   `["G2", step, steps, t, hex]` row-array shape this script expects (more
   work, different data format than the rest of the current pipeline).
7. **Tint/shade ring prototype real-pencil validation — largely done
   numerically, not yet done visually.** The ladder-math side is fully
   validated (see "Level 4 tint ladder" below and the shade-direction
   section above). What's still open: actually plotting real rescued
   pencils ON the ring diagram itself (https://claude.ai/artifact/Qz8hLXeMAHTGT8UUiuQuTv,
   now v2 — half-width bands, 9 steps each side 0.1-0.9, regenerated
   2026-10-19 against the new Warm Blue anchor, still scratchpad-only) so
   Ray can see it visually rather than just as numbers. Also resolved this
   session: coarse-step testing confirmed the original 2-step (0.3/0.6)
   prototype genuinely drops real pencils through value gaps (65.3% vs
   96.6% at full 19-step resolution) — diminishing returns kick in hard
   past ~4 extra steps per side (90.3%, vs 65.3% at 2 steps), which is why
   the ring was rebuilt at 9 steps instead of settling for one more.
8. **Shade-direction math — still a real, unfixed problem, but the Warm
   Blue anchor fix (2026-10-19, see "Current state" above) took a big
   bite out of it.** 13 of 39 shade pencils remain genuinely unexplained
   (down from 27), after the blue-anchor cluster got resolved as an
   anchor-accuracy problem rather than a direction problem. See
   "Shade-direction investigation" above for the full writeup — the
   underlying arc→black construction issue is unchanged and still applies
   to whatever's left: not a coverage/resolution gap (adding Level 2/3
   barely helps) and not simply "wrong black colour" (tried bone black,
   tried Holbein's own near-neutral black, both made things worse or
   didn't help). The reverse test (lighten the real pencil, confirm it
   lands on the arc) works at 100% but isn't a shade MODEL, just a
   validator. Whoever picks this up next should start from "can a shade
   ladder be built from the reverse relationship instead," and should
   re-pull the still-failing list first since it's shifted since this was
   last written.
9. **11 high-neon-chroma pencils still unexplained** (down from 14, then
   17 before the gamut-clip fix — 15 total in the category now, down from
   18, since Mauve Deep itself moved out when it became the new Warm Blue
   anchor on 2026-10-19 — an anchor trivially fits itself). Only 4 of the
   original 20 in this category are actually named neon/luminous (Neon
   Yellow, Luminous Rose, Luminous Opera, Luminous Green — all now
   resolved or confirmed fluorescent); the rest (Fra Angelico Blue,
   Hollywood Pink, two Ultramarines, Marigold, Summer Green, Brilliant
   Yellow [resolved], Purple, Purple Light, French Rose, Cobalt Purple
   [resolved], the Castle Arts Gold "Mauve Deep" — true Munsell P family,
   genuinely purple, not the one that became the anchor, Violet Blue)
   read as genuinely strong conventional pigments, not special-effect
   ones — Fra Angelico Blue specifically confirmed as one of
   Faber-Castell's professional "new 20" Polychromos colours with their
   TOP lightfastness rating (fluorescent pigments fade fast, so a top
   lightfastness score argues against it being one). These are a real
   gamut ceiling, not a classification error — not clear there's more to
   do here without either more real spectral data or accepting the limit.
10. **`RENDERING.md` is stale** (flagged 2026-10-16, never actioned) —
    still describes the Family 1 generation-ladder diagrams as having had
    their stroke/gap removed, when that whole experiment was reverted the
    same day. Low priority but should be corrected before anyone trusts
    it at face value.
11. **Level 2's new stacked-radial layout (see section above) is
    scratchpad-only** — not yet migrated into a committed
    `scripts/diagrams/` script the way the three-ring quick-ref composite
    was. Do that once Ray's pencil-testing pass on the current artifact
    is done and the layout is confirmed stable (he said he wants to test
    it against real swatches before anything else changes).

## Level 4 tint ladder — now committed (2026-10-16), extended to Level 3 (2026-10-18)

The tint ladder (toward white, `mixSpectral`, no new anchors -- see
"Mixing Method") is formalized: `scripts/ladder/gen_tint_ladder.cjs`
builds `data/ladder/tint_ladder_full.json` at 19 fixed steps.
`scripts/ladder/validate_tint_ladder.cjs` re-tests it against the real
never-fit taxonomy pencils (their actual measured `lab_d65_2`, not a hex
approximation) and writes `data/ladder/tint_ladder_validation.json`.
Originally **170/176 (96.6%)** on Level 1+Level 2 sources alone (Level 3
deliberately excluded -- reasoning at the time: its colours are already a
borrowed-depth mix of Level 1, so tinting it would just retrace ground
Level 1/2 already cover).

**Reversed 2026-10-18 (Ray):** that reasoning didn't survive contact with
real data. Testing the new "hue gap + tint (combo)" taxonomy entries
against a full L1+L2+L3 value-shifted pool captured all 30/30 of them --
and 8 specifically needed Level 3 tints; L1/L2 tints alone weren't close
enough. L3's geometry overlaps L1/L2 in *colour* but tinting it still
opens genuinely different ground, since the three-way mix sits at a
different point in the space than any L1/L2 tint reaches. `gen_tint_ladder.cjs`
now includes Level 3 (3084 sources x 19 steps = 58,596 points).
Re-validated against the combined tint+combo universe (178 pencils, the
original 176 tint plus the 2 reclassified-from-elsewhere combo entries
that are genuinely tint-direction): **172/178 (96.6%)** -- same headline
rate as before but over a larger, more honest set, with 13 of those 172
rescues now depending on Level 3. The 6 that still fail even at full
19-step L1+L2+L3 resolution are confirmed genuine outliers (Cobalt
Turquoise Green, Lavender Light, Jade Green, Mint Green Light, Mint
Green, Neon Pink) -- their coarse-ladder distance and full-ladder
distance are identical, meaning no amount of resolution would ever catch
them; they're just not close to the tint ladder anywhere.

Tone and shade ladders are NOT yet formalized this way -- tone's
construction (hold L/H, scale C, via a `labToHex` round-trip) is still
scratchpad-only. Shade is NOT a resolution problem (see "Shade-direction
investigation" above) -- formalizing a ladder the same way tint was would
not fix it; the construction itself needs rethinking first.

## Diagram line-removal experiment (2026-10-16) — tried and reverted

Tried removing the per-cell stroke + inter-generation-ring gap from the
generation-ladder diagrams (standalone Level 1/3, the combo, and patched
but unverified on Level 2 standalone) to fix a moire/dense-grid-of-lines
problem Ray flagged on screen. Ray's call after seeing it live: revert all
of it — "that diagram did not need the white lines removed... one thing at
a time." All four scripts are back to the original stroke+gap convention.
If this comes up again: the technique itself worked (confirmed via polar
pixel-sampling, SEAM_EPS_DEG=0.08 fully closed the seam), it just wasn't
wanted here — don't re-litigate the "does it work" question, only "is it
wanted" if asked again.

## Recent activity (newest first)

- **2026-10-19**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session):
  **Warm Blue anchor correction** — synthetic `#5f6bca` replaced with
  Mauve Deep, Castle Arts Premium Soft Touch (`#5a42ab`). Found by
  noticing the never-fit shade taxonomy clustered heavily around both
  blue anchors and, once Cool Blue's neighbourhood was checked, that the
  remaining cluster sat in a tight 23deg window centred on Warm Blue
  specifically. Tested real PB-family candidates the same way as Cool
  Yellow; most strong blues rescued the cluster but cost coverage
  elsewhere, Mauve Deep was the one net gain on both counts. Repeated the
  Cool Yellow "numbers vs eye" pattern almost exactly — Ray's first
  reaction to a swatch was "too purple," which turned out to be a mix-up
  between two different pencils both named "Mauve Deep" in the dataset;
  confirmed fine once clarified which one. Book-scope 782->785 (+3),
  combined 860->862 (+2), full value-shifted sweep 209/257 (81.3%) ->
  227/257 (88.3%) -- an 18-pencil gain, almost entirely on the shade
  side. Regenerated all three levels, the taxonomy, and every diagram
  (scratchpad artifacts and the five repo-committed scripts); sent Ray
  PNGs of all of them. README and this file both updated with the full
  writeup.
- **2026-10-18**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session):
  **gamut-clipped anchor fix** — found via `master.json`'s own
  `srgb_gamut_status` field that Warm Yellow and Cool Blue are clipped;
  built `colorFromTrueLab`/`mixSpectralTrueLab` in `lib.cjs` to construct
  spectral.Color from the real unclamped Lab instead of the clipped hex,
  applied to Level 1's first generation only, regenerated all three
  levels, regenerated the taxonomy. Confirmed real visual impact (not
  just internal math) with a concrete before/after midpoint (Lab chroma
  78.3→93.0). Captured 7 previously-unreachable pencils (5 blue-family
  shades, 2 high-chroma via the pure arc directly). Also this session:
  extended the Level 4 tint ladder to include Level 3 (see above), added
  the "hue gap + tint (combo)" taxonomy category (32 pencils, 100%
  resolve against the full ladder), ran a full value-shifted tint+shade
  sweep across all three levels landing at 209/257 (81.3%) of the
  non-neutral never-fit taxonomy explained, and did extensive
  shade-direction investigation (see section above) including real
  pigment Color Index lookups (PB15:3, PV23, PBk7, PBk9) supplied by Ray.
  Regenerated every diagram (both the scratchpad artifacts and the five
  repo-committed `scripts/diagrams/*.cjs` outputs) against the corrected
  data and sent Ray PNGs of all of them. Sent Ray a CSV of the 48
  remaining genuinely-unexplained pencils matching his review-spreadsheet
  columns plus a fail-reason column.
- **2026-10-17**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session):
  reworked the Level 2 diagram from side-by-side like/flipped to a
  stacked radial layout (see "Level 2 diagram" section above), fixed the
  radial-line gap-taper bug (constant-width cuts instead of wedge-shaped
  ones), computed the real pencil split between "like" and "flipped"
  (64%/36%), and did the coarse-tint-step investigation that led to
  rebuilding the tint/shade ring prototype at 9 steps per side instead of
  2. Confirmed via Ray's own review spreadsheet
  (`never_fit_review_v3`, Google Sheets) that Holbein's "Black" is a
  near-true-neutral outlier (Munsell `8.47PB 1.5/0.28`) sitting in the
  Neutral tab, not Shade -- this fed directly into the shade-direction
  investigation's "what counts as black" dead-end.

- **2026-10-16**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session): fixed
  the Level 3 diagram scripts (standalone + the 3-ring quick-ref composite,
  the latter now actually committed -- it only ever lived in scratchpad
  before) for the current 3-arc data; both still had the dropped "Arc1 --
  aligned" baked in. Also restored `polar_lib.cjs`, a dependency both
  scripts needed but that was never committed, so neither could run from a
  fresh clone. Fixed a moire/flicker artifact in the full-resolution rings
  (sub-pixel seam between 257 abutting per-cell wedges) with a tiny angular
  overlap. Found and fixed a real unit-scale bug in the quick-ref composite:
  its canvas grew from 1800 to 3000 viewBox units at some point but the CSS
  render size stayed at 1800px, so the old mm-based gap constants were
  silently off by 0.6x. Redesigned Level 2's gap convention per Ray's visual
  review: 60px between pairs (unrelated families meeting, at 0/120/240deg,
  matched to Level 1's gap at the same angular position) vs. 10px within a
  pair (a join, not a separation) -- previously both were close enough in
  size to read as arbitrary. Also built and validated (not yet committed)
  a "Level 4" tint/tone ladder concept -- see below, this is new ground,
  separate from the diagram fixes above.
- **2026-10-15**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session):
  **locked in Cool Yellow correction** — Cadmium Yellow Lemon (Faber-Castell
  Polychromos, `#e7ed46`) replaces Lemon Cadmium (`#f6e83b`). Found by
  searching real pencils across the hue window Ray identified by eye
  (H=99–111°, boundary into "lime" confirmed around 108°), landed on
  `#e7ed46` (H=105.7°) — confirmed by Ray's own live-arc testing AND a net
  coverage gain (+11 book / +14 combined), unlike all 4 earlier candidates.
  Full regeneration, old data backed up, README/Status rewritten. Also
  dropped Level 3's "Arc1 — aligned" (rescued zero pencils, structurally
  explained: always mixes warm+cool, never settles toward either side).
  Regenerated the never-fit taxonomy against the new anchors — shape held
  essentially unchanged, confirming it reflects the model's structure.
- **2026-10-15**: formalized and refined the never-fit taxonomy (Munsell-
  chroma neutral bands, dropped Derwent Drawing/Castle Arts Harmonious as
  a one-off stress test, confirmed tint/shade pools are genuinely lighter/
  darker arc-colour versions by hue-match testing, found tints cluster in
  green-violet territory and are mostly nearer Level 2 than Level 1). Full
  detail in README's never-fit taxonomy section and git history.
- **2026-10-15**, `session_015oNn7JJnmfrU2nTdNo75yn` (Ray's machine):
  added the original never-fit taxonomy note to README (commit `6faeeee`).
- **2026-10-15**: migrated the full engineering handoff into this repo for
  the first time (README, canonical + historical anchor data, generator/
  classification scripts, chapter worked-example data, investigation
  scripts) — repo had none of this before this date.
