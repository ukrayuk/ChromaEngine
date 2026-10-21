---
status: Active
stage: all six anchors now have first-pass tint/shade/normal thresholds (by eye, against ChromaEngine's ramp tool) -- next step is wiring these into the classifier
last_touched: 21 October 2026
next_action: wire data/anchor_thresholds.json into the never-fit taxonomy classifier (currently tint/shade/tone are decided by dL/dC/dH against the nearest arc point, not by a per-anchor lightness threshold -- these are a different, more direct mechanism and need reconciling with the existing logic, not just bolted on); re-check the Cool Blue/Cool Red "shade"/"dark" sub-clusters (3 and 5 entries respectively) for a second instance of the proven structural-limit split now that real shade boundaries exist to test them against; re-derive the "genuinely unexplained" headline count against the corrected never-fit taxonomy; continue the blind validation test with Level 3 and tints
feeds_into: ["Colour Theory for the Coloured Pencil Artist", "ChromaEngine"]
---

# Status — Pigment Ancestry Model

Living dashboard for this work. Read this *before* `README.md` when
resuming on either machine — README has the deep methodology and decision
history, this file has where things stand *right now*. This repo is the
bridge between Ray's cloud session and his own machine's session: **pull
before starting work, push after any change that matters.** Any Claude
session working in `pigment-ancestry-model/` should update this file when
something changes — current state, a resolved item, a new finding — no
need to ask permission first.

**Last updated:** 2026-10-21 (this session, after a threshold-sensitivity
check confirmed the outlier population isn't noise -- 82% of what drops
off a tighter ΔE cutoff on the Yellow-Blue arc is the same cyan/teal/
phthalo pigment family flagged the day before, from an entirely
different angle)

## Current state — MILESTONE: all six anchors now have first-pass tint/shade/normal thresholds; threshold-sensitivity check confirms the Yellow-Blue outlier population is one coherent pigment-chemistry cluster, not noise

- **Scope note (2026-10-21, Ray caught it)**: all of today's and
  yesterday's outlier/threshold work (`outlier_tracker.json`,
  `anchor_thresholds.json`) has been scoped to the 1294-pencil book+
  stress-test set, not the full 1825-pencil `master.json` (17 ranges).
  That's the right scope for published coverage numbers, but Ray's
  point stands for calibration work specifically: restricting to 9
  ranges before setting thresholds risks the thresholds being shaped by
  which ranges got picked, not the real population. **Not yet done**:
  rebuild outlier tracker + threshold sort against the full 1825 first,
  then check how the book's 9 ranges perform against that -- flagged as
  the right next step, not yet executed.

- **Threshold-sensitivity / edge-clustering check (2026-10-21)**: tested
  what tightening YgB's fit threshold from 15.3 to 11 actually does.
  Confirmed the edge-clustering is real and gets MORE pronounced under a
  tighter threshold, not less (81.5% of all pure-YgB catches already
  sit within t<=0.2 or t>=0.8 of either anchor at the current 15.3
  threshold; at 11 that rises to the same pattern holding, since the
  thin middle -22 of 119 catches, t 0.2-0.8- empties out faster than the
  edges do). Middle-of-arc and edge-of-arc matches have near-identical
  ΔE distributions (mean ~10 both) -- the middle isn't full of worse
  matches, there are just far fewer real pencils that land there at
  all. Pulled and grouped the 55 pencils that would drop off YgB at
  threshold=11 (`data/threshold_dropout_ygb.json`,
  `scripts/build_threshold_dropout.cjs`): **82% (45/55) are the same
  cyan/teal/turquoise/Phthalo/cerulean/green pigment-chemistry cluster**
  flagged in the previous day's dedicated Phthalo-arc investigation --
  independent confirmation, via a completely different method (threshold
  sensitivity rather than a dedicated test arc), that this is one real,
  coherent population, not scattered noise.

- **Per-anchor tint/shade thresholds set for all six primary anchors
  (2026-10-21)**: using ChromaEngine's own Tints & Shades ramp tool
  (HSL lightness %, 10-point steps from each anchor's own hue), Ray
  called by eye where each anchor stops reading as itself in each
  direction. Cross-checked every ramp against the real anchor hex first
  (all matched the tool's own 48% step almost exactly) and checked
  every HSL-L baseline computation against Ray's own slider readings
  before logging (caught one real mismatch: "WR" at 47% matched Cool
  Red's hex, not Warm Red's -- confirmed). Result, written to
  `data/anchor_thresholds.json`:

  | Anchor | Baseline L | Tint | Shade |
  |---|---|---|---|
  | Warm Red | ~51% | 70% | 40% |
  | Warm Yellow | ~50% | 65% | 40% |
  | Cool Yellow | 60% | 65% | 40%* |
  | Cool Blue | 42% | 55-60% | 35% |
  | Warm Blue | 46% | 60% | 35% |
  | Cool Red | 47% | 60% | 35% |

  *Cool Yellow's shade boundary is a genuine hue-exit, not just
  darkening -- below ~40% it reads as olive/green, confirmed directly
  against the ramp's own hex values (`#D8DF16` at 48% is still clearly
  yellow, `#ABB111` at 38% is unmistakably olive).

  Clear per-arc pattern: **RoY** (Warm Red/Warm Yellow) has the widest,
  best-centred margins, matching it being by far the cleanest arc in
  the outlier tracker (7 never-fit total). **YgB** is asymmetric --
  Cool Yellow has real room on both sides, Cool Blue is pressed right
  against its own shade edge (baseline 42%, cutoff 35%, only 7 points
  of headroom). **BvR** runs narrower than the other two arcs across
  the board -- both Warm Blue and Cool Red carry a 35% shade margin,
  not the 40% every RoY/YgB anchor gets.

  **Not yet done**: these thresholds aren't wired into the taxonomy
  classifier. The existing `classify_never_fit_taxonomy.cjs` decides
  tint/shade/tone from dL/dC/dH against the nearest arc point -- a
  relative, per-pencil comparison. These new thresholds are a direct,
  per-anchor lightness boundary -- a different mechanism that needs
  reconciling with the existing logic (next session), not just bolted
  on alongside it.

- **Level 2 blind human-vs-model validation test (2026-10-20/21)**: same
  method as the Level 1 round -- 48 ID-only swatches (8 per cross-arc
  variant, all 6 of RoY×YgB/YgB×BvR/BvR×RoY like+flipped), Ray placing
  blind with no knowledge of the model's computed position. Result:
  same core pattern as Level 1, replicated independently -- tight ΔE
  matches (<5) agreed 8/8 after one correction (a canvas-tool opacity
  bug was briefly mistaken for a real "too light" rejection, caught and
  fixed mid-test); loose matches (ΔE>=5) were rejected roughly 25 of 35.
  New finding not seen on Level 1: a "like"/"flipped" arc-variant
  confusion (IDs 07, 26) -- position can be correct while the specific
  cross-arc variant is still misread, when both variants sit in similar
  muted territory. Sorting all judged entries by ΔE showed a real
  crossover, not a fuzzy gradient: 0-5 is 100% agreement, 5-7 is a
  genuine 50/50 toss-up, 7-11 leans reject with real exceptions, above
  ~11.2 is 10 of 11 rejected. This independently corroborates Ray's
  recollection of ~11 as an earlier candidate ΔE threshold (vs the
  current 15.3) -- checked the coverage cost directly: dropping to 11
  would lose 198 book-scope pencils (802->604, -17.2 points), judged too
  large a jump to do as a blanket change right now. Full test data in
  scratchpad (not yet committed to README -- see Open Items).

- **Primary-arc outlier investigation, first pass (2026-10-21)**: Ray's
  question "which arc is hardest" led to building
  `scripts/build_outlier_tracker.cjs` -- catalogues every still-open
  never-fit pencil (excluding already-explained categories: neutrals,
  chroma ceiling, structural limit) whose GOVERNING nearest match is a
  pure Level 1 arc, tagged to whichever of the arc's two anchors it
  sits nearer to. Result, by anchor: Warm Red 0, Warm Yellow 6, Cool
  Yellow 4, **Cool Blue 43**, Warm Blue 3, **Cool Red 36**. Checked this
  wasn't just a population-density artifact: Cool Blue's territory IS
  denser (652 of 1294 total pencils nearest there), but its FIT RATE
  (12.9%) is still 3-4x worse than every other anchor (37-50%) -- a
  genuine rate problem, not just more pencils nearby. Cool Red fit rate
  is 12.8%, same story. Written to `data/outlier_tracker.json`.

  Three anchor-swap attempts tested against the Cool Blue outlier pool,
  all negative, all informative: Middle Phthalo Blue (`#0085d4`, close
  pigment neighbour) made 30/43 worse, rescued 1; a "true blue" leaning
  candidate (`#184aa8`, Ray's own pick, deliberately less cyan-leaning)
  made 41/43 worse and cost 48 book-scope pencils overall; a near-
  neighbour candidate (`#007fd4`) was coverage-neutral (-1) but still
  left 39/43 worse, rescuing only the same recurring 3-pencil "shade"
  sub-cluster every time (Castle Green Deep, Grass Green, Peridot
  Yellow). Conclusion: the dominant problem (~38/43, "tint -- too
  light") is NOT a pigment-choice or hue-direction problem -- every
  candidate tested was at a similar lightness to the current anchor,
  and none touched it. Fixing it would require a genuinely lighter
  anchor, which conflicts with the anchor's job as a vivid reference
  pigment (it currently also correctly catches 84 genuinely vivid
  blues). This is the same "can't be two things from one point" shape
  as the proven shade-greens structural limit, just on the tint side.

  Cool Red's pool has the same two-population shape: 32 of 36 are
  "tint," the other 5 (Pomegranate "shade," Dahlia Purple/Midnight
  Mauve "low chroma," Light Red-Violet/Aubergine "tone") form a small,
  distinct darker/muted cluster, mirroring Cool Blue's 3-entry shade
  trio. Checked whether a simple Munsell-Value band (<=3 shade, 4-7
  normal, >7 tint, Ray's proposal) would explain the split cleanly --
  it doesn't: Cool Blue's split partially fits (0/17/26 across the
  bands) but Cool Red's doesn't at all (1/35/0 -- almost the entire
  pool sits in the "normal" 4-7 band by absolute value despite being
  92% "tint"), because the tint/shade call is driven by lightness
  *relative to the nearest arc point*, not an absolute Munsell Value
  threshold. Confirms each arc needs its own calibration, not one
  shared rule.

  **Methodology defined for the next attempt (Ray's call, explicitly
  correcting course mid-session after noticing all three swap attempts
  used the same generic test regardless of what we already knew)**:
  (1) collect outliers first, analyse once complete, don't fix ad hoc
  as found -- one pencil's fix can quietly break another; (2) for each
  pure arc, split off the value extremes (tint and shade) BEFORE
  assessing anything else, since each needs a different fix; (3) a tint
  or shade cluster right at t~0/t~1 means the anchor itself is at the
  edge of what's reachable (a different problem from outliers spread
  through the arc's middle); (4) Cool Blue's problem is *absolute*
  lightness gap, Cool Red's is lightness *relative to its own nearest
  match* -- these need different scoring functions in the next search,
  not the same script re-run with a different hex; (5) a hue family
  (e.g. yellow) may have no real "shade" version at all -- it goes
  brown/olive first -- so forcing a tint/shade split onto every hue is
  itself a category error. Confirmed against data: Cool Yellow's open
  pool has zero "shade" entries, all "tone."

- **Never-fit taxonomy staleness bug found and fixed (2026-10-20, Ray
  caught it)**: exported spreadsheets of the Level 1/2/3 "caught"
  pencils and of the never-fit taxonomy, and Ray noticed Hooker's Green
  (Castle Arts Premium Soft Touch) in both -- caught at Level 3 and
  simultaneously filed as never-fit "neutral (Earth-Adjacent)". Root
  cause: `data/never_fit_final_153.json` (the source list the taxonomy
  categorizer runs against) hadn't been regenerated since the Cool
  Yellow anchor fix (2026-10-15) -- every anchor correction since (Warm
  Blue, Cool Blue, the true-Lab anchor rebuild, Cool Red) only reran the
  categorization script against this same frozen list, never refreshed
  which pencils actually fit under the new anchors. No script in the
  repo had ever built this file from scratch -- it was migrated whole
  from the pre-repo cloud session. Wrote
  `scripts/build_never_fit_list.cjs` to do that properly (same
  scope/threshold as `classify_coverage.cjs`). Fresh count: 415 never-fit
  (was 434) -- 44 pencils that now genuinely fit moved out, 25 that no
  longer fit moved in, net -19, landing exactly on the 879/1294 combined
  coverage already published everywhere -- confirming the headline
  coverage stats were never wrong (`classify_coverage.cjs` always reads
  live model data directly), only the per-pencil taxonomy breakdown and
  anything built from it. Reran `classify_never_fit_taxonomy.cjs` against
  the corrected list: taxonomy drops from 364 to 344 entries, Hooker's
  Green no longer appears in it at all. Old files backed up to
  `data/history/*_PRESTALENESSFIX_backup.json`. Full writeup: README
  "Never-fit taxonomy staleness bug, found and fixed". **Not yet done**:
  the "6 genuinely unexplained" headline figure was computed against the
  OLD taxonomy and needs re-deriving against the corrected 344-entry one
  -- category membership shifted (e.g. low chroma 4->6, chroma ceiling
  7->6, shade-too-dark-non-structural 28->19), so the old number can't
  just be restated. Going forward: run `build_never_fit_list.cjs` then
  `classify_never_fit_taxonomy.cjs`, in that order, after any anchor
  change.

- **Blind human-vs-model validation test, Level 1 (2026-10-20)**: built
  three blank linear Level 1 arcs (A3-landscape) plus 60 ID-only colour
  swatches (stratified, seeded, book-scope, no identifying info visible)
  and had Ray place each by eye with no knowledge of the model's own
  computed position. Result: strong agreement overall, with two
  consistent disagreement clusters, both loose-ΔE pencils moving together
  as a block -- (1) 6 pencils at the YgB blue-leaning end (t~0.75-0.90),
  model reading ~0.15 further toward blue than Ray's eye; (2) 3
  near-identical reds in RoY (Vermilion/Burnt Ochre/Light Cadmium Red,
  all `#f5xxxx`), model at t~0.23, Ray's eye at t~0.42. Ruled out a
  general calibration problem by re-checking the opposite (yellow) end of
  YgB and both arcs' own anchor placements -- all within ~0.05 of the
  model, several near-exact. Mechanism (Ray's read, confirmed against the
  data with zero exceptions): every disagreement is a loose ΔE match
  (7.8-13.9); every tight match (ΔE below ~5) placed almost exactly where
  the model predicted. ΔE76 blends hue+chroma+lightness into one number
  so the model can find the true lowest-distance point even with hue
  drift, compensating via lightness/chroma -- a human eye reads hue
  first, so a drifted-hue pencil visually "belongs" further along where
  the hue itself lines up. Independent human-eye corroboration of the
  earlier ΔE<=15.3 threshold concern: ΔE 10+ pencils ("not the same
  colour at all" on the conventional interpretation scale) are exactly
  the ones a human notices don't quite belong. Roughly a third of the 60
  samples still unplaced/unreported. Full writeup: README "Blind
  human-vs-model validation test". Next session: repeat against Level 2
  cross arcs in isolation, then Level 3, then tints, then map the pattern
  across all of them.

- **YgB shade-greens proven a structural limit (2026-10-20)**: the 12
  remaining shade failures (Jungle/Beryl/Grass/Summer/Viridian, Pthalo
  Turquoise x2, Castle Premium Soft Touch's Teal/Pthalo Green/Pthalo
  Green Light/Pthalo Turquoise/Emerald/Castle Green) cannot be reached by
  any Yellow-Blue construction -- proven, not assumed. Plotting hue
  against lightness for the real arc vs all 12 targets showed why: they
  split into two groups landing at nearly the same hue (one needing
  L~40-42, the other L~50-62, under 10deg apart) -- a single arc can only
  hold one lightness per hue, so no construction, real or hypothetical,
  reaches both. Confirmed exhaustively: a 315-combination grid over
  value-drop x hue-rotation on both primaries capped at 4/12 throughout;
  a theoretical 1.5x chroma boost past any real pencil still capped at
  4/12 (several pencils got WORSE); reparametrising the real unmodified
  primaries at a different blend ratio gave 0/12 (just resamples a fixed
  curve); rotating Blue's hue all the way to literal teal didn't help
  either (the mixing path is backloaded, chroma collapses before hue
  arrives). L2/L3 tested directly against all 12: consistently 1.2-2.5x
  worse than L1, ruling out a third-family escape route too. Likely
  explanation: two genuinely different pigment chemistries (e.g.
  phthalocyanine-based "Pthalo" names vs chromium/cadmium-style greens)
  coincidentally sharing a hue. Full writeup: README "YgB shade-greens —
  a proven structural limit, not an open search". This closes the
  genuinely-unexplained count from 18 to **6** (the 12 shade-greens move
  to explained-and-excluded, same treatment as neutrals, fluorescents and
  the chroma ceiling) -- see Open Items #8 above.

- **Cool Red anchor corrected (2026-10-20)**: synthetic (`#c62d6a`,
  Munsell-derived, 8.25RP 4.5/14, never a real pencil) replaced with
  **Middle Purple Pink, Faber-Castell Polychromos (`#c13074`, 6.39RP
  4.46/13.88)** -- the last fully synthetic anchor, closed out. Ray's
  call: "cannot have 5 pencil based and one not". Ray's own first
  candidate (Bengal Rose Deep, Castle Arts Gold, `#cb166a`) tested at -15
  book-scope -- same "too saturated, pulls the arc off balance" pattern
  as every other anchor fix this project. Scanned the wider RP/R
  neighbourhood; only two candidates tied the synthetic exactly at +0
  cost (Middle Purple Pink, Fuchsia). Picked Middle Purple Pink -- near
  hue/value/chroma twin of the outgoing synthetic, confirmed by Ray
  looking at the swatch directly ("looking at the colour itself middle
  purple pink is the better option"). Full writeup: README "Cool Red
  correction". Coverage: book-scope holds exactly at 802/1150 (69.7%,
  +0), combined 881->879 (-2, from ranges outside the candidate search).
  The 18 genuinely-unexplained pencils are completely unchanged -- Cool
  Red sits nowhere near the green/teal shade cluster. Old data backed up
  to `data/history/*_PRECOOLREDFIX_backup.json`.

- **Chroma ceiling taxonomy category added (2026-10-20)**: the 7
  remaining "high-neon chroma" pencils (Fra Angelico Blue, Hollywood
  Pink, Ultramarine, Marigold, Purple, Purple Light, French Rose) pulled
  out as structurally explained rather than unresolved -- mirror of the
  neutral bands at the other end of the chroma axis. No mix of the six
  anchors can exceed the chroma of its own ingredients, and all 7 sit
  above every anchor's own Munsell chroma near their hue (anchors run
  10.85-16.65, these 7 run 15.71-17.84). Threshold Munsell C >=15.65 set
  from the real data's own clean gap (last rescued: Brilliant Yellow,
  15.60; first never-rescued: Marigold, 15.71), same method as the
  neutral bands. Confirmed nothing available can raise the ceiling
  without cost -- every anchor candidate tested this session that gained
  saturation also cost book-scope coverage (-9 to -28 each time). Full
  writeup: README "Chroma ceiling category". Live genuinely-unexplained
  count: 25 -> **18**.

- **Extensive shade-direction investigation (2026-10-19/20, same session
  as the Cool Blue fix)**: tried and ruled out, in order: near-neutral
  dark-green targets (Hooker's Green, Dark Sap Green -- small real effect,
  0/12 rescued); a genuinely saturated same-family target applied
  UNIFORMLY across all arcs (Beryl Green -- found 2/12 "rescued" but this
  turned out to be a misapplication artifact, see below); per-arc "own
  dark" targets properly scoped (Perylene Brown/Beryl Green/Bleu de
  Nimes for RoY/YgB/BvR respectively, plus correctly-blended cross-arc
  targets) -- 0/12 once scoped correctly, confirming the earlier 2/12 was
  a false positive from applying a green target to a cross-arc point it
  didn't belong to; a self-generated darkened G1 at several fractions --
  0/12, no better than black. **Then a real result**: building Yellow-Blue
  as its own 2-point arc with BOTH primaries independently dropped in
  value (chroma/hue held fixed) -- asynchronous drops (Yellow dropping
  further than Blue, e.g. Yellow -15, Blue -10) genuinely rescue **4/12**
  (Jungle Green, Grass Green, Pthalo Green, Pthalo Green Light), all
  confirmed as PURE arc points (not tint/shade derivatives, not
  cross-arc -- this test never built one) at t=0.67-0.91. Pooling across
  a full grid of drop combinations doesn't add any more than this single
  best pair -- confirms the other 8 aren't reachable by sliding value on
  this axis at all, at any amount. Checked exactly where on the real
  (unmodified) YgB arc the remaining 12's nearest matches fall: **100% of
  them sit in the G1-to-Cool-Blue half of the arc (t>0.5), none in the
  Yellow-to-G1 half** -- the problem is geometrically confined to that
  one segment. Isolated WHY: held Cool Blue completely fixed and varied
  ONLY Cool Yellow -- dropping Yellow's VALUE alone (chroma/hue
  untouched) rescues 2/12 on its own; dropping Yellow's CHROMA alone
  rescues 0/12 and combining a chroma cut with a value drop actively
  undoes the value drop's own benefit. So Yellow's extreme brightness
  (L~90.7) is the real constraint on G1's reachable chroma-at-depth, not
  its own saturation, which needs to stay exactly where it is. Caught and
  fixed a real bug along the way: `colorFromTrueLab(...).toString()`
  produces an invalid string when called standalone on an extreme
  synthetic Lab point (not through a proper spectral.js mix/gradient
  call) -- the broken string then cascades NaN through roughly half of a
  dyadic tree if reused in later generations. Fix: always re-derive from
  the true Lab via `mixSpectralTrueLab` whenever a generation touches the
  original anchor, any generation, not just generation 1 -- confirmed the
  4/12 headline result unaffected either way (the corrupted points were
  excluded from "nearest" automatically, never produced a false match).
  **Net conclusion**: value alone (on this Yellow-Blue axis) cannot reach
  the remaining 8 at any combination -- the only lever left is a
  different Yellow and/or Blue (hue/chroma, not value), which is a bigger
  change than tonight's testing and needs its own session. None of this
  investigation changed any committed anchor or data file -- all
  scratchpad-only hypothesis testing.

## Previous state (2026-10-20, earlier the same day): all six primary anchors now real pencils, 18 non-neutral pencils genuinely unexplained

## Previous state (2026-10-19, earlier the same day): five of six primary anchors now real pencils (corrected, was mis-stated as six here; Cool Red was still synthetic until 2026-10-20), 228/253 non-neutral never-fit pencils now explained

- **Cool Blue anchor corrected (2026-10-19, same day as Warm Blue)**:
  Cerulean Blue, Castle Arts Gold (`#0082b5`, 6.77B 4.78/10.78,
  gamut-clipped, only ever gamut-corrected not re-picked) replaced with
  **Cerulean Blue, Castle Arts Premium Soft Touch (`#0088d6`, 1.33PB
  5.17/13.15, also gamut-clipped, trueLab-corrected)**. Prompted by Ray
  noticing the dE between the two blue anchors had grown a lot once Warm
  Blue became real (37.1->53.3 hex, 48.6->64.4 true Lab). Tested real
  B/PB candidates the same two-axis way: four gained +17/+18 book-scope
  coverage, well clear of everything else, none rescuing the
  shade-greens cluster (confirms that's the arc->black problem, not Cool
  Blue placement). Checked the gain wasn't a numbers-only illusion (Ray's
  challenge: "if we move it more PB, no pencils will be captured
  anyway?") by diffing the exact fit sets: **23 gained, 6 lost, net
  +17** -- 21 of the 23 gained are real blues at hue 243-310deg (Light
  Ultramarine, Lapis Blue, Cobalt Blue 10%/Deep/Hue, Cerulean Blue x3
  variants, etc.) that sat in the gap between the two blue anchors with
  nowhere to land; the 6 lost are real greens (hue 159-199deg) that drift
  just outside threshold as the YgB arc's green midpoint shifts. Picked
  Premium Soft Touch's own "Cerulean Blue" over the numerically-tied
  Holbein "Cerulean Blue [hue]" -- Ray's call after swatch comparison
  ("very similar though, give it a go"), same pigment name as the
  outgoing anchor. Full writeup and candidate table: README "Cool Blue
  correction". Coverage: book-scope 785->**802** (+17, 68.3%->69.7%),
  combined 862->**881** (+19, 66.6%->68.1%). Also tightens the blue
  family split: dE to Warm Blue 64.4->51.0, hue separation 67.1deg->
  47.3deg. Old data backed up to `data/history/*_PRECOOLBLUEFIX_backup.json`.

- **Fluorescent pencils excluded from the taxonomy (2026-10-19)**:
  Luminous Rose, Luminous Opera (Holbein), Neon Yellow, Neon Pink (Newell
  Prismacolor) dropped entirely from `never_fit_taxonomy.json` -- Ray's
  call, confirmed fluorescent/emissive (literal "Neon"/"Luminous"
  branding), out of scope for a reflective-pigment mixing model rather
  than unsolved. Taxonomy denominator drops from 368 to 364 (257->253
  non-neutral).

- Full value-shifted sweep after both changes: **228/253 (90.1%)**, 25
  genuinely unexplained (12 shade-greens, 7 high-neon-chroma, 4 tint, 2
  oversaturated) -- see "Open items" #9 below for the full list.

## Previous milestone (2026-10-19): Warm Blue moved to a real pencil, 227/257 non-neutral never-fit pencils now explained

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

## Shade-direction investigation (2026-10-17/18) — real problem identified; partly resolved 2026-10-19 (anchor, not the math itself); CLOSED 2026-10-20 (proven structural, not unsolved)

**Update 2026-10-20**: the 12 shade-greens left after the Warm Blue fix
(the ones this section's "DIRECTION problem... still unfixed" refers to)
are now proven to be a structural limit of the YgB arc, not an open
arc→black direction problem to keep chasing. See Open Items #8 above and
README "YgB shade-greens — a proven structural limit, not an open
search" for the full evidence trail. Short version: two real pigment
families land at nearly the same hue needing very different lightness,
which no single arc can straddle. This closes out the item the note
below left open ("can a shade ladder be built from the reverse
relationship instead") — the answer turned out to be no, not for this
cluster, because the problem isn't the construction direction, it's that
a single path can't do two lightness values at one hue regardless of
which direction it's built in.

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

0. **(Top priority, added 2026-10-21) Fix Cool Blue and Cool Red properly,
   using the per-arc methodology defined in "Current state" above, not
   another generic hex-swap test.** `data/outlier_tracker.json` has the
   full catalogued pool for both (43 and 36 entries). Also worth a quick
   check: the Level 1 blind-test writeup still needs its own README
   section (the Level 2 round above does too) — both are documented in
   `_Status.md` only so far.

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
   2026-10-19 against the new Warm Blue anchor, now STALE again against
   the same-day Cool Blue anchor change, still scratchpad-only) so
   Ray can see it visually rather than just as numbers. Also resolved this
   session: coarse-step testing confirmed the original 2-step (0.3/0.6)
   prototype genuinely drops real pencils through value gaps (65.3% vs
   96.6% at full 19-step resolution) — diminishing returns kick in hard
   past ~4 extra steps per side (90.3%, vs 65.3% at 2 steps), which is why
   the ring was rebuilt at 9 steps instead of settling for one more.
8. **RESOLVED 2026-10-20 — the 12 shade-greens are a proven structural
   limit of the YgB arc, not an unsolved search.** Jungle Green, Beryl/
   Grass Green, Summer Green, Viridian, Pthalo Turquoise x2, Castle
   Premium Soft Touch's Teal/Pthalo Green/Pthalo Green Light/Pthalo
   Turquoise/Emerald/Castle Green. Full writeup: README "YgB shade-greens
   — a proven structural limit, not an open search". Short version: these
   12 split into two real pigment families landing at nearly the same hue
   (one group needing L~40-42, the other L~50-62, at hue differences
   under 10deg) — a single arc can only hold one lightness per hue, so no
   Yellow-Blue construction, real or hypothetical, can ever reach both at
   once. Exhaustively tested: per-arc dark targets, darkened G1, a 315-
   combination grid over value-drop x hue-rotation on both primaries
   (capped at 4/12 throughout), a theoretical 1.5x chroma boost beyond any
   real pencil (still capped at 4/12, several pencils got WORSE), blend-
   ratio reparametrisation of the real unmodified primaries (0/12 -- just
   resamples a fixed curve), and rotating the Blue anchor's hue all the
   way to literal teal (the mixing path is backloaded, only turns teal in
   the last ~15-19% of its length with chroma already collapsed by then).
   L2/L3 cross-arcs tested directly against all 12: consistently 1.2-2.5x
   WORSE than L1, confirms there's no escape route via a third family
   either. Closed, not open -- nothing left to search for here.
9. **RESOLVED 2026-10-20 — 7 "high-neon chroma" pencils reclassified as
   `chroma ceiling (exceeds anchor maximum)`, no longer counted as
   unexplained.** Fra Angelico Blue, Hollywood Pink, Ultramarine
   (Luminance), Marigold, Purple, Purple Light, French Rose all sit above
   every anchor's own Munsell chroma near their hue (anchors 10.85-16.65,
   these 7 at 15.71-17.84) — structurally unreachable, the mirror of the
   neutral bands at the top of the chroma axis rather than the bottom.
   Confirmed nothing available raises the ceiling without cost (every
   anchor candidate tested that gained saturation this session cost -9 to
   -28 book-scope coverage). See "Current state" above and README
   "Chroma ceiling category" for the full writeup. At this point:
   18 remained (12 shade-greens, 4 tint, 2 oversaturated) -- the
   shade-greens were then proven structural the same session (#8 above),
   leaving **6 genuinely open** (4 tint, 2 oversaturated).
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

- **2026-10-21 (later same day)**, `session_01X5dmXMWGXhLU1XoXY5WjKm`
  (this session): **Set first-pass tint/shade/normal thresholds for all
  six primary anchors**, using ChromaEngine's own Tints & Shades ramp
  tool (HSL lightness %, 10-point steps). Verified every ramp matched
  its anchor's real hex before trusting Ray's by-eye calls against it,
  and caught/corrected one genuine mix-up along the way (a baseline
  reading labelled "WR" turned out to match Cool Red's hex, not Warm
  Red's -- flagged and confirmed before logging). Found a clear,
  consistent per-arc pattern: RoY has the widest margins and best-
  centred anchors (matching it being the cleanest arc by far in
  yesterday's outlier tracker), YgB is asymmetric (Cool Yellow has real
  room, Cool Blue is pressed against its own shade edge), BvR runs
  narrower across both its anchors than the other two arcs. Also
  confirmed directly against ramp hex values that Cool Yellow's "shade"
  boundary is a genuine hue-exit into olive/green, not just darkening --
  independent numeric support for something suspected earlier in the
  session. Written to `data/anchor_thresholds.json`. Not yet wired into
  the classifier -- that's a real mechanism-reconciliation task for next
  session, not a trivial wire-up (see Current State and next_action).
- **2026-10-21**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session): Ran
  the **Level 2 blind validation round** (48 ID-only swatches, all 6
  cross-arc variants), replicating the Level 1 pattern independently and
  surfacing a new like/flipped arc-variant confusion case. Sorted all
  judged entries by ΔE and found a real crossover around ΔE~11 (not a
  fuzzy gradient), corroborating Ray's recollection of an earlier
  candidate threshold — checked the coverage cost of actually adopting
  it (802→604 book-scope, -198 pencils) and judged it too large to do as
  a blanket change right now. Then built
  `scripts/build_outlier_tracker.cjs` to catalogue every still-open
  never-fit pencil by which of the 6 primary anchors it's nearest to:
  Cool Blue (43) and Cool Red (36) dominate, confirmed as a genuine fit-
  rate problem (12.9%/12.8% vs 37-50% for every other anchor) and not
  just population density. Tested three Cool Blue anchor-swap
  candidates (Middle Phthalo Blue, a true-blue-leaning pick, a near-
  neighbour pick) — all failed, all for informative reasons, converging
  on the same conclusion: the dominant "tint (too light)" problem isn't
  fixable by pigment/hue choice at a similar lightness, it's a structural
  lightness gap the same shape as the proven shade-greens limit. Ray
  caught that all three tests used the same generic method despite
  already knowing Cool Blue and Cool Red fail for different reasons —
  defined an explicit per-arc, split-extremes-first methodology for the
  next attempt (see "Current state" above and Open Items #0). No data
  pipeline files changed except the new outlier tracker; this was
  investigation and methodology work.
- **2026-10-20 (later same day)**, `session_01X5dmXMWGXhLU1XoXY5WjKm`
  (this session): **Found and fixed a never-fit taxonomy staleness bug**,
  caught by Ray cross-referencing two exported spreadsheets (Level
  catches vs never-fit taxonomy) and spotting the same pencil (Hooker's
  Green, Castle Arts Premium Soft Touch) in both. Traced it to
  `data/never_fit_final_153.json` not having been regenerated since the
  Cool Yellow fix (2026-10-15) -- four anchor corrections since then only
  reran the taxonomy categorizer against that same stale input, never
  refreshed the underlying fit/no-fit list. Wrote
  `scripts/build_never_fit_list.cjs` (didn't exist before -- the file was
  migrated whole from the pre-repo session with no generator in this
  repo) and reran it plus `classify_never_fit_taxonomy.cjs`. Net result:
  415 never-fit (was 434, -19), taxonomy 344 entries (was 364). Confirmed
  this didn't touch the published coverage percentages (802/1150,
  879/1294 both unchanged -- `classify_coverage.cjs` always read live
  data directly) -- only the per-pencil breakdown was stale. Old files
  backed up to `data/history/*_PRESTALENESSFIX_backup.json`. Full
  writeup in README. Rebuilt and resent Ray's Level-catches, low-chroma
  and neutrals spreadsheet exports against the corrected data. Flagged
  the "6 genuinely unexplained" headline figure as needing re-derivation
  against the corrected taxonomy -- did not recompute it without being
  sure of the exact prior methodology, left as an open item rather than
  guess.
- **2026-10-20 (later same day)**, `session_01X5dmXMWGXhLU1XoXY5WjKm`
  (this session): **Ran the first blind human-vs-model validation test**
  against Level 1. Built three blank A3-landscape linear arcs and 60
  ID-only swatches (stratified seeded sample, book-scope ranges, pure-L1
  catches only, no identifying info in the client-facing material --
  verified by grepping the injected JSON). Ray placed each by eye blind,
  with positions reported back as plain 0-1 decimals read left-to-right
  off the printed canvas (worked out a standard convention for this
  mid-session after an early ambiguity in "[colour] side X" phrasing
  caused one entry, Purplish Red/ID25, to be mis-logged and need
  re-confirming). Cross-validated against a Canva screenshot via
  exact-hex pixel matching (filtered to the three known bar y-ranges to
  avoid gradient-bleed-through and reference-sheet-duplicate false
  positives -- the same approach developed earlier this session). Found
  strong agreement overall plus two consistent clusters: 6 pencils at the
  YgB blue-leaning end placed ~0.15 earlier than the model by eye, and 3
  near-identical reds in RoY placed as a block at t~0.42 against the
  model's t~0.23. Ruled out general calibration drift by re-checking the
  yellow end of YgB and both arcs' anchor placements directly (all within
  ~0.05, several near-exact). Identified the mechanism with Ray: every
  disagreement is a loose ΔE match (7.8-13.9ΔE), every tight match (ΔE
  <~5) placed almost exactly where the model predicted, zero exceptions --
  ΔE blends hue/chroma/lightness into one number so the model can find
  the true lowest-distance point despite hue drift, but a human eye reads
  hue first and gets visually misled by it. This independently
  corroborates the earlier concern about the ΔE<=15.3 threshold (pencils
  at ΔE 10+ are exactly the ones a human notices don't quite belong).
  Full writeup in README. Roughly a third of the 60 samples remain
  unplaced -- next session continues with Level 2 cross arcs in
  isolation, then Level 3, then tints, then mapping the pattern across
  all of them. No data pipeline files changed -- this was a validation
  exercise against the existing model, scratchpad-only test materials.
- **2026-10-20 (later same day)**, `session_01X5dmXMWGXhLU1XoXY5WjKm`
  (this session): **Proved the 12 shade-greens are a structural limit of
  the YgB arc**, not an open search. Started from Ray's observation that
  nearest matches were geometrically confined to the G1-to-Blue half of
  the real arc (confirmed: all 12 at t>0.5, none in the Yellow-to-G1
  half). Tried and ruled out in sequence: per-arc dark mixing targets
  (Perylene Brown/Beryl Green/Bleu de Nimes, properly scoped -- 0/12);
  a self-generated darkened G1 (0/12); asynchronous value-drop on both
  Yellow and Blue, which genuinely rescued 4/12 as pure arc points (found
  and fixed a real bug along the way in a scratchpad test harness,
  `colorFromTrueLab` producing an invalid string when stringified outside
  a proper spectral.js mix, cascading NaN through half a dyadic tree --
  confirmed the 4/12 result unaffected); a 315-combination grid over
  value-drop x hue-rotation on both primaries together (still capped at
  4/12); a theoretical chroma boost to 1.5x any real pencil (still 4/12,
  several pencils got WORSE); reparametrising the real unmodified
  primaries at a different blend ratio, Ray's own proposed test (0/12 --
  confirmed this just resamples a fixed curve, can't add new information);
  rotating Blue's hue all the way to literal teal (doesn't help -- the
  spectral mixing path is backloaded, only turns teal in the last
  15-19% of its length with chroma already collapsed). Checked L2/L3
  cross-arcs directly against all 12: consistently 1.2-2.5x worse than
  L1, ruling out a third-family escape route. Built a hue-vs-lightness
  chart (real arc path vs all 12 targets) that made the real shape of the
  problem visible: the 12 split into two groups landing at nearly the
  same hue needing very different lightness (e.g. Pthalo Green/Pthalo
  Green Light need L~40-41.5, Pthalo Turquoise/Viridian/Beryl Green need
  L~50-53, at hue within 10deg of each other) -- a single arc can only
  hold one lightness value per hue, so no construction can ever reach
  both groups regardless of where the anchors sit. Likely explanation:
  two genuinely different pigment chemistries (phthalocyanine-based
  "Pthalo" names vs chromium/cadmium-style greens) coincidentally sharing
  a hue. Full writeup in README; closes genuinely-unexplained count from
  18 to 6. All testing was scratchpad-only hypothesis work -- no
  committed data file changed.
- **2026-10-20**, `session_01X5dmXMWGXhLU1XoXY5WjKm` (this session):
  **Cool Red anchor correction** — synthetic `#c62d6a` replaced with
  Middle Purple Pink, Faber-Castell Polychromos (`#c13074`), the last
  fully synthetic anchor closed out. Ray's own first candidate (Bengal
  Rose Deep) cost -15 book-scope; scanned the wider RP/R neighbourhood
  and found only two candidates tying the synthetic at +0 cost, picked
  the one that was also the closer visual match, confirmed by Ray looking
  at the swatch directly. Book-scope holds exactly at 802/1150, combined
  dips -2 from ranges outside the search. Also this session: added the
  "chroma ceiling" taxonomy category (7 high-neon-chroma pencils
  reclassified as structurally explained, not unresolved -- see "Current
  state" above), bringing the genuinely-unexplained count to 18.
- **2026-10-19 (later same day)**, `session_01X5dmXMWGXhLU1XoXY5WjKm`
  (this session): **Cool Blue anchor correction** — Cerulean Blue, Castle
  Arts Gold (`#0082b5`) replaced with Cerulean Blue, Castle Arts Premium
  Soft Touch (`#0088d6`). Prompted by Ray noticing the dE between the two
  blue anchors had grown a lot once Warm Blue became real. Tested real
  B/PB candidates the same two-axis way as Warm Blue; four candidates
  gained +17/+18 book-scope coverage. Ray pushed back hard on whether
  this was a real gain or a numbers illusion ("if we move it more PB, no
  pencils will be captured anyway?") — diffed the exact fit sets to
  confirm: 23 gained (21 real blues filling the gap between the two
  anchors), 6 lost (real greens drifting out), net +17, genuinely
  specific not cosmetic. Picked Premium Soft Touch's own "Cerulean Blue"
  over the numerically-tied Holbein one, Ray's call after a swatch
  comparison. Book-scope 785->802 (+17), combined 862->881 (+19), full
  value-shifted sweep 88.3%->90.1% (25 unexplained). Also excluded 4
  confirmed-fluorescent pencils (Luminous Rose, Luminous Opera, Neon
  Yellow, Neon Pink) from the taxonomy entirely, Ray's call. Regenerated
  all three levels, the taxonomy, and the three Level 1 diagrams
  (primary/equal/real-distance); sent Ray the PNGs and the list of all 25
  remaining never-fit pencils by category. README and this file both
  updated with the full writeup. Level 2 stacked-radial ring prototype
  still needs re-regenerating against this anchor (flagged in Open Items
  #7, not yet done).
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
