const fs = require('fs');
const path = require('path');
const { mixSpectral } = require(path.join(__dirname, '../lib.cjs'));

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/level1_pure_rows.json'), 'utf8'));

// Point-for-point 50:50 mix across two Level 1 arcs that share the same
// dyadic t/generation grid (verified: identical t and gen at every one of
// the 257 positions). "Like" pairs position i with position i; "Flipped"
// pairs position i with the other arc's mirrored position (N-1-i), so the
// two arcs run in opposite directions relative to each other. Plain
// spectral.js mixing confirmed against physically-swatched layered pencils.
function crossArc(arcA, arcB, flip) {
  const n = arcA.points.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = arcA.points[i];
    const b = flip ? arcB.points[n - 1 - i] : arcB.points[i];
    out.push({ t: a.t, gen: a.gen, hex: mixSpectral(a.hex, b.hex, 0.5) });
  }
  return out;
}

function buildPair(keyA, keyB, labelA, labelB) {
  const arcA = DATA[keyA], arcB = DATA[keyB];
  return {
    like: { p1Name: labelA + ' end ↔ ' + labelB + ' end (same direction)', p2Name: '', points: crossArc(arcA, arcB, false) },
    flipped: { p1Name: labelA + ' end ↔ ' + labelB + ' reversed (opposite direction)', p2Name: '', points: crossArc(arcA, arcB, true) },
  };
}

const out = {};
const pairs = [
  buildPair('Red-Yellow (Orange)', 'Yellow-Blue (Green)', 'RoY', 'YgB'),
  buildPair('Yellow-Blue (Green)', 'Blue-Red (Violet)', 'YgB', 'BvR'),
  buildPair('Blue-Red (Violet)', 'Red-Yellow (Orange)', 'BvR', 'RoY'),
];
const names = ['RoY × YgB', 'YgB × BvR', 'BvR × RoY'];
pairs.forEach((pair, i) => {
  out[names[i] + ' — like'] = pair.like;
  out[names[i] + ' — flipped'] = pair.flipped;
});

fs.writeFileSync(path.join(__dirname, '../data/level2_cross_rows.json'), JSON.stringify(out));
console.log('written level2_cross_rows.json');
for (const [k, v] of Object.entries(out)) console.log(k, ':', v.points.length, 'points, G1 (midpoint) hex =', v.points[128].hex);
