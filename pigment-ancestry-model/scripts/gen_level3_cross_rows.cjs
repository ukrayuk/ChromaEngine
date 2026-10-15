const fs = require('fs');
const path = require('path');
const { mixN } = require(path.join(__dirname, '../lib.cjs'));

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/level1_pure_rows.json'), 'utf8'));
const RoY = DATA['Red-Yellow (Orange)'].points;
const YgB = DATA['Yellow-Blue (Green)'].points;
const BvR = DATA['Blue-Red (Violet)'].points;
const N = RoY.length; // 257, verified identical t/gen grid across all three arcs

// Point-for-point three-way mix, same principle as Level 2: all three arcs
// share the identical t/generation grid, so index i is a meaningful shared
// position across all of them. Flipping all three at once just reverses the
// whole result (redundant), so there are 4 distinct combinations -- the same
// shape as the old Level 3's four Arc1-4, generalised from two endpoints to
// the full 257-point curve: everything aligned, or exactly one of the three
// arcs read in reverse. Plain spectral.js equal-weight mixN confirmed
// against physically-swatched layered pencils; the sequential light-to-dark
// layering experiment was tried and reverted.
function crossArc3(flipRoY, flipYgB, flipBvR) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const a = flipRoY ? RoY[N - 1 - i] : RoY[i];
    const b = flipYgB ? YgB[N - 1 - i] : YgB[i];
    const c = flipBvR ? BvR[N - 1 - i] : BvR[i];
    out.push({ t: RoY[i].t, gen: RoY[i].gen, hex: mixN([a.hex, b.hex, c.hex]) });
  }
  return out;
}

const out = {
  'Arc1 — aligned': { p1Name: 'RoY + YgB + BvR, all forward', points: crossArc3(false, false, false) },
  'Arc2 — BvR flipped': { p1Name: 'RoY + YgB forward, BvR reversed', points: crossArc3(false, false, true) },
  'Arc3 — RoY flipped': { p1Name: 'YgB + BvR forward, RoY reversed', points: crossArc3(true, false, false) },
  'Arc4 — YgB flipped': { p1Name: 'RoY + BvR forward, YgB reversed', points: crossArc3(false, true, false) },
};

fs.writeFileSync(path.join(__dirname, '../data/level3_cross_rows.json'), JSON.stringify(out));
console.log('written level3_cross_rows.json');
for (const [k, v] of Object.entries(out)) console.log(k, ':', v.points.length, 'points, G1 midpoint =', v.points[128].hex);
