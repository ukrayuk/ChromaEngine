// Groups the pencils that drop off the pure Yellow-Blue arc if the fit
// threshold tightens from 15.3 to 11, by pigment family, to check whether
// the drop-out is a coherent population or scattered noise.
// Ray and Claude, 2026-10-21 -- found it's 82% one coherent cyan/teal/
// green pigment-chemistry cluster, same population as the Phthalo-arc
// investigation from the day before.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require(path.join(__dirname, '../lib.cjs'));

const ROOT = path.join(__dirname, '..');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));

const BOOK_RANGES = [
  'Faber-Castell Polychromos 9201', 'Derwent Chromaflow Pencils', 'Derwent Lightfast Pencils',
  "Caran d'Ache Luminance 6901", "Caran d'Ache Pablo 666", "Holbein Artists' Colored Pencil",
  'Castle Arts Gold Coloured Pencils', 'Castle Arts Premium Soft Touch Colored Pencils',
  'Newell Brands Prismacolor Premier Soft Core Colored Pencils',
];
const EXTRA_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const allRanges = [...BOOK_RANGES, ...EXTRA_RANGES];

const TIGHT_THRESH = 11;
const CURRENT_THRESH = 15.3;

function pureArcPoints(key) { return L1[key].points.map(p => ({ t: p.t, lab: hexToLabD65(p.hex) })); }
const arc = pureArcPoints('Yellow-Blue (Green)');
function nearestOnArc(lab) {
  let best = Infinity, bestT = null;
  for (const pt of arc) { const d = labDist(lab, pt.lab); if (d < best) { best = d; bestT = pt.t; } }
  return { d: best, t: bestT };
}

const pencils = Object.values(MASTER.pencils).filter(p => p.lab_d65_2 && allRanges.includes(p.brand_range));
const dropout = pencils
  .map(p => ({ name: p.colour_name, range: p.brand_range, hex: p.srgb_hex, ...nearestOnArc(p.lab_d65_2) }))
  .filter(r => r.d > TIGHT_THRESH && r.d <= CURRENT_THRESH)
  .sort((a, b) => a.d - b.d);

const CYAN_RE = /teal|turquoise|cerulean|phthalo|cobalt (turquoise|blue)|aqua|peacock|spectrum blue|bluish|ultramarine|blue yonder|blue orchid|blue violet lake|sky blue|non- photo/i;
const GREEN_RE = /green|malachite|evergreen|pine|parrot/i;
const YELLOW_RE = /lemon|canary/i;

const groups = { 'cyan/teal/turquoise/phthalo/cerulean': [], 'green': [], 'yellow (near Cool Yellow anchor)': [], 'other': [] };
for (const r of dropout) {
  if (CYAN_RE.test(r.name)) groups['cyan/teal/turquoise/phthalo/cerulean'].push(r);
  else if (GREEN_RE.test(r.name)) groups['green'].push(r);
  else if (YELLOW_RE.test(r.name)) groups['yellow (near Cool Yellow anchor)'].push(r);
  else groups['other'].push(r);
}

console.log('Threshold drop-out (YgB pure arc, 11 < dE <= 15.3): ' + dropout.length + ' total');
for (const g of Object.keys(groups)) console.log('  ' + g + ': ' + groups[g].length);

fs.writeFileSync(path.join(ROOT, 'data/threshold_dropout_ygb.json'), JSON.stringify(groups, null, 2));
console.log('written data/threshold_dropout_ygb.json');
