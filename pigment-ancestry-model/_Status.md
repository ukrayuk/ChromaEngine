# Status — Pigment Ancestry Model

Living dashboard for this work. Read this *before* `README.md` when
resuming on either machine — README has the deep methodology and decision
history, this file has where things stand *right now*. This repo is the
bridge between Ray's cloud session and his own machine's session: **pull
before starting work, push after any change that matters.** Any Claude
session working in `pigment-ancestry-model/` should update this file when
something changes — current state, a resolved item, a new finding — no
need to ask permission first.

**Last updated:** 2026-10-15 (this session, after refining the never-fit
taxonomy's neutral bands)

## Current state
- Anchors locked except **Cool Yellow**, which is actively under revision
  (see Open items #1).
- Coverage: 67.0% book-scope (771/1150), 65.4% combined (846/1294), at
  ΔE≤15.3. Verified reproducible via `scripts/classify_coverage.cjs`.
- **Book chapter order changed (2026-10-15):** Ch3 Hue, Ch4 Arcs, Ch5
  Tints/Tones/Shades, Ch6 Value, Ch7 Chroma. Tints/Tones/Shades is now its
  own chapter, separate from Arcs — relevant to Open items #2 below.
- Two Claude sessions are active on this repo right now: one in the cloud
  (tag: `session_01X5dmXMWGXhLU1XoXY5WjKm`), one on Ray's own machine
  (tag: `session_015oNn7JJnmfrU2nTdNo75yn`, already made its first commit).
  Expect concurrent edits — pull first, and if README.md conflicts, merge
  rather than overwrite; both sessions' additions are worth keeping.

## Open items (priority order)

1. **Cool Yellow anchor — unresolved, needs Ray's eyes, not more numbers.**
   Current `#f6e83b` is too warm. Ray's target direction: push toward
   `#e7fa01` (a directional marker, not a precise hex to match). Four
   candidates tested and scored (`data/coolyellow_candidates/`), but the
   top-scoring one (Lime Green, Derwent Coloursoft) was **rejected by Ray
   on sight** against a live arc rendering — repeats the exact lesson from
   the BvR six-sector episode (README §"Decision history" #2): a coverage
   number can look fine while the colour is visibly wrong. **Next step is
   Ray testing candidate hexes against the live arc by eye**, not another
   coverage comparison table.
2. **Never-fit taxonomy — formalized and refined, reveals a real
   architecture gap, now tied to the new Ch5 (Tints/Tones/Shades).**
   Neutrals are pulled out FIRST via **Munsell chroma** (not Lab chroma —
   Lab C alone is unreliable, e.g. "Rose Grey" is Lab C=39 despite the
   name): True Achromatic (Munsell C 0–0.5, 24 pencils), Near-Neutral
   (0.5–1.5, 70), Earth-Adjacent (1.5–2.0, 15) — 109/448 total (24.3%). An
   initial cool/warm split of the neutral bands by hue family was tested
   and dropped — the real data didn't back it up, so these are chroma-only
   now. Of what's left: **tint still dominates at 53.6%** (240/448, pencil
   lighter than any nearby model point), shade 7.6%, high-neon 6.0%, low
   chroma 5.1%, genuine hue gap 3.3%. Ray independently hue-tested the tint
   pool by eye; confirmed most are real lighter-versions of arc colours —
   64.4% within 20° hue of their nearest arc point. Shades are cleaner
   still: 80.6% within 15° hue — genuinely darker versions of existing arc
   colours. **Asymmetry**: tints get less saturated as they lighten (a
   "blend toward white" fix would work), but many shades get MORE
   saturated as they darken (Cobalt Blue Deep, Ultramarine, Violet) — a
   "blend toward black" wouldn't rescue those, the dark anchors themselves
   would need more chroma. **Open architecture question for Ray: add a
   tint-only "Level 4"?** Current thinking, given the chapter reorder: keep
   it as a genuinely separate operation for the new Ch5 (arc colour +
   white/grey/black ladder), not an extension of the Level 1/2/3 arc
   geometry itself — so Ch4 (Arcs) stays purely about hue. See README
   §"Open items" #2 for the full writeup — flagged, not built, still at
   "confirm the concept" stage pending Ray's call on scope.
3. **Chapter 5 — olive/dechroma demo.** Pure-dechroma-from-Level-1 framing
   fails geometrically (README §"Open items" #4). Resolution method found
   and proven on a different example (`#00bb00 → #497249` via Level 2
   cross-mix, README §"Open items" #3) — Ray's note: *"keep this as a
   method to come back to shortly."* Not yet reapplied to redo the actual
   olive demo.
4. **Chapter 5 — chroma/value concept demo.** Feasibility probed in
   principle only (hue-only layering works from a mid-chroma base, fails
   from a high-chroma one). Not yet built as an actual figure.
5. Not started: the "two discrete endpoint colours per quad" alternative
   Chapter 5 approach (Ray's own todo, tracked separately); BvR arc demos
   for the navigator chapter (explicitly deferred); P3-vs-sRGB gamut
   investigation (flagged, not actioned).

## Recent activity (newest first)

- **2026-10-15**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session): book
  chapter reorder noted (Ch5 is now Tints/Tones/Shades, separate from
  Arcs). Refined the never-fit neutral classification to use Munsell
  chroma with three bands (True Achromatic / Near-Neutral / Earth-Adjacent,
  dropped a cool/warm hue split that didn't hold up against real data),
  re-ran the full taxonomy with neutrals pulled out first. Confirmed by
  hue-match testing that both the tint and shade pools are genuinely
  lighter/darker versions of real arc colours, not unrelated hues — and
  found tints and shades likely need different fixes (white-blend works
  for tints, but shades often need more saturated dark anchors, not a
  black-blend).
- **2026-10-15**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session): turned
  Ray's manual never-fit spreadsheet work into a real classifier —
  448 never-fit pencils matched to their nearest model point and
  categorized by which axis dominates the gap. Corrected the "four even
  categories" framing to the real result (74.6% tint-dominated) and
  surfaced the structural cause (no white-blend dimension in L1/2/3).
  Open question for Ray: worth adding a tint/shade Level 4?
- **2026-10-15**, `session_015oNn7JJnmfrU2nTdNo75yn` (Ray's machine):
  added the never-fit taxonomy note to README (commit `6faeeee`).
- **2026-10-15**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session):
  pushed the full engineering handoff — README, canonical + historical
  anchor data, generator/classification scripts (verified to reproduce
  canonical data byte-for-byte and the official coverage numbers), chapter
  worked-example data, Cool Yellow candidate test sets, recent
  investigation scripts (commit `e7aa47c`). First commit of this
  migration — repo didn't have any of this before today.
