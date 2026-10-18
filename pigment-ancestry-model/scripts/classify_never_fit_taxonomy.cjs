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
//
// Ceiling raised from 2.0 to 3.0 (Ray, 2026-10-15, by-eye review of the
// xlsx "Tints" table): several pencils in Munsell C 2-3 genuinely read as
// grey, not light/pastel (Steel Grey, Ice Blue, Winter Lake, Amethyst
// Grey, Payne's Grey 30%). Checked whether 2.5 would be a cleaner line
// than 3.0 instead -- it's worse: everything else in the 2.5-3.0 slice is
// real pastel (Seashell Pink, Zircon Red Bright, Peach Beige...), and a
// 2.5 ceiling would wrongly exclude Payne's Grey (mc=2.83) while still not
// catching the handful of grey-reading outliers that sit above 3.0 anyway
// (Ivory mc=3.33/3.51, Raisin mc=4.33) -- those need a hue-based check,
// not a tighter chroma line, left as a future refinement. Bands simplified
// to round 0-1/1-2/2-3 at the same time (previously 0-0.5/0.5-1.5/1.5-2.0).
function munsellChroma(m) { const parts = m.split('/'); return parseFloat(parts[parts.length - 1]); }
const NEUTRAL_BANDS = [
  { name: 'True Achromatic', lo: 0, hi: 1 },
  { name: 'Near-Neutral', lo: 1, hi: 2 },
  { name: 'Earth-Adjacent', lo: 2, hi: 3 },
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
  // Found 2026-10-15 (Ray): a couple of entries (Dark Sap Green, Walnut
  // Brown Light) were landing in "high-neon chroma" purely because their
  // NEAREST MATCH happened to be a near-grey point (nearestC < 12) -- not
  // because the pencil itself reads as vivid at all. Comparing dL/dC/dH
  // against a near-achromatic anchor is unreliable for ANY axis, not just
  // hue (the earlier fix only protected the "hue gap" label, leaving the
  // tint/shade/chroma fallback exposed to the same bad anchor). If the
  // matched point itself is too close to neutral to be a trustworthy
  // comparison baseline, call it a hue gap outright rather than make a
  // directional claim that isn't really about the pencil's own chroma.
  if (!hueIsMeaningful && pt.C <= 12) {
    return { ...p, L: lab[0], C, H, munsellC: mc, nearestL: pt[0], nearestC: pt.C, nearestH: pt.H, nearestLevel: pt.level, nearestArc: pt.arc, dL, dC, dH, category: 'hue gap (unreliable match)' };
  }
  let category;
  if (hueIsMeaningful && dH > 20 && Math.abs(dL) < 15 && Math.abs(dC) < 20) category = 'hue gap';
  // Found 2026-10-18 (Ray): spotted a cluster of pinks/mauves at the tint
  // tail of the review spreadsheet that didn't look like simple pastels.
  // Checked the full taxonomy for the same pattern (dH>20 but |dL|>=15, so
  // the clean "hue gap" rule above missed them because dL numerically wins
  // the tint/shade tiebreak below) -- found 29, not just the 2 Rose Pink
  // entries Ray flagged by eye. 27 of 29 match a Level 2 cross arc
  // (YgB x BvR, overwhelmingly), not a Level 1 arc -- this is a real,
  // concentrated gap in that one cross arc's light/pastel region, not
  // scattered noise. The old rule was burying a genuine hue problem under
  // a lightness label because dL happened to be the bigger number. All 29
  // are lighter than their match (dL>0 in every case so far) -- no shade-
  // side cases exist yet, but the category stays direction-aware in case
  // that changes.
  else if (hueIsMeaningful && dH > 20) category = 'hue gap + ' + (dL > 0 ? 'tint (too light)' : 'shade (too dark)') + ' (combo)';
  else if (Math.abs(dL) >= Math.abs(dC)) category = dL > 0 ? 'tint (too light)' : 'shade (too dark)';
  // Found 2026-10-15 (Ray): the project's own chapter structure is Tints,
  // Tones, Shades -- "tone" was missing from the taxonomy entirely. A tone
  // is the classic colour-theory third case: roughly the SAME value as
  // the matched colour, just lower chroma (distinct from tint = lighter,
  // shade = darker). Checked the real data: 7 of the 14 "undersaturated"
  // entries have |dL|<5 (same value) with substantial negative dC (e.g.
  // Dandelion dL=0.0 dC=-18.8, Pineapple dL=3.5 dC=-20.4) -- genuine tones
  // of the Cadmium Yellow anchor family. The other 7 "undersaturated"
  // entries have larger |dL| and are more tint-like, correctly left there.
  else if (dC < -5 && Math.abs(dL) < 5) category = 'tone (same value, lower chroma than the pure arc colour)';
  // Found 2026-10-15 (Ray): the mirror-image of the hue-gap-unreliable-match
  // bug. A pencil with real, substantial chroma (Golden Yellow, Mustard,
  // Butterscotch -- C 49-69) was landing in "low chroma (too muted/grey)"
  // purely because its nearest match was an even MORE vivid anchor point
  // (C 68-82, right where the Cadmium Yellow anchors sit). "Too muted/grey"
  // is a visually false description of a saturated gold/ochre pencil --
  // it's relatively less saturated than an extreme anchor, not muted in
  // any absolute sense. Clean split in the real data: genuinely muted
  // pencils (Violet Grey, Wheat, Ivory, Raisin...) top out at C=27.3; the
  // false positives start at C=48.8 -- no ambiguous middle ground, so C=35
  // is a safe line between them.
  // Found 2026-10-15 (Ray): exact mirror of the oversaturated->shade fix
  // below, applied here too. Of the 7 remaining "undersaturated" entries,
  // 6 (Cream, Golden Yellow x2, Lemon Yellow Light, Naples Yellow, Deco
  // Yellow) are LIGHTER than their matched point (dL>0), not just less
  // saturated -- and "lighter + less saturated" is exactly the tint
  // pattern already documented in this taxonomy (tints trend less
  // saturated as they lighten). These are tints, not a separate category.
  // Only Mustard (dL=-9.1, darker AND less saturated) doesn't fit the
  // tint pattern or the shade pattern (shades that gain chroma darkening)
  // -- stays "undersaturated" as the one entry that's genuinely its own
  // case so far.
  else if (dC < 0 && C >= 35 && dL > 0) category = 'tint (too light)';
  else if (dC < 0 && C >= 35) category = 'undersaturated (vivid pencil, anchor nearby is more vivid still)';
  // Found 2026-10-15 (Ray): the mirror of the fix above, on the high-chroma
  // side. Holly Green, Ice Blue, Pthalo Green Light, Peacock Green (Munsell
  // C 6.5-9.44, Lab C 29-38) were landing in "high-neon chroma" purely
  // because their matched point was even LESS saturated -- but by Munsell
  // terms (the scale that's tracked "does this look vivid" reliably all
  // along) they're only moderately saturated, not genuinely high/neon
  // chroma. Clean gap in the real data: 9.44 (Peacock Green) to 10.28
  // (Perylene Brown), so Munsell C<10 is the line. Gated on Lab C<50 too,
  // so this doesn't catch Neon Yellow (Munsell C=5.28, but Lab C=92.7 --
  // its own Munsell reading is separately known to be broken, likely from
  // fluorescence, and its Lab chroma genuinely exceeds the model's own
  // maximum of 87.3, so it stays correctly "too saturated" regardless).
  // Found 2026-10-15 (Ray): within that same group, all 4 real members
  // (Holly Green, Ice Blue, Pthalo Green Light, Peacock Green) are ALSO
  // darker than their matched point (dL<0). Checked whether Munsell Value
  // alone could explain this instead -- it can't: the legitimately vivid
  // "high-neon chroma" entries (Fra Angelico Blue, Perylene Brown,
  // Ultramarine, Mauve Deep, Violet Blue) are JUST as dark by Munsell
  // Value (2.66-4.24, same range) but genuinely vivid (Lab C 52-75, vs
  // 29-38 here) -- so darkness alone isn't the signal, it only matters
  // within this already-narrow moderate-chroma group. When a pencil here
  // is also darker than its match, "shade" is the more honest read than
  // "oversaturated" -- matches the documented shade asymmetry (some
  // shades need more saturation at the dark end, not less darkness).
  else if (dC > 0 && mc < 10 && C < 50 && dL < 0) category = 'shade (too dark)';
  else if (dC > 0 && mc < 10 && C < 50) category = 'oversaturated (moderate pencil, anchor nearby is even less saturated)';
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
