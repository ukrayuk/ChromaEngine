const fs = require('fs');
const path = require('path');
const { mixSpectral } = require(path.join(__dirname, '../../lib.cjs'));

// "Level 4" tint ladder -- validated 2026-10-16 (96.6% rescue on the
// original 176-pencil tint set, see validate_tint_ladder.cjs). Every
// Level 1 + Level 2 + Level 3 point, blended toward white at 19 fixed
// steps, using the SAME plain mixSpectral the rest of the model already
// uses (no new mixing method, no new anchors -- see README "Mixing
// Method").
//
// Level 3 was originally excluded here (reasoning: it's a borrowed-depth
// mix of all three Level 1 arcs already, so tinting it would "retrace
// ground L1/L2 already cover"). Reversed 2026-10-18 (Ray): that reasoning
// doesn't hold up against real data. Testing the 30 "hue gap + tint
// (combo)" taxonomy entries (never_fit_taxonomy.json) against a full
// L1+L2+L3 value-shifted pool captured all 30/30 -- and 8 of those 30
// needed Level 3 tints specifically; L1/L2 tints alone weren't close
// enough. L3's geometry overlaps L1/L2 in COLOUR, but tinting it still
// opens genuinely different ground because the three-way mix sits at a
// different point in the space than any L1/L2 tint reaches. Also matches
// the project's own earlier history: Level 3 coverage looked negligible
// (2 pencils) before the Cool Yellow anchor was corrected, then rose
// sharply -- L3's real contribution has always been anchor-sensitive, not
// fixed, so excluding it on a single early measurement was premature.
const L1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/level1_pure_rows.json'), 'utf8'));
const L2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/level2_cross_rows.json'), 'utf8'));
const L3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/level3_cross_rows.json'), 'utf8'));

const STEPS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50,
               0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95];

const sources = [];
for (const key of Object.keys(L1)) for (const p of L1[key].points) sources.push({ hex: p.hex, arc: key });
for (const key of Object.keys(L2)) for (const p of L2[key].points) sources.push({ hex: p.hex, arc: key });
for (const key of Object.keys(L3)) for (const p of L3[key].points) sources.push({ hex: p.hex, arc: key });

const ladder = [];
for (const s of sources) {
  for (const t of STEPS) {
    ladder.push({ hex: mixSpectral(s.hex, '#ffffff', t), sourceArc: s.arc, t });
  }
}

fs.writeFileSync(path.join(__dirname, '../../data/ladder/tint_ladder_full.json'), JSON.stringify(ladder));
console.log('written tint_ladder_full.json:', sources.length, 'sources x', STEPS.length, 'steps =', ladder.length, 'points');
