// Builds the "Unclassified" list: every never-fit pencil that lands in
// NONE of the model's five configured buckets (Fit/pure, Tint, Tone,
// Shade, Neutral), checked against the whole model (Level 1, Level 2,
// Level 3) via classify_never_fit_taxonomy.cjs's own category output.
// Built 2026-10-31 at Ray's request, as a companion to the three
// per-arc Fit/Tint/Shade/Won't-Fit exports (build_arc_fit_tint_shade_tabs.cjs) --
// this is the cross-arc residual those three don't cover, since each of
// them only looks at pencils plausibly near its own single arc.
//
// Run scripts/classify_never_fit_taxonomy.cjs first (or whenever the
// taxonomy itself changes, e.g. the 2026-10-31 Pastel-Adjacent neutral
// band) to refresh data/never_fit_taxonomy.json before running this.
//
// Output: data/exports/unclassified.json.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/never_fit_taxonomy.json'), 'utf8'));

const CONFIGURED = new Set([
  'tint (too light)',
  'shade (too dark)',
  'tone (same value, lower chroma than the pure arc colour)',
  'neutral (True Achromatic)',
  'neutral (Near-Neutral)',
  'neutral (Earth-Adjacent)',
  'neutral (Pastel-Adjacent)',
]);

const leftover = taxonomy.filter((r) => !CONFIGURED.has(r.category));

const rows = leftover.map((r) => ({
  name: r.name, range: r.range, munsell: r.munsell, hex: r.hex,
  dE: +r.minDist.toFixed(2), category: r.category,
  nearestArc: r.nearestArc || '', nearestLevel: r.nearestLevel || '',
})).sort((a, b) => a.category.localeCompare(b.category) || a.dE - b.dE);

fs.mkdirSync(path.join(ROOT, 'data/exports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/exports/unclassified.json'), JSON.stringify(rows, null, 2));
console.log('unclassified (not tint/tone/shade/neutral):', rows.length, '/', taxonomy.length);
const counts = {};
for (const r of rows) counts[r.category] = (counts[r.category] || 0) + 1;
for (const [c, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(' ', c, n);
