# Status — Pigment Ancestry Model

Living dashboard for this work. Read this *before* `README.md` when
resuming on either machine — README has the deep methodology and decision
history, this file has where things stand *right now*. This repo is the
bridge between Ray's cloud session and his own machine's session: **pull
before starting work, push after any change that matters.** Any Claude
session working in `pigment-ancestry-model/` should update this file when
something changes — current state, a resolved item, a new finding — no
need to ask permission first.

**Last updated:** 2026-10-15 (this session, after locking in the Cool
Yellow anchor correction)

## Current state — MILESTONE: all six anchors now locked

- **All six anchors are now locked**, including Cool Yellow (the last open
  one) — see README "Cool Yellow correction" for the full writeup. This
  closes out weeks of anchor-correction work (BvR six-sector dead end →
  synthetic BvR, two Warm Yellow corrections, Lime Green rejected, now
  Cadmium Yellow Lemon locked for Cool Yellow).
- Coverage: **68.0% book-scope (782/1150), 66.5% combined (860/1294)**, at
  ΔE≤15.3. Verified reproducible via `scripts/classify_coverage.cjs`. The
  Cool Yellow fix was a genuine GAIN (+11 book / +14 combined), unlike
  every other candidate tested (all cost coverage) — first anchor change
  in this project that didn't trade accuracy for appearance.
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
- Two Claude sessions are active on this repo: one in the cloud (tag:
  `session_01X5dmXMWGXhLU1XoXY5WjKm`), one on Ray's own machine (tag:
  `session_015oNn7JJnmfrU2nTdNo75yn`). Expect concurrent edits — pull
  first, merge README conflicts rather than overwrite.

## Open items (priority order)

1. **Never-fit taxonomy — now lines up exactly with the book's own Ch5
   structure (Tints/Tones/Shades).** 368 book-scope pencils (post Cool
   Yellow correction). Neutrals pulled out first via **Munsell chroma**,
   ceiling raised 2.0→3.0 (Ray, by-eye: several mc 2-3 pencils genuinely
   read grey, not pastel — checked 2.5 instead, it's worse): True
   Achromatic 0-1 (54), Near-Neutral 1-2 (28), Earth-Adjacent 2-3 (29) —
   **111/368 (30.2%)**. Of what's left: **tint 47.8% (176)**, shade 10.6%
   (39), high-neon 5.4% (20), **tone 1.9% (7)**, hue gap 1.9% (7), low
   chroma 1.1% (4), hue gap (unreliable match) 0.8% (3), undersaturated
   0.3% (1, down to just Mustard).
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
   darken (wouldn't be rescued by a black-blend). **Open architecture
   question for Ray: add a tint-only "Level 4"?** Current thinking: keep
   as a separate Ch5 operation (arc colour + white/grey/black ladder), not
   an extension of Level 1/2/3 geometry — so Ch4 stays pure hue. 77.2% of
   taxonomy calls are clean, 22.8% are boundary/judgment cases — still at
   "confirm the concept" stage pending Ray's call. This is an actively
   self-correcting process via the xlsx review, not a one-shot
   classification — six real fixes found so far, expect more as Ray works
   through the remaining tabs.
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
7. **Tint/shade ring prototype real-pencil validation** (added to the
   testing list 2026-10-16): take the real rescued tint/shade pencils from
   the never-fit taxonomy and plot where they actually land on the
   tint/shade ring prototype (https://claude.ai/artifact/Qz8hLXeMAHTGT8UUiuQuTv,
   scratchpad-only, not yet committed) — does a real tint pencil's nearest
   match fall in the ring at roughly the t-step distance its own ΔE would
   predict, same check for shade. Validates the prototype's radial layout
   against real data, not just the ladder math in isolation. Not started.

## Level 4 tint ladder — now committed (2026-10-16)

The tint ladder (toward white, `mixSpectral`, no new anchors -- see
"Mixing Method") is formalized: `scripts/ladder/gen_tint_ladder.cjs`
builds `data/ladder/tint_ladder_full.json` from every current Level 1 +
Level 2 point (2313 sources) at 19 fixed steps (43,947 points total).
`scripts/ladder/validate_tint_ladder.cjs` re-tests it against the real
never-fit "tint" pencils (their actual measured `lab_d65_2`, not a hex
approximation) and writes `data/ladder/tint_ladder_validation.json`.
Reproduces the originally-found result exactly: **170/176 (96.6%)** of
the taxonomy's tint pencils now fit at ΔE≤15.3 against the ladder, where
none did before. Level 3 deliberately excluded from the source set --
its colours are already a borrowed-depth mix of Level 1 (see the
"generation ring" finding above), so tinting it would retrace ground
Level 1/2 already cover, not open new territory.

Tone and shade ladders are NOT yet formalized this way -- tone's
construction (hold L/H, scale C, via a `labToHex` round-trip) and shade's
(toward black, unvalidated against real pencils -- see item 7) are both
still scratchpad-only. Same treatment as this one, once validated.

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
