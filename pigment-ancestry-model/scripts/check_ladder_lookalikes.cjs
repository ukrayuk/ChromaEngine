// Checks whether an arc-length ladder contains "lookalike" cells --
// two positions (a different row AND a substantially different u) that
// are colorimetrically close enough to be confused for each other by
// eye. Built 2026-10-31 after Ray asked, following a rough RoY round,
// whether a swatch could visually "disappear" at the wrong spot
// because that spot genuinely looks like a near-duplicate of the
// correct one elsewhere on the ladder.
//
// Result on Red-Yellow (Orange), 2026-10-31: zero matches under dE 4
// anywhere in a dense grid (every row x every 0.02 of u) once same/
// adjacent rows and nearby u are excluded -- every position on the
// ladder is colorimetrically unique. So "it disappeared into the
// background at the wrong spot" isn't a data/duplicate-colour problem;
// it's that a smooth gradient lets a swatch blend acceptably across a
// RANGE of nearby cells, not just the one exact match -- "blends in"
// confirms the right neighbourhood, not the exact row/u.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('./../lib.cjs');

const ROOT = path.join(__dirname, '..');
const ARC_KEY = process.argv[2] || 'Red-Yellow (Orange)';
const DE_THRESHOLD = parseFloat(process.argv[3]) || 4;
const MIN_ROW_GAP = parseInt(process.argv[4], 10) || 2;
const MIN_U_GAP = parseFloat(process.argv[5]) || 0.15;

const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const arc = L1[ARC_KEY].points.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

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

const rows = [];
for (let r = -15; r <= 15; r++) rows.push(r);
const us = [];
for (let u = 0; u <= 1.0001; u += 0.02) us.push(+u.toFixed(2));

const cells = [];
for (const r of rows) for (const u of us) {
  const base = labAtU(u);
  cells.push({ row: r, u, lab: [Math.max(0, Math.min(100, base[0] + r)), base[1], base[2]] });
}

let count = 0;
const examples = [];
for (const c of cells) {
  let best = Infinity, bestOther = null;
  for (const o of cells) {
    if (Math.abs(o.row - c.row) < MIN_ROW_GAP) continue;
    if (Math.abs(o.u - c.u) < MIN_U_GAP) continue;
    const d = labDist(c.lab, o.lab);
    if (d < best) { best = d; bestOther = o; }
  }
  if (best < DE_THRESHOLD) { count++; examples.push({ cell: c, other: bestOther, dE: best }); }
}

console.log(ARC_KEY + ': cells with a lookalike (dE<' + DE_THRESHOLD + ') at least ' + MIN_ROW_GAP + ' rows and ' + MIN_U_GAP + ' u away:', count, '/', cells.length);
examples.sort((a, b) => a.dE - b.dE);
for (const e of examples.slice(0, 20)) {
  console.log('row=' + e.cell.row + ',u=' + e.cell.u, '<->', 'row=' + e.other.row + ',u=' + e.other.u, 'dE=' + e.dE.toFixed(2));
}
