const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require(require('path').join(__dirname, '../lib.cjs'));

const ROOT = require('path').join(__dirname, '..');
// Derwent Drawing Pencils and Castle Arts Harmonious Collection were only
// ever added as a stress test, to see whether the model passed over the
// muted end of real pigments (it mostly did) -- not part of the book's 9
// ranges, and Ray's call (2026-10-15): drop them from this analysis.
// Dropping them lands exactly on the book-scope never-fit count (379 =
// 1150 book-scope total - 771 book-scope fit), confirming that's all they
// were contributing here.
const DROPPED_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const neverFit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/never_fit_final_153.json')))
  .filter(p => !DROPPED_RANGES.includes(p.range));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json')));
const L2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level2_cross_rows.json')));

function chroma(lab) { return Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]); }
function hueDeg(lab) { let h = Math.atan2(lab[2], lab[1]) * 180 / Math.PI; if (h < 0) h += 360; return h; }
function hueDiff(h1, h2) { const d = Math.abs(h1 - h2); return Math.min(d, 360 - d); }
// Munsell chroma (the number after the '/' in "0.57PB 6.14/0.64") is a much
// better basis for "is this neutral" than Lab C -- it already tracks how a
// human reads near-achromatic pigments. Checked against real data (Ray,
// 2026-10-15): Lab C alone is unreliable both ways (Rose Grey is Lab C=39
// despite the name; Graphite/Ash/Moonstone are genuinely near-neutral at
// Lab C=2-4 despite not being named "grey" at all). A cool/warm hue split
// within the neutral bands was tested and didn't hold up against the real
// hue-family distribution -- dropped, bands are chroma-only.
function munsellChroma(m) { const parts = m.split('/'); return parseFloat(parts[parts.length - 1]); }
const NEUTRAL_BANDS = [
  { name: 'True Achromatic', lo: 0, hi: 0.5 },
  { name: 'Near-Neutral', lo: 0.5, hi: 1.5 },
  { name: 'Earth-Adjacent', lo: 1.5, hi: 2.0 },
];
function neutralBand(mc) {
  for (const b of NEUTRAL_BANDS) if (mc > b.lo && mc <= b.hi) return b.name;
  return null;
}

const modelPoints = [];
for (const k of Object.keys(L1)) for (const p of L1[k].points) { const lab = hexToLabD65(p.hex); modelPoints.push(Object.assign(lab, { level: 'L1', arc: k })); }
for (const k of Object.keys(L2)) for (const p of L2[k].points) { const lab = hexToLabD65(p.hex); modelPoints.push(Object.assign(lab, { level: 'L2', arc: k })); }
for (const p of modelPoints) { p.C = chroma(p); p.H = hueDeg(p); }

function nearest(lab) {
  let best = Infinity, bestPt = null;
  for (const p of modelPoints) { const d = labDist(lab, p); if (d < best) { best = d; bestPt = p; } }
  return { d: best, pt: bestPt };
}

const results = neverFit.map(p => {
  const lab = hexToLabD65(p.hex);
  const C = chroma(lab), H = hueDeg(lab);
  const mc = munsellChroma(p.munsell);
  const band = neutralBand(mc);

  // Neutral check runs FIRST, on Munsell chroma, before any nearest-point
  // comparison -- a pencil this close to achromatic shouldn't be judged by
  // hue or Lab-C at all (both are unstable/misleading near the neutral
  // axis, which is exactly why White/Black/Platinum/Storm Gray etc. were
  // previously falling into "tint"/"shade"/"hue gap" by coincidence).
  if (band) {
    return { ...p, L: lab[0], C, H, munsellC: mc, category: 'neutral (' + band + ')' };
  }

  const { pt } = nearest(lab);
  const dL = lab[0] - pt[0];
  const dC = C - pt.C;
  const dH = hueDiff(H, pt.H);

  // Classify by whichever axis dominates the gap to the nearest model point.
  // Hue angle is numerically unstable near the neutral axis (a tiny a*/b*
  // swings H by tens of degrees for no real perceptual reason), so only
  // trust "hue gap" as a category when BOTH the pencil and its nearest
  // point actually have enough chroma for hue to mean anything.
  const hueIsMeaningful = C > 12 && pt.C > 12;
  let category;
  if (hueIsMeaningful && dH > 20 && Math.abs(dL) < 15 && Math.abs(dC) < 20) category = 'hue gap';
  else if (Math.abs(dL) >= Math.abs(dC)) category = dL > 0 ? 'tint (too light)' : 'shade (too dark)';
  else category = dC > 0 ? 'high-neon chroma (too saturated)' : 'low chroma (too muted/grey)';

  return { ...p, L: lab[0], C, H, munsellC: mc, nearestL: pt[0], nearestC: pt.C, nearestH: pt.H, nearestLevel: pt.level, nearestArc: pt.arc, dL, dC, dH, category };
});

const counts = {};
for (const r of results) counts[r.category] = (counts[r.category] || 0) + 1;
console.log('=== Never-fit taxonomy (n=' + results.length + ') ===');
for (const [cat, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(' ', cat.padEnd(35), n, '(' + (100 * n / results.length).toFixed(1) + '%)');
}

console.log();
console.log('=== Cross-check against Ray\'s Caran d\'Ache Luminance spreadsheet ===');
const checkNames = ['Violet', 'Dark Sap Green', 'Sepia 10%', 'Payne\'s Grey 30%', 'French Grey 10%', 'Burnt Sienna 10%', 'Grass Green', 'Ice Blue'];
for (const name of checkNames) {
  const r = results.find(x => x.range.includes('Luminance') && x.name === name);
  if (r) {
    const detail = r.dL !== undefined ? '  (dL=' + r.dL.toFixed(1) + ' dC=' + r.dC.toFixed(1) + ' dH=' + r.dH.toFixed(1) + ')' : '  (munsellC=' + r.munsellC.toFixed(2) + ')';
    console.log(' ', r.name.padEnd(20), r.hex, 'dE=' + r.minDist.toFixed(1), ' -> ', r.category, detail);
  }
}

fs.writeFileSync(path.join(ROOT, 'data/never_fit_taxonomy.json'), JSON.stringify(results, null, 2));
console.log();
console.log('written data/never_fit_taxonomy.json');
