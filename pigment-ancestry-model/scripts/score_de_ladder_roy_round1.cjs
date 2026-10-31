// Scores Ray's first blind round on Red-Yellow (Orange) (2026-10-30/31):
// 25 pencils stratified across the whole arc, against the arc-length
// (u-axis) ladder -- the first time that axis was used on a brand-new
// arc, in one full 25-pencil batch. Result was a sharp regression from
// every Yellow-Blue/Blue-Red round: mean dE 8.54, only 10/25 within
// +/-2 rows, and 6 outright direction flips (shade called as tint or
// vice versa). See scripts/score_de_ladder_roy_retest6.cjs for the
// follow-up that isolated the 6 flips and re-ran them individually.
// Output: data/roy_blind25_round1_scored.json.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('../lib.cjs');

const ROOT = path.join(__dirname, '..');
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const arc = L1['Red-Yellow (Orange)'].points.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

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

const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/roy_blind25_round1.json'), 'utf8'));

const ray = {
  1: { dl: -2, u: 0.1 }, 2: { dl: 2, u: 0.655 }, 3: { dl: 2, u: 0.92 }, 4: { dl: 5, u: 0.51 }, 5: { dl: 13, u: 0.005 },
  6: { dl: 4, u: 0.79 }, 7: { dl: -6, u: 0.45 }, 8: { dl: 4, u: 0.35 }, 9: { dl: 4, u: 0.5 }, 10: { dl: 7, u: 0.295 },
  11: { dl: -7, u: 0.193 }, 12: { dl: -1, u: 0.315 }, 13: { dl: 8, u: 0.69 }, 14: { dl: 9, u: 0.5 }, 15: { dl: -5, u: 0.79 },
  16: { dl: -3, u: 0.14 }, 17: { dl: 2, u: 0.98 }, 18: { dl: 2, u: 0.41 }, 19: { dl: 5, u: 0.605 }, 20: { dl: -10, u: 0.305 },
  21: { dl: -4, u: 0.21 }, 22: { dl: 3, u: 0.99 }, 23: { dl: -2, u: 0.55 }, 24: { dl: 6, u: 0.875 }, 25: { dl: -7, u: 0.49 },
};

const rows = answers.map((a) => {
  const r = ray[a.id];
  const realRow = Math.round(a.dL);
  const realLab = pointLab(a.u, realRow);
  const guessLab = pointLab(r.u, r.dl);
  const flip = Math.sign(realRow) !== 0 && Math.sign(r.dl) !== 0 && Math.sign(realRow) !== Math.sign(r.dl);
  return {
    id: a.id, name: a.name, range: a.range,
    realDL: a.dL, realRow, rayDL: r.dl, dlErr: r.dl - realRow,
    realU: +a.u.toFixed(3), rayU: r.u, uErr: +(r.u - a.u).toFixed(3),
    dE: +labDist(realLab, guessLab).toFixed(2), flip,
  };
});
rows.sort((x, y) => x.id - y.id);

fs.writeFileSync(path.join(ROOT, 'data/roy_blind25_round1_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'placements ->', path.join(ROOT, 'data/roy_blind25_round1_scored.json'));

const avgDE = rows.reduce((s, r) => s + r.dE, 0) / rows.length;
const within2 = rows.filter((r) => Math.abs(r.dlErr) <= 2).length;
const flips = rows.filter((r) => r.flip);
console.log('mean deltaE:', avgDE.toFixed(2), '| within +/-2 rows:', within2, '/', rows.length, '| direction flips:', flips.length);
console.log('flips:', flips.map((r) => r.id + ' (' + r.name + ')').join(', '));
