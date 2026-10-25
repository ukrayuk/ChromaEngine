// Scores Ray's third blind-validation round (2026-10-25) against the
// answer key for the 25 pencils selected in data/ygb_blind25_round3.json.
// Ray placed each by eye on the blank --clean ΔE ladder as a (row, t)
// coordinate; this compares his call to the model's real nearest-arc
// dL/t for that pencil. Output: data/ygb_blind25_round3_scored.json.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ygb_blind25_round3.json'), 'utf8'));

const ray = {
  1: { dl: 5, t: 0 }, 2: { dl: 3, t: 0.04 }, 3: { dl: 9, t: 0.65 }, 4: { dl: -1, t: 1 }, 5: { dl: 8, t: 0.53 },
  6: { dl: 4, t: 0.78 }, 7: { dl: -5, t: 0.68 }, 8: { dl: 7, t: 1 }, 9: { dl: 10, t: 0.16 }, 10: { dl: -5, t: 0.35 },
  11: { dl: 2, t: 0.75 }, 12: { dl: -2, t: 0.03 }, 13: { dl: -10, t: 0.4 }, 14: { dl: 4, t: 0.55 }, 15: { dl: 1, t: 0.71 },
  16: { dl: 4, t: 0.99 }, 17: { dl: -3, t: 0.76 }, 18: { dl: 5, t: 0.925 }, 19: { dl: 0, t: 0.185 }, 20: { dl: -6, t: 0 },
  21: { dl: -13, t: 0.49 }, 22: { dl: 4, t: 0 }, 23: { dl: -10, t: 0.235 }, 24: { dl: 2, t: 0 }, 25: { dl: -14, t: 0.25 },
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

fs.writeFileSync(path.join(ROOT, 'data/ygb_blind25_round3_scored.json'), JSON.stringify(rows, null, 2));
console.log('scored', rows.length, 'placements ->', path.join(ROOT, 'data/ygb_blind25_round3_scored.json'));

const good = rows.filter((r) => Math.abs(r.dlErr) <= 1 && Math.abs(r.tErr) <= 0.05);
const big = rows.filter((r) => Math.abs(r.dlErr) >= 4);
console.log('good (dL<=1, t<=0.05):', good.length, '/', rows.length);
console.log('big dL misses (>=4):', big.map((r) => r.id).join(', '));
