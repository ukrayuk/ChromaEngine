// Computes the coverage trade-off Ray asked about on 2026-10-25: the
// cost of tightening the fit threshold from 15.3 to the long-flagged
// ΔE≈11 crossover point, against the gain of widening it to 20, with a
// check for ambiguity against a neighbouring primary arc at the wider
// radius (does a newly-caught pencil also fall within 20 of a second
// arc?). Run per primary arc and totalled, book+extra scope by default.
const { hexToLabD65, labDist } = require('../lib.cjs');
const MASTER = require('/home/user/chromaengine/data/master.json');
const L1 = require('../data/level1_pure_rows.json');

const ARC_KEYS = ['Red-Yellow (Orange)', 'Yellow-Blue (Green)', 'Blue-Red (Violet)'];
const arcs = {};
for (const k of ARC_KEYS) arcs[k] = L1[k].points.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

function nearestOnArc(lab, arcPts) {
  let best = Infinity, bestT = null;
  for (const p of arcPts) { const d = labDist(lab, p.lab); if (d < best) { best = d; bestT = p.t; } }
  return { dE: best, t: bestT };
}

const BOOK_RANGES = [
  'Faber-Castell Polychromos 9201', 'Derwent Chromaflow Pencils', 'Derwent Lightfast Pencils',
  "Caran d'Ache Luminance 6901", "Caran d'Ache Pablo 666", "Holbein Artists' Colored Pencil",
  'Castle Arts Gold Coloured Pencils', 'Castle Arts Premium Soft Touch Colored Pencils',
  'Newell Brands Prismacolor Premier Soft Core Colored Pencils',
];
const EXTRA_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const FULL_SCOPE = process.argv.includes('--full');
const bookScope = new Set([...BOOK_RANGES, ...EXTRA_RANGES]);

const pencils = Object.values(MASTER.pencils).filter((p) => p.lab_d65_2 && (FULL_SCOPE || bookScope.has(p.brand_range)));

const results = [];
for (const p of pencils) {
  const perArc = ARC_KEYS.map((k) => ({ arc: k, ...nearestOnArc(p.lab_d65_2, arcs[k]) }));
  perArc.sort((a, b) => a.dE - b.dE);
  results.push({ name: p.colour_name, range: p.brand_range, home: perArc[0].arc, homeDE: perArc[0].dE, secondArc: perArc[1].arc, secondDE: perArc[1].dE });
}

console.log('scope:', FULL_SCOPE ? 'full master.json' : 'book+extra', '| n =', results.length);
for (const arcKey of ARC_KEYS) {
  const home = results.filter((r) => r.home === arcKey);
  const at11 = home.filter((r) => r.homeDE <= 11).length;
  const at153 = home.filter((r) => r.homeDE <= 15.3).length;
  const at20 = home.filter((r) => r.homeDE <= 20).length;
  const newly20 = home.filter((r) => r.homeDE > 15.3 && r.homeDE <= 20);
  const ambiguous20 = newly20.filter((r) => r.secondDE <= 20);
  console.log(arcKey + ':', '<=11:', at11, ' <=15.3:', at153, ' <=20:', at20, ' newly-20:', newly20.length, ' ambiguous:', ambiguous20.length);
  if (ambiguous20.length) console.log('  ambiguous:', ambiguous20.map((r) => r.name + ' (' + r.range + ')').join(', '));
}
