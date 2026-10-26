// Scores Ray's first blind-validation round on the Blue-Red (Violet)
// arc (2026-10-26) -- same stratified-25-pencil, combined row+t
// protocol as Yellow-Blue round 3, run against the white-divider
// ladder to see whether the YgB accuracy picture (and the divider
// improvement) holds on a different arc. ID11 was left unplaced
// ("too blue" -- read as not belonging to this arc's hue family at
// all, right next to the Warm Blue anchor) and is reported separately,
// not scored as a numeric miss.
// ID23's call was corrected after the fact (2026-10-26): the original
// "tint +7, t=0.24" was a Canva colour-picker error (grabbed a line
// pixel, not the swatch fill), not a real perceptual miss -- Ray
// corrected it to "shade -2, t=0.3" once he spotted it.
// Output: data/bvr_blind25_round1_scored.json.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('../lib.cjs');

const ROOT = path.join(__dirname, '..');
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const arc = L1['Blue-Red (Violet)'].points.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

function nearestArcByT(t) {
  let best = Infinity, bestP = null;
  for (const p of arc) { const d = Math.abs(p.t - t); if (d < best) { best = d; bestP = p; } }
  return bestP;
}
function pointLab(t, row) {
  const a = nearestArcByT(t);
  return [a.lab[0] + row, a.lab[1], a.lab[2]];
}

const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bvr_blind25_round1.json'), 'utf8'));

// ID11 intentionally omitted: Ray could not place it ("too blue").
const ray = {
  1: { dl: -4, t: 0 }, 2: { dl: -2, t: 0.195 }, 3: { dl: -2, t: 0.99 }, 4: { dl: 11, t: 0.19 }, 5: { dl: -1, t: 0.83 },
  6: { dl: 6, t: 0.31 }, 7: { dl: -8, t: 0 }, 8: { dl: 0, t: 0 }, 9: { dl: 7, t: 0.98 }, 10: { dl: 2, t: 0.34 },
  12: { dl: 1, t: 0.24 }, 13: { dl: 6, t: 0.67 }, 14: { dl: -2, t: 0.615 }, 15: { dl: 7, t: 1 }, 16: { dl: -5, t: 0.94 },
  17: { dl: -8, t: 0.79 }, 18: { dl: 2, t: 0.795 }, 19: { dl: -6, t: 0.29 }, 20: { dl: -8, t: 0.45 }, 21: { dl: 2, t: 0.02 },
  22: { dl: -4, t: 0.94 }, 23: { dl: -2, t: 0.3 }, 24: { dl: 1, t: 0.98 }, 25: { dl: 2, t: 0.56 },
};

const rows = [];
for (const a of answers) {
  if (!ray[a.id]) {
    rows.push({ id: a.id, name: a.name, range: a.range, realDL: a.dL, realT: +a.t.toFixed(3), unplaced: true, note: 'too blue -- read as not belonging to this arc, next to Warm Blue anchor' });
    continue;
  }
  const r = ray[a.id];
  const realRow = Math.round(a.dL);
  const realLab = pointLab(a.t, realRow);
  const guessLab = pointLab(r.t, r.dl);
  rows.push({
    id: a.id, name: a.name, range: a.range,
    realDL: a.dL, realRow, rayDL: r.dl, dlErr: r.dl - realRow,
    realT: +a.t.toFixed(3), rayT: r.t, tErr: +(r.t - a.t).toFixed(3),
    dE: +labDist(realLab, guessLab).toFixed(2),
  });
}
rows.sort((x, y) => x.id - y.id);

fs.writeFileSync(path.join(ROOT, 'data/bvr_blind25_round1_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'entries (' + rows.filter((r) => r.unplaced).length + ' unplaced) ->', path.join(ROOT, 'data/bvr_blind25_round1_scored.json'));

const scored = rows.filter((r) => !r.unplaced);
const within2 = scored.filter((r) => Math.abs(r.dlErr) <= 2).length;
const avgDE = scored.reduce((s, r) => s + r.dE, 0) / scored.length;
console.log('within +/-2 rows:', within2, '/', scored.length);
console.log('mean deltaE:', avgDE.toFixed(2));
