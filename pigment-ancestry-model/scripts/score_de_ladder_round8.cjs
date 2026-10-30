// Scores Ray's eighth round (2026-10-30) -- the first blind test of the
// new arc-length (ΔE-uniform, "u-axis") ladder built earlier this
// session. 18 pencils: 10 deliberately placed near the two arc edges
// (the exact zone the arc-length axis was built to fix), 8 scattered
// through the middle for comparison. Output:
// data/ygb_blind18_round8_scored.json.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('../lib.cjs');

const ROOT = path.join(__dirname, '..');
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const arc = L1['Yellow-Blue (Green)'].points.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

let cum = 0;
const withCum = [{ t: arc[0].t, lab: arc[0].lab, cum: 0 }];
for (let i = 1; i < arc.length; i++) {
  cum += labDist(arc[i - 1].lab, arc[i].lab);
  withCum.push({ t: arc[i].t, lab: arc[i].lab, cum });
}
const TOTAL = cum;

function labAtU(u) {
  const target = u * TOTAL;
  for (let i = 1; i < withCum.length; i++) {
    if (withCum[i].cum >= target) {
      const a = withCum[i - 1], b = withCum[i];
      const span = b.cum - a.cum;
      const frac = span > 0 ? (target - a.cum) / span : 0;
      return a.lab.map((v, k) => v + (b.lab[k] - v) * frac);
    }
  }
  return withCum[withCum.length - 1].lab;
}
function pointLab(u, row) {
  const lab = labAtU(u);
  return [lab[0] + row, lab[1], lab[2]];
}

const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ygb_blind18_round8.json'), 'utf8'));

const ray = {
  1: { dl: 12, u: 0.83 }, 2: { dl: 2, u: 0.125 }, 3: { dl: -2, u: 0.99 }, 4: { dl: -11, u: 0.91 }, 5: { dl: 5, u: 0.15 },
  6: { dl: -11, u: 0.2 }, 7: { dl: 4, u: 0.79 }, 8: { dl: -2, u: 0.21 }, 9: { dl: 11, u: 0.99 }, 10: { dl: -15, u: 0.035 },
  11: { dl: -1, u: 0.85 }, 12: { dl: -8, u: 0.28 }, 13: { dl: -11, u: 0.485 }, 14: { dl: 3, u: 0.02 }, 15: { dl: 5, u: 0.81 },
  16: { dl: 11, u: 0.99 }, 17: { dl: -1, u: 0.68 }, 18: { dl: -9, u: 0.045 },
};

const rows = answers.map((a) => {
  const r = ray[a.id];
  const realRow = Math.round(a.dL);
  const realLab = pointLab(a.u, realRow);
  const guessLab = pointLab(r.u, r.dl);
  return {
    id: a.id, name: a.name, range: a.range,
    realDL: a.dL, realRow, rayDL: r.dl, dlErr: r.dl - realRow,
    realU: +a.u.toFixed(3), rayU: r.u, uErr: +(r.u - a.u).toFixed(3),
    dE: +labDist(realLab, guessLab).toFixed(2),
    edge: a.u < 0.15 || a.u > 0.85,
  };
});
rows.sort((x, y) => x.id - y.id);

fs.writeFileSync(path.join(ROOT, 'data/ygb_blind18_round8_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'placements ->', path.join(ROOT, 'data/ygb_blind18_round8_scored.json'));

const avg = (arr) => arr.reduce((s, r) => s + r.dE, 0) / arr.length;
const edgeRows = rows.filter((r) => r.edge);
const midRows = rows.filter((r) => !r.edge);
console.log('EDGE (n=' + edgeRows.length + ') mean dE:', avg(edgeRows).toFixed(2));
console.log('MID  (n=' + midRows.length + ') mean dE:', avg(midRows).toFixed(2));
console.log('ALL  (n=' + rows.length + ') mean dE:', avg(rows).toFixed(2));
