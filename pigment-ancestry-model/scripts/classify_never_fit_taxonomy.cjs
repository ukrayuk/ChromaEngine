const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require(require('path').join(__dirname, '../lib.cjs'));

const ROOT = require('path').join(__dirname, '..');
const neverFit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/never_fit_final_153.json')));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json')));
const L2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level2_cross_rows.json')));

function chroma(lab) { return Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]); }
function hueDeg(lab) { let h = Math.atan2(lab[2], lab[1]) * 180 / Math.PI; if (h < 0) h += 360; return h; }
function hueDiff(h1, h2) { const d = Math.abs(h1 - h2); return Math.min(d, 360 - d); }

const modelPoints = [];
for (const k of Object.keys(L1)) for (const p of L1[k].points) modelPoints.push(hexToLabD65(p.hex));
for (const k of Object.keys(L2)) for (const p of L2[k].points) modelPoints.push(hexToLabD65(p.hex));
for (const p of modelPoints) { p.C = chroma(p); p.H = hueDeg(p); }

function nearest(lab) {
  let best = Infinity, bestPt = null;
  for (const p of modelPoints) { const d = labDist(lab, p); if (d < best) { best = d; bestPt = p; } }
  return { d: best, pt: bestPt };
}

const results = neverFit.map(p => {
  const lab = hexToLabD65(p.hex);
  const C = chroma(lab), H = hueDeg(lab);
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

  return { ...p, L: lab[0], C, H, nearestL: pt[0], nearestC: pt.C, nearestH: pt.H, dL, dC, dH, category };
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
  if (r) console.log(' ', r.name.padEnd(20), r.hex, 'dE=' + r.minDist.toFixed(1), ' -> ', r.category, '  (dL=' + r.dL.toFixed(1) + ' dC=' + r.dC.toFixed(1) + ' dH=' + r.dH.toFixed(1) + ')');
}

fs.writeFileSync(path.join(ROOT, 'data/never_fit_taxonomy.json'), JSON.stringify(results, null, 2));
console.log();
console.log('written data/never_fit_taxonomy.json');
