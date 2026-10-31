// Follow-up to roy round 1 (score_de_ladder_roy_round1.cjs): re-ran
// the 6 pencils that flipped tint/shade direction in round 1, with
// fresh shuffled IDs (so Ray couldn't recognise them by position) and
// the round-7 "zoom in to pick, zoom out to place" instruction,
// isolated from the other 19 and no longer as part of one 25-item
// batch. Tests whether round 1's flips were batch-size/fatigue
// artefacts or genuine per-pencil confusions.
// Output: data/roy_retest6_scored.json.
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

const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/roy_retest6.json'), 'utf8'));

const ray = {
  1: { dl: 1, u: 0.01 }, 2: { dl: 2, u: 0.68 }, 3: { dl: -2, u: 0.38 },
  4: { dl: -1, u: 0.99 }, 5: { dl: 9, u: 0.395 }, 6: { dl: 8, u: 0.26 },
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

fs.writeFileSync(path.join(ROOT, 'data/roy_retest6_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'placements ->', path.join(ROOT, 'data/roy_retest6_scored.json'));

const avgDE = rows.reduce((s, r) => s + r.dE, 0) / rows.length;
const flips = rows.filter((r) => r.flip);
console.log('mean deltaE:', avgDE.toFixed(2), '(round 1 was 8.54) | flips remaining:', flips.length, '/ 6 (round 1 had 6/6)');
console.log('still flipping:', flips.map((r) => r.id + ' (' + r.name + ')').join(', '));
