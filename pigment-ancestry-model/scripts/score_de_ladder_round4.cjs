// Scores Ray's fourth blind-validation round (2026-10-25) against the
// answer key for the 10 pencils in data/ygb_blind10_round4.json -- all
// deliberately drawn from the t=0.3-0.7 shallow-gradient zone (mixing
// shade and tint) flagged by round 3 as a problem area, with none
// reused from round 3's own 25-pencil set. Tolerance recalibrated to
// +/-2 rows this round (round 3 showed +/-1 row is finer than the eye
// reliably resolves). Output: data/ygb_blind10_round4_scored.json.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ygb_blind10_round4.json'), 'utf8'));

const ray = {
  1: { dl: 7, t: 0.4 }, 2: { dl: 0, t: 0.325 }, 3: { dl: -7, t: 0.71 }, 4: { dl: -11, t: 0.45 }, 5: { dl: 3, t: 0.625 },
  6: { dl: 9, t: 0.6 }, 7: { dl: 8, t: 0.625 }, 8: { dl: 7, t: 0.65 }, 9: { dl: -4, t: 0.39 }, 10: { dl: 8, t: 0.61 },
};

const rows = answers.map((a) => {
  const r = ray[a.id];
  const realRow = Math.round(a.dL);
  return {
    id: a.id, name: a.name, range: a.range,
    realDL: a.dL, realRow, rayDL: r.dl, dlErr: r.dl - realRow,
    realT: +a.t.toFixed(3), rayT: r.t, tErr: +(r.t - a.t).toFixed(3),
    dE: a.dE,
  };
});
rows.sort((x, y) => x.id - y.id);

fs.writeFileSync(path.join(ROOT, 'data/ygb_blind10_round4_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'placements ->', path.join(ROOT, 'data/ygb_blind10_round4_scored.json'));

const TOLERANCE = 2;
const good = rows.filter((r) => Math.abs(r.dlErr) <= TOLERANCE);
const miss = rows.filter((r) => Math.abs(r.dlErr) > TOLERANCE);
console.log('within +/-' + TOLERANCE + ' rows:', good.length, '/', rows.length);
console.log('misses:', miss.map((r) => r.id + ' (' + r.name + ', err ' + r.dlErr + ')').join(', '));
