// Running catalogue of "outlier" pencils for the primary-arc investigation
// Ray and Claude started 2026-10-21: every never-fit pencil whose GOVERNING
// nearest model point (the taxonomy's own nearestArc, computed against the
// full L1+L2 pool) sits on a PURE Level 1 arc, not a cross -- crosses are
// deliberately left out for now since they're derived from the primaries
// and will shift automatically once an anchor moves. Each entry is tagged
// to whichever of the arc's two anchors it sits nearer to (by the matched
// point's own t: t<0.5 -> the t=0 anchor, t>=0.5 -> the t=1 anchor).
//
// Purpose: collect first, analyse once complete -- per Ray's call
// (2026-10-21), don't fix individual pencils ad hoc as they're found, or
// a fix for one quietly breaks another. This groups by the SIX individual
// anchors (not the three arcs), since that's the resolution an eventual
// anchor-nudge decision needs.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require(path.join(__dirname, '../lib.cjs'));

const ROOT = path.join(__dirname, '..');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/never_fit_taxonomy.json'), 'utf8'));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));

const ANCHOR_AT = {
  'Red-Yellow (Orange)': { 0: 'Warm Red', 1: 'Warm Yellow' },
  'Yellow-Blue (Green)': { 0: 'Cool Yellow', 1: 'Cool Blue' },
  'Blue-Red (Violet)': { 0: 'Warm Blue', 1: 'Cool Red' },
};

function pureArcPoints(arcKey) {
  return L1[arcKey].points.map(p => ({ t: p.t, lab: hexToLabD65(p.hex) }));
}
const pureArcs = {};
for (const key of Object.keys(ANCHOR_AT)) pureArcs[key] = pureArcPoints(key);

const tracker = { 'Warm Red': [], 'Warm Yellow': [], 'Cool Yellow': [], 'Cool Blue': [], 'Warm Blue': [], 'Cool Red': [] };

// Exclude categories that are already explained-and-closed (neutrals,
// chroma ceiling, structural limit already formalised) -- this tracker is
// for genuinely still-open outliers, consistent with the project's
// explained-vs-unexplained distinction used throughout.
const ALREADY_EXPLAINED = new Set([
  'neutral (True Achromatic)', 'neutral (Near-Neutral)', 'neutral (Earth-Adjacent)',
  'chroma ceiling (exceeds anchor maximum)',
  'structural limit (divergent path needed, cannot exist)',
]);

for (const entry of taxonomy) {
  if (ALREADY_EXPLAINED.has(entry.category)) continue;
  // Only entries whose GOVERNING match (the taxonomy's own nearestArc,
  // computed against the full L1+L2 pool) is a pure Level 1 arc -- not a
  // cross. Entries governed by a cross stay out of this round entirely,
  // per Ray's call to leave crosses until the primaries are settled.
  if (!Object.keys(ANCHOR_AT).includes(entry.nearestArc)) continue;

  const key = Object.keys(MASTER.pencils).find(
    k => MASTER.pencils[k].brand_range === entry.range && MASTER.pencils[k].colour_name === entry.name
  );
  if (!key) continue;
  const lab = MASTER.pencils[key].lab_d65_2;

  // re-find the nearest point WITHIN that specific arc to recover its t
  // (the taxonomy stores nearestL/nearestC/nearestH but not t or dE)
  let bestT = null, bestD = Infinity;
  for (const pt of pureArcs[entry.nearestArc]) {
    const d = labDist(lab, pt.lab);
    if (d < bestD) { bestD = d; bestT = pt.t; }
  }
  const anchor = ANCHOR_AT[entry.nearestArc][bestT < 0.5 ? 0 : 1];
  tracker[anchor].push({
    name: entry.name,
    range: entry.range,
    hex: entry.hex,
    category: entry.category,
    arc: entry.nearestArc,
    t: Math.round(bestT * 10000) / 10000,
    dE: Math.round(bestD * 100) / 100,
    munsell: entry.munsell,
    munsellC: entry.munsellC,
  });
}

for (const anchor of Object.keys(tracker)) {
  tracker[anchor].sort((a, b) => a.dE - b.dE);
}

console.log('Outlier tracker (pure-arc nearest, open categories only):');
for (const anchor of Object.keys(tracker)) {
  console.log(`  ${anchor}: ${tracker[anchor].length}`);
}

fs.writeFileSync(path.join(ROOT, 'data/outlier_tracker.json'), JSON.stringify(tracker, null, 2));
console.log('written data/outlier_tracker.json');
