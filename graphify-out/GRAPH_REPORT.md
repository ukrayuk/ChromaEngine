# Graph Report - ChromaEngine  (2026-10-19)

## Corpus Check
- Large corpus: 104 files · ~659,322 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 474 nodes · 643 edges · 30 communities (27 shown, 3 thin omitted)
- Extraction: 90% EXTRACTED · 9% INFERRED · 1% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.8)
- Token cost: 651,659 input · 114,996 output

## Community Hubs (Navigation)
- Level 1-2 Combo Diagram Script
- Pencil Coverage Classifier & Master Dataset
- Level 2 Standalone Diagram Script
- Tint Ladder Generator Script
- ChromaEngine App & Diagram History
- Anchor Correction History (LAB/Spectral)
- Pencil Data Parsing Script
- Never-Fit Taxonomy Classifier Script
- Three-Colour Search Script
- Cross-Arc Demo Diagram Script
- Olive Dechroma Diagram Script
- Dyadic Mixing Worked Example
- Per-Set Arc Search Script
- Cool-Yellow Comparison Test Script
- Spectral.js Package Metadata
- Level 2 Arc System (Standalone Diagram)
- Spectral Mixing Library (lib.cjs)
- Level 1-2 Combo Diagram Content
- Delta-E Swatch Diagram Script
- Best-Pair Search Script
- Owned Recipes Accuracy Script
- Cross-Arc Mixing Demo Content
- Delta-E Swatch Chart Content
- Olive Dechroma Diagram Content
- Worked Example Diagram Script
- Level 1-2 Combo SVG Structure
- Diagram Screenshot Scripts
- Arc Positions Diagram Content
- Level 2 Standalone Script (Broken)

## God Nodes (most connected - your core abstractions)
1. `hexToLabD65()` - 16 edges
2. `labDist()` - 15 edges
3. `mixSpectral()` - 12 edges
4. `annularWedgePath()` - 11 edges
5. `Level 1 Colour Arc Wheel (Inner Ring)` - 10 edges
6. `Level 2 Arc Expansion Clusters (Outer Petals)` - 10 edges
7. `ChromaEngine` - 9 edges
8. `Delta-E Swatch Comparison Chart` - 8 edges
9. `Delta-E (ΔE) Colour Difference Metric` - 8 edges
10. `Level 2 Arc System Diagram (Standalone)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Palette Health Score` --semantically_similar_to--> `ΔE ≤ 15.3 fit threshold (CIE76, D65)`  [INFERRED] [semantically similar]
  README.md → pigment-ancestry-model/README.md
- `Polychromos pencil matching` --shares_data_with--> `master.json (measured pencil database, 1825 pencils)`  [INFERRED]
  README.md → pigment-ancestry-model/README.md
- `ChromaEngine` --conceptually_related_to--> `Pigment Ancestry Model (Colour Family Arc System)`  [INFERRED]
  README.md → pigment-ancestry-model/README.md
- `master.json (measured pencil database, 1825 pencils)` --shares_data_with--> `master.json (pencil dataset)`  [INFERRED]
  pigment-ancestry-model/README.md → data/README.md
- `buildDyadic()` --calls--> `mixSpectral()`  [EXTRACTED]
  pigment-ancestry-model/scripts/investigations/search_perset_arc.cjs → pigment-ancestry-model/lib.cjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pencil Measurement Data Pipeline** — data_parse_pencils, data_readme_master_json, pigment_ancestry_model_scripts_classify_coverage [INFERRED 0.85]
- **"Trust the rendered swatch, not just the metric" lesson** — pigment_ancestry_model_readme_bvr_six_sector_split, pigment_ancestry_model_readme_cool_yellow_correction, pigment_ancestry_model_readme_warm_yellow_corrections [EXTRACTED 1.00]
- **Diagram Rendering Pipeline (shared geometry helper)** — pigment_ancestry_model_scripts_diagrams_build_level1_level2_combo_v2, pigment_ancestry_model_scripts_diagrams_rendering_polar_lib, pigment_ancestry_model_scripts_diagrams_rendering_build_summary_rings [INFERRED 0.85]

## Communities (30 total, 3 thin omitted)

### Community 0 - "Level 1-2 Combo Diagram Script"
Cohesion: 0.05
Nodes (43): ARCS_L1, drawRingStack(), fs, L1, L2, { polar, annularWedgePath }, svgParts, ZONES (+35 more)

### Community 1 - "Pencil Coverage Classifier & Master Dataset"
Cohesion: 0.05
Nodes (33): master.json (pencil dataset), master.json (measured pencil database, 1825 pencils), allRanges, BOOK_RANGES, canonical, canonicalAll, canonicalBook, classify() (+25 more)

### Community 2 - "Level 2 Standalone Diagram Script"
Cohesion: 0.06
Nodes (19): FAMILY, fs, ROWS, ZONES, ARC_INFO, arcKeys, fs, L1 (+11 more)

### Community 3 - "Tint Ladder Generator Script"
Cohesion: 0.08
Nodes (23): "Hue gap + tint (combo)" taxonomy category, Level 4 tint ladder (toward white), fs, L1, L2, L3, ladder, { mixSpectral } (+15 more)

### Community 4 - "ChromaEngine App & Diagram History"
Cohesion: 0.11
Nodes (20): index.html (ChromaEngine single-file app), Level 2 diagram stacked-radial layout (2026-10-17), Level 2 (cross-arc mixing), Level 3 (three-way cross-arc mixing), Pigment Ancestry Model (Colour Family Arc System), Analyse a palette (mode), Build from a colour (mode), ChromaEngine (+12 more)

### Community 5 - "Anchor Correction History (LAB/Spectral)"
Cohesion: 0.10
Nodes (15): colorFromTrueLab(), mixSpectralTrueLab(), BvR arc (Blue-Red -> Violet), Six canonical hue-role anchors (Warm Red, Warm Yellow, Cool Yellow, Cool Blue, Warm Blue, Cool Red), Dyadic recursive-midpoint subdivision (8 generations, 257 points/arc), labDist() (CIE76 ΔE), Level 1 arcs (dyadic recursive-midpoint subdivision), lib.cjs (core colour math module) (+7 more)

### Community 6 - "Pencil Data Parsing Script"
Cohesion: 0.14
Nodes (18): dedupeKey(), findIndexAny(), fs, grabAfterAny(), loadMaster(), main(), MASTER_PATH, num() (+10 more)

### Community 7 - "Never-Fit Taxonomy Classifier Script"
Cohesion: 0.13
Nodes (19): checkNames, chroma(), counts, DROPPED_RANGES, fs, { hexToLabD65, labDist }, hueDeg(), hueDiff() (+11 more)

### Community 8 - "Three-Colour Search Script"
Cohesion: 0.11
Nodes (16): ARC_SPANS, arcOf(), BEST_PAIR, CHAPTER_ARC, fs, GRID, { hexToLabD65, labDist }, hueAngle() (+8 more)

### Community 9 - "Cross-Arc Demo Diagram Script"
Cohesion: 0.12
Nodes (16): bLab, chroma(), dE, fmt(), fs, { hexToLabD65, labDist }, hueDeg(), idx (+8 more)

### Community 10 - "Olive Dechroma Diagram Script"
Cohesion: 0.11
Nodes (14): dE, fs, gC, gH, greenLab, greenPoint, { hexToLabD65, labDist }, L1 (+6 more)

### Community 11 - "Dyadic Mixing Worked Example"
Cohesion: 0.15
Nodes (15): mixN(), mixSpectral(), buildDyadic(), buildDyadic(), fs, { hexToLabD65, labDist, mixSpectral }, items, pts (+7 more)

### Community 12 - "Per-Set Arc Search Script"
Cohesion: 0.15
Nodes (13): ARC_SPANS, arcOf(), buildDyadic(), CHAPTER_ARC, CHAPTERS, fs, { hexToLabD65, labDist, mixSpectral }, hueAngle() (+5 more)

### Community 13 - "Cool-Yellow Comparison Test Script"
Cohesion: 0.18
Nodes (12): labDist(), allRanges, BOOK_RANGES, canonical, canonicalAll, canonicalBook, classify(), EXTRA_RANGES (+4 more)

### Community 14 - "Spectral.js Package Metadata"
Cohesion: 0.15
Nodes (12): author, dependencies, spectral.js, description, keywords, license, main, name (+4 more)

### Community 15 - "Level 2 Arc System (Standalone Diagram)"
Cohesion: 0.35
Nodes (13): BVR Primary Arc (Blue-Violet-Red), Central Anchor Pigment Dot Pairs, Level 2 Arc System Diagram (Standalone), Level 2 of Colour Family Arc System, Pigment Ancestry Model / Colour Family Arc System, ROY Primary Arc (Red-Orange-Yellow), ROYxBVR-cross Arc, ROYxBVR-like Arc (+5 more)

### Community 16 - "Spectral Mixing Library (lib.cjs)"
Cohesion: 0.26
Nodes (11): colorFromTrueLab(), compand(), f(), labD65ToXYZ(), matVec(), mixSpectralTrueLab(), mixTrueEqual(), mixTrueShare() (+3 more)

### Community 17 - "Level 1-2 Combo Diagram Content"
Cohesion: 0.30
Nodes (12): Level 1 + Level 2 Colour Arc Combo Diagram, Blue Colour Family Arc, Green Colour Family Arc, Level 1 Colour Arc Wheel (Inner Ring), Level 2 Arc Expansion Clusters (Outer Petals), Magenta / Red-Violet Colour Family Arc, Orange Colour Family Arc, Pigment Ancestry Model (+4 more)

### Community 18 - "Delta-E Swatch Diagram Script"
Cohesion: 0.25
Nodes (10): ANCHORS, chroma(), finv(), fs, gamma(), { hexToLabD65, labDist }, labToHex(), roundTrip (+2 more)

### Community 19 - "Best-Pair Search Script"
Cohesion: 0.20
Nodes (9): buildDyadic(), CHAPTERS, fs, { hexToLabD65, labDist, mixSpectral }, MASTER, pool, POOL_RANGES, results (+1 more)

### Community 20 - "Owned Recipes Accuracy Script"
Cohesion: 0.28
Nodes (8): hexToLabD65(), accuracyPct(), ARCS_OWNED, CHAPTERS, fs, { hexToLabD65, labDist, mixSpectral }, results, loadModel()

### Community 21 - "Cross-Arc Mixing Demo Content"
Cohesion: 0.28
Nodes (9): Level 1 BvR Arc Mix (Violet, t=0.430, G7), Cool Blue (Cerulean Blue), Cool Red (8.25RP 4.5/14), Cool Yellow (Lemon Cadmium), Cross-Arc Mixing Demo Diagram, Level 2 Cross-Mix (YgB x BvR, Like Pairing), Cross-Mix Target (L44 C30 H142 deg, dE 8.7), Warm Blue (8PB 4.8/13) (+1 more)

### Community 22 - "Delta-E Swatch Chart Content"
Cohesion: 0.44
Nodes (9): Delta-E Swatch Comparison Chart, Cool Blue — Cerulean Blue (#0082b5, chroma 36.8), Cool Red — synthetic 8.25RP (#c62d6a, chroma 62.8), Cool Yellow — Lemon Cadmium (#f6e83b, chroma 80.3), Delta-E (ΔE) Colour Difference Metric, ΔE 15.3 Fit Threshold, Warm Blue — synthetic 8PB (#5f6bca, chroma 55.7), Warm Red — Vermilion (#e3212f, chroma 82.6) (+1 more)

### Community 23 - "Olive Dechroma Diagram Content"
Cohesion: 0.36
Nodes (8): build_olive_dechroma.cjs (generation script), Cool Blue Arc Anchor (Cerulean Blue), Cool Yellow Arc Anchor (Lemon Cadmium), De-chroma Transform (Delta L -33, Delta C -53, Delta H 1deg), Green Mix Result (t=1/32, G5, L87 C78 H111deg), Olive De-chroma Diagram, Olive Target Role Colour (Pablo "Olive", L54 C26 H112deg), YgB Arc (Chapter 3 Style)

### Community 24 - "Worked Example Diagram Script"
Cohesion: 0.25
Nodes (7): dE, fs, g3Point, { hexToLabD65, labDist }, items, L1, targetLab

### Community 25 - "Level 1-2 Combo SVG Structure"
Cohesion: 0.60
Nodes (5): Annotation Overlay (Outlined Sector and Leader Lines), Radial Color Wheel Fan Structure, Level 1 Color Family Rings (Inner Arcs), Level 2 Color Subdivisions (Outer Arcs), Level 1/Level 2 Combo Diagram (SVG)

### Community 27 - "Arc Positions Diagram Content"
Cohesion: 1.00
Nodes (4): BvR Arc (Warm Blue to Cool Red, t=0 to t=1), Arc Positions Diagram (Pigment Ancestry Model), RoY Arc (Warm Red to Warm Yellow, t=0 to t=1), YgB Arc (Cool Yellow to Cool Blue, t=0 to t=1)

## Ambiguous Edges - Review These
- `build_level1_pure_circular_filled.cjs` → `polar_lib.cjs (shared geometry helper)`  [AMBIGUOUS]
  pigment-ancestry-model/scripts/diagrams/RENDERING.md · relation: calls
- `Level 2 Color Subdivisions (Outer Arcs)` → `Annotation Overlay (Outlined Sector and Leader Lines)`  [AMBIGUOUS]
  pigment-ancestry-model/reference_images/level1-level2-combo-v2.svg · relation: conceptually_related_to
- `Level 2 Arc System Diagram (Standalone)` → `Central Anchor Pigment Dot Pairs`  [AMBIGUOUS]
  pigment-ancestry-model/reference_images/level2-standalone.png · relation: references
- `Olive De-chroma Diagram` → `build_olive_dechroma.cjs (generation script)`  [AMBIGUOUS]
  pigment-ancestry-model/reference_images/olive_dechroma.png · relation: conceptually_related_to

## Knowledge Gaps
- **29 isolated node(s):** `spectral.js`, `OKLCH colour space`, `WCAG 2.x contrast math`, `k-means clustering in OKLab (photo extraction)`, `Eyedropper (exact point sampling)` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 275 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `master.json (measured pencil database, 1825 pencils)` connect `Pencil Coverage Classifier & Master Dataset` to `ChromaEngine App & Diagram History`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `spectral.js`, `OKLCH colour space`, `WCAG 2.x contrast math` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Level 1-2 Combo Diagram Script` be split into smaller, more focused modules?**
  _Cohesion score 0.053109713487071976 - nodes in this community are weakly interconnected._
- **Why does `Never-fit taxonomy (tint/tone/shade/neutral/etc.)` connect `Anchor Correction History (LAB/Spectral)` to `Pencil Coverage Classifier & Master Dataset`, `Tint Ladder Generator Script`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `Pencil Coverage Classifier & Master Dataset` be split into smaller, more focused modules?**
  _Cohesion score 0.054878048780487805 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `build_level1_pure_circular_filled.cjs` and `polar_lib.cjs (shared geometry helper)`?**
  _Edge tagged AMBIGUOUS (relation: calls) - confidence is low._
- **What is the exact relationship between `Level 2 Color Subdivisions (Outer Arcs)` and `Annotation Overlay (Outlined Sector and Leader Lines)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._