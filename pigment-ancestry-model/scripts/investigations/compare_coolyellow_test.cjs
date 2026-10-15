const fs = require('fs');
const { hexToLabD65, labDist } = require('../../lib.cjs');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));

const BOOK_RANGES = [
  'Faber-Castell Polychromos 9201', 'Derwent Chromaflow Pencils', 'Derwent Lightfast Pencils',
  "Caran d'Ache Luminance 6901", "Caran d'Ache Pablo 666", "Holbein Artists' Colored Pencil",
  'Castle Arts Gold Coloured Pencils', 'Castle Arts Premium Soft Touch Colored Pencils',
  'Newell Brands Prismacolor Premier Soft Core Colored Pencils',
];
const EXTRA_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const THRESH = 15.3;
const allRanges = [...BOOK_RANGES, ...EXTRA_RANGES];

function loadModel(l1file, l2file, l3file) {
  const L1 = JSON.parse(fs.readFileSync(l1file, 'utf8'));
  const L2 = JSON.parse(fs.readFileSync(l2file, 'utf8'));
  const L3 = JSON.parse(fs.readFileSync(l3file, 'utf8'));
  const l12 = [];
  for (const key of Object.keys(L1)) for (const p of L1[key].points) l12.push(hexToLabD65(p.hex));
  for (const key of Object.keys(L2)) for (const p of L2[key].points) l12.push(hexToLabD65(p.hex));
  const l3 = [];
  for (const key of Object.keys(L3)) for (const p of L3[key].points) l3.push(hexToLabD65(p.hex));
  return { l12, l3 };
}
function nearestDist(lab, arr) { let best = Infinity; for (const l of arr) { const d = labDist(lab, l); if (d < best) best = d; } return best; }
function classify(model, ranges) {
  let total = 0, fit = 0;
  const perRange = {};
  for (const range of ranges) {
    const entries = Object.values(MASTER.pencils).filter(p => p.lab_d65_2 && p.brand_range === range);
    let rFit = 0;
    for (const p of entries) {
      total++;
      const d12 = nearestDist(p.lab_d65_2, model.l12);
      const best = d12 <= THRESH ? d12 : nearestDist(p.lab_d65_2, model.l3);
      if (best <= THRESH) { fit++; rFit++; }
    }
    perRange[range] = { fit: rFit, total: entries.length };
  }
  return { total, fit, perRange };
}

const canonical = loadModel('../../data/level1_pure_rows.json', '../../data/level2_cross_rows.json', '../../data/level3_cross_rows.json');
const canonicalBook = classify(canonical, BOOK_RANGES);
const canonicalAll = classify(canonical, allRanges);
console.log('=== Canonical (Cool Yellow = Lemon Cadmium #f6e83b) ===');
console.log('Book-scope:', canonicalBook.fit, '/', canonicalBook.total, '(' + (100*canonicalBook.fit/canonicalBook.total).toFixed(1) + '%)');
console.log('Combined  :', canonicalAll.fit, '/', canonicalAll.total, '(' + (100*canonicalAll.fit/canonicalAll.total).toFixed(1) + '%)');
console.log();

for (const key of ['lemonlime', 'luminance', 'limegreen', 'lime']) {
  const test = loadModel(`../../data/coolyellow_candidates/level1_test_coolyellow_${key}_rows.json`, `../../data/coolyellow_candidates/level2_test_coolyellow_${key}_rows.json`, `../../data/coolyellow_candidates/level3_test_coolyellow_${key}_rows.json`);
  const testBook = classify(test, BOOK_RANGES);
  const testAll = classify(test, allRanges);
  console.log(`=== TEST (${key}) ===`);
  console.log('Book-scope:', testBook.fit, '/', testBook.total, '(' + (100*testBook.fit/testBook.total).toFixed(1) + '%)', ' delta vs canonical:', (testBook.fit-canonicalBook.fit>=0?'+':'')+(testBook.fit-canonicalBook.fit));
  console.log('Combined  :', testAll.fit, '/', testAll.total, '(' + (100*testAll.fit/testAll.total).toFixed(1) + '%)', ' delta vs canonical:', (testAll.fit-canonicalAll.fit>=0?'+':'')+(testAll.fit-canonicalAll.fit));
  console.log('Per-range deltas:');
  for (const range of allRanges) {
    const c = canonicalAll.perRange[range], t = testAll.perRange[range];
    const delta = t.fit - c.fit;
    if (delta !== 0) console.log('  ', range.padEnd(50), 'canonical:', String(c.fit).padStart(3)+'/'+c.total, '  test:', String(t.fit).padStart(3)+'/'+t.total, '  delta:', (delta>=0?'+':'')+delta);
  }
  console.log();
}
