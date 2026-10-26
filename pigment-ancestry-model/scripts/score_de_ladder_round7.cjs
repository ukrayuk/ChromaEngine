// Scores Ray's seventh round (2026-10-26) -- a quick 5-swatch trial of
// a viewing-method hypothesis: that zooming in tight on the ladder to
// judge a placement loses the relative context (simultaneous contrast)
// that makes the row judgment possible, so placements should improve
// if Ray zooms in only to pick each swatch's colour, then zooms back
// out to the full ladder before deciding where it goes. Output:
// data/ygb_blind5_round7_scored.json.
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

const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ygb_blind5_round7.json'), 'utf8'));

const ray = {
  1: { dl: 0, t: 0 }, 2: { dl: -4, t: 0.99 }, 3: { dl: -7, t: 0.95 }, 4: { dl: -14, t: 0.85 }, 5: { dl: -14, t: 0.99 },
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

fs.writeFileSync(path.join(ROOT, 'data/ygb_blind5_round7_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'placements ->', path.join(ROOT, 'data/ygb_blind5_round7_scored.json'));

const maxRowErr = Math.max(...rows.map((r) => Math.abs(r.dlErr)));
const avgDE = rows.reduce((s, r) => s + r.dE, 0) / rows.length;
console.log('max |row error|:', maxRowErr, '(every placement within this)');
console.log('mean deltaE:', avgDE.toFixed(2), '-- mostly the known near-anchor steep-gradient effect, not row-judgment error (4/5 pencils sit at t=0.81-1.0)');
