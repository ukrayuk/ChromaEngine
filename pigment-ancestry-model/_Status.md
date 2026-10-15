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

1. **Never-fit taxonomy — formalized, reveals a real architecture gap, now
   tied to the new Ch5 (Tints/Tones/Shades).** 368 book-scope pencils (post
   Cool Yellow correction). Neutrals pulled out first via **Munsell
   chroma**, ceiling raised 2.0→3.0 (Ray, by-eye: several mc 2-3 pencils
   genuinely read grey, not pastel): True Achromatic 0-1 (54), Near-Neutral
   1-2 (28), Earth-Adjacent 2-3 (29) — **111/368 (30.2%)**. Checked whether
   2.5 would be cleaner than 3.0 — it's worse (would exclude Payne's Grey,
   wouldn't catch the Ivory/Raisin outliers above 3.0 either way). Of
   what's left: tint 46.2% (170), shade 9.5% (35), high-neon 5.4% (20),
   undersaturated 3.8% (14), hue gap 1.9% (7), low chroma 1.1% (4),
   oversaturated 1.1% (4), hue gap (unreliable match) 0.8% (3). **Three
   classifier fixes from Ray's by-eye review of the xlsx tables, all the
   same root pattern**:
   don't trust dL/dC/dH against an extreme matched point. Fix #1: Dark Sap
   Green/Walnut Brown Light (+4 more) mislabeled "too saturated" when
   their matched point was actually near-grey (chroma 2.2–11.4) — now
   "hue gap (unreliable match)". Fix #2: Golden Yellow/Mustard/
   Butterscotch (+11 more, real pencil chroma 48.8–68.9, genuinely vivid)
   mislabeled "too muted/grey" because their matched point was *even more*
   vivid (chroma 68–82, the Cadmium Yellow anchor region) — now
   "undersaturated". Fix #3: Holly Green/Ice Blue/Pthalo Green Light/
   Peacock Green (Munsell C 6.5–9.44, only moderately saturated) mislabeled
   "too saturated" because their matched point was even LESS saturated —
   now "oversaturated". Also found: Lab chroma runs ~4–6× Munsell chroma
   for ordinary vivid pigments; Neon Yellow is the one genuine outlier at
   17.6×, likely because fluorescent pigments break standard Munsell
   conversion — its Lab chroma (92.7, exceeds the model's own max of 87.3)
   is the number to trust, not its Munsell reading. Hue-match testing
   confirms tints/shades
   are genuinely lighter/darker versions of real arc colours (82.9%/94.3%
   within 20°/15° hue for tints/shades respectively). Tints are now close
   to an even split between Level 1 and Level 2 (49%/51%, was 44%/56%
   before the neutral-ceiling fix) — zero land near RoY/orange, all
   cluster in green-violet territory. Asymmetry: tints desaturate as they
   lighten (a white-blend fix would work), shades often saturate further
   as they darken (wouldn't be rescued by a black-blend). **Open
   architecture question for Ray: add a tint-only "Level 4"?** Current
   thinking: keep as a separate Ch5 operation (arc colour + white/grey/
   black ladder), not an extension of Level 1/2/3 geometry — so Ch4 stays
   pure hue. ~25% of taxonomy calls are boundary/judgment cases (see
   README for the three specific zones) — still at "confirm the concept"
   stage pending Ray's call.
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

## Recent activity (newest first)

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
