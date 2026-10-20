// Regenerates data/never_fit_final_153.json fresh from the CURRENT
// level1/2/3_pure_rows.json against the full measured pencil database.
//
// Found 2026-10-20 (Ray, spotted it): this file hadn't been regenerated
// since the Cool Yellow anchor correction (commit 6743cd1, 2026-10-15) --
// every anchor fix since (Warm Blue, Cool Blue, Cool Red) only re-ran the
// TAXONOMY CATEGORIZATION script against this same stale input list, never
// refreshed the underlying fit/no-fit determination itself. Confirmed via
// a direct example: Hooker's Green (Castle Arts Premium Soft Touch,
// #244038) sits at dE~14.8-14.9 to a Level 3 point under the current
// model -- genuinely caught (<=15.3) -- but was still carried in the
// taxonomy as "never fit / neutral (Earth-Adjacent)" because this file
// never got rebuilt after the anchors that rescued it moved. No script
// in the repo previously did this (the file was migrated whole from the
// pre-repo cloud session, see README's opening line) -- this script fills
// that gap so it can be rerun after every future anchor change.
//
// Scope and threshold match scripts/classify_coverage.cjs exactly: all 11
// ranges (9 book + 2 stress-test), checked against L1 union L2 first,
// falling back to L3 only if that misses, ΔE<=15.3.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require(path.join(__dirname, '../lib.cjs'));

const ROOT = path.join(__dirname, '..');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));

const BOOK_RANGES = [
  'Faber-Castell Polychromos 9201', 'Derwent Chromaflow Pencils', 'Derwent Lightfast Pencils',
  "Caran d'Ache Luminance 6901", "Caran d'Ache Pablo 666", "Holbein Artists' Colored Pencil",
  'Castle Arts Gold Coloured Pencils', 'Castle Arts Premium Soft Touch Colored Pencils',
  'Newell Brands Prismacolor Premier Soft Core Colored Pencils',
];
const EXTRA_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const allRanges = [...BOOK_RANGES, ...EXTRA_RANGES];
const THRESH = 15.3;

function loadPoints(levelData) {
  const pts = [];
  for (const k of Object.keys(levelData)) for (const p of levelData[k].points) pts.push(hexToLabD65(p.hex));
  return pts;
}
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const L2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level2_cross_rows.json'), 'utf8'));
const L3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level3_cross_rows.json'), 'utf8'));
const l12 = [...loadPoints(L1), ...loadPoints(L2)];
const l3 = loadPoints(L3);

function nearestDist(lab, arr) { let best = Infinity; for (const l of arr) { const d = labDist(lab, l); if (d < best) best = d; } return best; }

const pencils = Object.values(MASTER.pencils).filter(p => p.lab_d65_2 && allRanges.includes(p.brand_range));

const neverFit = [];
let fitCount = 0;
for (const p of pencils) {
  const d12 = nearestDist(p.lab_d65_2, l12);
  const best = d12 <= THRESH ? d12 : nearestDist(p.lab_d65_2, l3);
  if (best <= THRESH) { fitCount++; continue; }
  neverFit.push({
    maker: p.brand_range.split(' ')[0],
    range: p.brand_range,
    name: p.colour_name,
    munsell: p.munsell,
    hex: p.srgb_hex,
    minDist: d12, // nearest L1 union L2 distance, consistent with what classify_never_fit_taxonomy.cjs itself recomputes
  });
}

console.log('pencils scanned:', pencils.length, 'fit:', fitCount, 'never-fit:', neverFit.length);
fs.writeFileSync(path.join(ROOT, 'data/never_fit_final_153.json'), JSON.stringify(neverFit, null, 2));
