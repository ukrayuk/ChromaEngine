const fs = require('fs');
const path = require('path');
const { mixSpectral } = require(path.join(__dirname, '../../lib.cjs'));

// "Level 4" tint ladder -- validated 2026-10-16 (96.6% rescue, see
// validate_tint_ladder.cjs). NOT an extension of Level 1/2/3's geometry:
// every Level 1 + Level 2 point, blended toward white at 19 fixed steps,
// using the SAME plain mixSpectral the rest of the model already uses (no
// new mixing method, no new anchors -- see README "Mixing Method"). Level 3
// excluded: its colours are a borrowed-depth mix of all three Level 1 arcs
// already (see README/Status "generation ring" finding, 2026-10-16), so
// tinting it on top of Level 1/2 would just retrace ground those two
// already cover at a different chroma/lightness, not open new territory.
const L1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/level1_pure_rows.json'), 'utf8'));
const L2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/level2_cross_rows.json'), 'utf8'));

const STEPS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50,
               0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95];

const sources = [];
for (const key of Object.keys(L1)) for (const p of L1[key].points) sources.push({ hex: p.hex, arc: key });
for (const key of Object.keys(L2)) for (const p of L2[key].points) sources.push({ hex: p.hex, arc: key });

const ladder = [];
for (const s of sources) {
  for (const t of STEPS) {
    ladder.push({ hex: mixSpectral(s.hex, '#ffffff', t), sourceArc: s.arc, t });
  }
}

fs.writeFileSync(path.join(__dirname, '../../data/ladder/tint_ladder_full.json'), JSON.stringify(ladder));
console.log('written tint_ladder_full.json:', sources.length, 'sources x', STEPS.length, 'steps =', ladder.length, 'points');
