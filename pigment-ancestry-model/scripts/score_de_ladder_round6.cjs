// Scores Ray's sixth blind-validation round (2026-10-26) against the
// answer key for the 10 pencils in data/ygb_blind10_round6.json --
// first round run against the white-row-divider ladder. Scores both
// raw row error and a combined-placement ΔE (the point you called vs
// the model's actual point, both as colours on the same ladder).
// Output: data/ygb_blind10_round6_scored.json.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('../lib.cjs');

const ROOT = path.join(__dirname, '..');
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const arc = L1['Yellow-Blue (Green)'].points.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

function nearestArcByT(t) {
  let best = Infinity, bestP = null;
  for (const p of arc) { const d = Math.abs(p.t - t); if (d < best) { best = d; bestP = p; } }
  return bestP;
}
function pointLab(t, row) {
  const a = nearestArcByT(t);
  return [a.lab[0] + row, a.lab[1], a.lab[2]];
}

const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ygb_blind10_round6.json'), 'utf8'));

const ray = {
  1: { dl: 2, t: 1 }, 2: { dl: -1, t: 0.09 }, 3: { dl: -14, t: 0.98 }, 4: { dl: 11, t: 0.98 }, 5: { dl: -5, t: 0.98 },
  6: { dl: -11, t: 0.03 }, 7: { dl: 0, t: 0 }, 8: { dl: 1, t: 0 }, 9: { dl: -1, t: 0.4 }, 10: { dl: 3, t: 0.76 },
};

const rows = answers.map((a) => {
  const r = ray[a.id];
  const realRow = Math.round(a.dL);
  const realLab = pointLab(a.t, realRow);
  const guessLab = pointLab(r.t, r.dl);
  return {
    id: a.id, name: a.name, range: a.range,
    realDL: a.dL, realRow, rayDL: r.dl, dlErr: r.dl - realRow,
    realT: +a.t.toFixed(3), rayT: r.t, tErr: +(r.t - a.t).toFixed(3),
    dE: +labDist(realLab, guessLab).toFixed(2),
  };
});
rows.sort((x, y) => x.id - y.id);

fs.writeFileSync(path.join(ROOT, 'data/ygb_blind10_round6_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'placements ->', path.join(ROOT, 'data/ygb_blind10_round6_scored.json'));

const within2 = rows.filter((r) => Math.abs(r.dlErr) <= 2).length;
const avgDE = rows.reduce((s, r) => s + r.dE, 0) / rows.length;
console.log('within +/-2 rows:', within2, '/', rows.length);
console.log('mean deltaE:', avgDE.toFixed(2));
