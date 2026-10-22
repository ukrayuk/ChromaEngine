// Builds the ΔE ladder for a Level 1 pure arc: every integer lightness
// step from the exact arc colour out to +/-15, both directions (tint
// and shade), plus each currently-fitting pencil's real ΔL from its
// nearest arc point (not just its overall ΔE), so it can be placed on
// the correct rung rather than just "fits" or "doesn't."
//
// Grew out of Ray's "eureka" idea (2026-10-21/22): the blind-test bars
// only ever showed the exact arc colour as a single line, so a pencil
// that's a real ΔE=6.5 away had nowhere to visually sit -- this makes
// the whole tolerance structure visible, not just the two extremes.
// Also explains the edge-clustering from the outlier tracker directly:
// many different real pencils, genuinely spread across a wide ΔL range,
// all share the same t near an anchor because the arc has nowhere left
// to go in the direction that would serve their lightness -- it's hue
// similarity forcing a shared column, not a visualisation artefact.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist, mixSpectralTrueLab } = require(path.join(__dirname, '../lib.cjs'));

const ROOT = path.join(__dirname, '..');
const ARC_KEY = process.argv[2] || 'Yellow-Blue (Green)';
const OUT_PREFIX = process.argv[3] || 'ygb';
const MAX_STEP = 15;

const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const arc = L1[ARC_KEY].points;

function labToHex(lab) {
  return mixSpectralTrueLab(lab, mixSpectralTrueLab(lab, '#808080', 0.5), 0.001);
}

const arcLabs = arc.map(p => ({ t: p.t, lab: hexToLabD65(p.hex) }));

const ladder = {};
for (let s = 0; s <= MAX_STEP; s++) {
  ladder['tint_' + s] = arcLabs.map(p => ({ t: p.t, hex: labToHex([Math.min(100, p.lab[0] + s), p.lab[1], p.lab[2]]) }));
  ladder['shade_' + s] = arcLabs.map(p => ({ t: p.t, hex: labToHex([Math.max(0, p.lab[0] - s), p.lab[1], p.lab[2]]) }));
}
fs.writeFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_de_ladder.json'), JSON.stringify(ladder));
console.log('ladder written:', Object.keys(ladder).length, 'rows');

const BOOK_RANGES = [
  'Faber-Castell Polychromos 9201', 'Derwent Chromaflow Pencils', 'Derwent Lightfast Pencils',
  "Caran d'Ache Luminance 6901", "Caran d'Ache Pablo 666", "Holbein Artists' Colored Pencil",
  'Castle Arts Gold Coloured Pencils', 'Castle Arts Premium Soft Touch Colored Pencils',
  'Newell Brands Prismacolor Premier Soft Core Colored Pencils',
];
const EXTRA_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const allRanges = [...BOOK_RANGES, ...EXTRA_RANGES];
const THRESH = 15.3;

function nearestArcLab(lab) {
  let best = Infinity, bestP = null;
  for (const p of arcLabs) { const d = labDist(lab, p.lab); if (d < best) { best = d; bestP = p; } }
  return { ...bestP, dE: best };
}

const pencils = Object.values(MASTER.pencils).filter(p => p.lab_d65_2 && allRanges.includes(p.brand_range));
const fit = [];
for (const p of pencils) {
  const near = nearestArcLab(p.lab_d65_2);
  if (near.dE > THRESH) continue;
  fit.push({
    name: p.colour_name,
    range: p.brand_range,
    hex: p.srgb_hex,
    t: near.t,
    dL: Math.round((p.lab_d65_2[0] - near.lab[0]) * 10) / 10,
    dE: Math.round(near.dE * 100) / 100,
  });
}
fs.writeFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_fit_with_dl.json'), JSON.stringify(fit, null, 2));
console.log('fit-with-dL written:', fit.length, 'pencils');
