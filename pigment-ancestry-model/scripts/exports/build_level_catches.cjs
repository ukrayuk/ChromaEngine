// Rebuilds the "Level catches" export (Level 1 / Level 2 / Level 3
// sheets) against the CURRENT model, reproducing an earlier one-off
// version from before several anchor fixes. A pencil lands on whichever
// sheet is the EARLIEST level that catches it (L1 first, then L2, then
// L3) -- matches classify_coverage.cjs's own "L1 union L2 first,
// falling back to L3" scope exactly. Never-fit pencils (caught at none
// of the three) are handled by the separate taxonomy/unclassified
// exports, not here.
// Output: data/exports/level_catches.json ({level1, level2, level3}).
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('../../lib.cjs');

const ROOT = path.join(__dirname, '../..');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const L2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level2_cross_rows.json'), 'utf8'));
const L3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level3_cross_rows.json'), 'utf8'));
const THRESH = 15.3;

function loadLevel(levelData) {
  const out = [];
  for (const key of Object.keys(levelData)) {
    for (const p of levelData[key].points) out.push({ arc: key, t: p.t, lab: hexToLabD65(p.hex) });
  }
  return out;
}
const l1Points = loadLevel(L1);
const l2Points = loadLevel(L2);
const l3Points = loadLevel(L3);

function nearest(lab, points) {
  let best = Infinity, bestPt = null;
  for (const p of points) { const d = labDist(lab, p.lab); if (d < best) { best = d; bestPt = p; } }
  return { dE: best, pt: bestPt };
}

const BOOK_RANGES = [
  'Faber-Castell Polychromos 9201', 'Derwent Chromaflow Pencils', 'Derwent Lightfast Pencils',
  "Caran d'Ache Luminance 6901", "Caran d'Ache Pablo 666", "Holbein Artists' Colored Pencil",
  'Castle Arts Gold Coloured Pencils', 'Castle Arts Premium Soft Touch Colored Pencils',
  'Newell Brands Prismacolor Premier Soft Core Colored Pencils',
];
const EXTRA_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const allRanges = [...BOOK_RANGES, ...EXTRA_RANGES];
const pencils = Object.values(MASTER.pencils).filter((p) => p.lab_d65_2 && allRanges.includes(p.brand_range));

const level1 = [], level2 = [], level3 = [];
for (const p of pencils) {
  const n1 = nearest(p.lab_d65_2, l1Points);
  if (n1.dE <= THRESH) {
    level1.push({ name: p.colour_name, range: p.brand_range, munsell: p.munsell, hex: p.srgb_hex, dE: +n1.dE.toFixed(2), desc: n1.pt.arc + ', t=' + n1.pt.t.toFixed(4) + ' (L1)' });
    continue;
  }
  const n2 = nearest(p.lab_d65_2, l2Points);
  if (n2.dE <= THRESH) {
    level2.push({ name: p.colour_name, range: p.brand_range, munsell: p.munsell, hex: p.srgb_hex, dE: +n2.dE.toFixed(2), desc: n2.pt.arc + ', t=' + n2.pt.t.toFixed(4) + ' (L2)' });
    continue;
  }
  const n3 = nearest(p.lab_d65_2, l3Points);
  if (n3.dE <= THRESH) {
    level3.push({ name: p.colour_name, range: p.brand_range, munsell: p.munsell, hex: p.srgb_hex, dE: +n3.dE.toFixed(2), desc: n3.pt.arc + ', t=' + n3.pt.t.toFixed(4) + ' (L3)' });
  }
}
level1.sort((a, b) => a.dE - b.dE);
level2.sort((a, b) => a.dE - b.dE);
level3.sort((a, b) => a.dE - b.dE);

fs.mkdirSync(path.join(ROOT, 'data/exports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/exports/level_catches.json'), JSON.stringify({ level1, level2, level3 }, null, 2));
console.log('Level 1:', level1.length, '| Level 2:', level2.length, '| Level 3:', level3.length, '| total caught:', level1.length + level2.length + level3.length, '/', pencils.length);
