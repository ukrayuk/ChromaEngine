// Builds the data behind the per-arc "Fit / Tint / Shade / Won't Fit"
// spreadsheets (2026-10-31, at Ray's request, reproducing and
// correcting an earlier one-off Green Arc export). Four tabs per arc:
//   - Fit: every pencil within the dE<=15.3 fit threshold.
//   - Tint / Shade: never-fit pencils whose own HSL lightness sits
//     beyond the per-anchor tint/shade threshold (data/anchor_thresholds.json,
//     linearly interpolated between the arc's two anchors by t), checked
//     only after a hue-gap pre-filter (see below).
//   - Won't Fit: the rest -- hue-gap failures, or lightness that's
//     actually normal for the anchor (so the failure is something else:
//     chroma, etc).
//
// Three corrections made after the first pass, all from Ray spotting
// real problems in the output:
//
// 0. Neutral pre-check (2026-10-31, same day as the Pastel-Adjacent
//    band was added to classify_never_fit_taxonomy.cjs): a never-fit
//    pencil within the neutral chroma bands (Munsell C<=4) is its own
//    separate category, not a tint/shade/won't-fit of any one arc --
//    excluded here the same way, checked first, before the hue-gap
//    pre-filter below.
//
// 1. Hue-gap pre-filter: a never-fit pencil whose nearest-arc-point gap
//    is dominated by HUE (dH>20, both sides meaningfully chromatic) was
//    initially being run through the tint/shade lightness test anyway,
//    which classified roughly half of Yellow-Blue's never-fit pool as
//    tint/shade even though hue, not lightness, was the real failure
//    reason. Matches the dominant-axis logic already established in
//    classify_never_fit_taxonomy.cjs.
//
// 2. Plausibility cutoff (dE<=30, ~2x the fit threshold): a never-fit
//    pencil was originally force-assigned to whichever of the three
//    primary arcs it was LEAST far from, even when that distance was
//    enormous (40-90+ dE) -- e.g. Light Mauve and Copper landing in the
//    Yellow-Blue tabs purely because they were even further from the
//    other two arcs, not because they're remotely green. Confirmed via
//    the real distribution: the MEDIAN best-of-3-arcs distance among all
//    344 never-fit pencils is 34.4 dE, so "nearest of three" alone is
//    meaningless for most of the never-fit pool. Below dE=30 is kept;
//    above it, the pencil doesn't appear in ANY of the three arcs'
//    spreadsheets at all (see build_unclassified_sheet.cjs for where
//    these end up instead).
//
// Scope: book+extra ranges (1294 pencils) for the Fit tabs; the never-fit
// source is data/never_fit_final_153.json (already checked against the
// WHOLE model -- Level 1, Level 2, and Level 3 -- not just the three
// primary arcs), with the same dropped-ranges/fluorescent exclusions
// classify_never_fit_taxonomy.cjs applies.
//
// Output: data/exports/<prefix>_fit_tint_shade.json per arc (roy/ygb/bvr).
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('../../lib.cjs');

const ROOT = path.join(__dirname, '../..');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const thresholds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/anchor_thresholds.json'), 'utf8')).anchors;
const neverFit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/never_fit_final_153.json'), 'utf8'));

function chroma(lab) { return Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]); }
function hueDeg(lab) { let h = Math.atan2(lab[2], lab[1]) * 180 / Math.PI; if (h < 0) h += 360; return h; }
function hueDiff(h1, h2) { const d = Math.abs(h1 - h2); return Math.min(d, 360 - d); }
function hslL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return (max + min) / 2 * 100;
}
function thresholdVal(v) { return Array.isArray(v) ? (v[0] + v[1]) / 2 : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function munsellChroma(m) { const parts = m.split('/'); return parseFloat(parts[parts.length - 1]); }
const NEUTRAL_CEILING = 4; // matches classify_never_fit_taxonomy.cjs's Pastel-Adjacent band, 2026-10-31

const ARC_DEF = {
  'Red-Yellow (Orange)': { prefix: 'roy', a1: 'Warm Red', a2: 'Warm Yellow' },
  'Yellow-Blue (Green)': { prefix: 'ygb', a1: 'Cool Yellow', a2: 'Cool Blue' },
  'Blue-Red (Violet)': { prefix: 'bvr', a1: 'Warm Blue', a2: 'Cool Red' },
};
const ARC_KEYS = Object.keys(ARC_DEF);
const arcs = {};
for (const k of ARC_KEYS) arcs[k] = L1[k].points.map((p) => { const lab = hexToLabD65(p.hex); return { t: p.t, lab, C: chroma(lab), H: hueDeg(lab) }; });

function nearestOnArc(lab, arcPts) {
  let best = Infinity, bestPt = null;
  for (const p of arcPts) { const d = labDist(lab, p.lab); if (d < best) { best = d; bestPt = p; } }
  return { dE: best, pt: bestPt };
}

const PLAUSIBLE_CUTOFF = 30;
const THRESH = 15.3;

const DROPPED_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const EXCLUDED_FLUORESCENT = [
  { range: "Holbein Artists' Colored Pencil", name: 'Luminous Rose' },
  { range: "Holbein Artists' Colored Pencil", name: 'Luminous Opera' },
  { range: 'Newell Brands Prismacolor Premier Soft Core Colored Pencils', name: 'Neon Yellow' },
  { range: 'Newell Brands Prismacolor Premier Soft Core Colored Pencils', name: 'Neon Pink' },
];
const scopedNeverFit = neverFit
  .filter((p) => !DROPPED_RANGES.includes(p.range))
  .filter((p) => !EXCLUDED_FLUORESCENT.some((e) => e.range === p.range && e.name === p.name));

const assigned = scopedNeverFit.map((p) => {
  const lab = hexToLabD65(p.hex);
  const perArc = ARC_KEYS.map((k) => ({ arc: k, ...nearestOnArc(lab, arcs[k]) }));
  perArc.sort((a, b) => a.dE - b.dE);
  return { p, lab, best: perArc[0] };
}).filter((x) => x.best.dE <= PLAUSIBLE_CUTOFF);

const BOOK_RANGES = [
  'Faber-Castell Polychromos 9201', 'Derwent Chromaflow Pencils', 'Derwent Lightfast Pencils',
  "Caran d'Ache Luminance 6901", "Caran d'Ache Pablo 666", "Holbein Artists' Colored Pencil",
  'Castle Arts Gold Coloured Pencils', 'Castle Arts Premium Soft Touch Colored Pencils',
  'Newell Brands Prismacolor Premier Soft Core Colored Pencils',
];
const EXTRA_RANGES = ['Derwent Drawing Pencils', 'Castle Arts Harmonious Collection'];
const allRanges = [...BOOK_RANGES, ...EXTRA_RANGES];
const pencils = Object.values(MASTER.pencils).filter((p) => p.lab_d65_2 && allRanges.includes(p.brand_range));

fs.mkdirSync(path.join(ROOT, 'data/exports'), { recursive: true });
for (const key of ARC_KEYS) {
  const { prefix, a1, a2 } = ARC_DEF[key];
  const t1 = thresholds[a1], t2 = thresholds[a2];

  const fitPool = pencils.map((p) => ({ p, n: nearestOnArc(p.lab_d65_2, arcs[key]) })).filter((x) => x.n.dE <= THRESH)
    .map((x) => ({ name: x.p.colour_name, range: x.p.brand_range, munsell: x.p.munsell, hex: x.p.srgb_hex, dE: +x.n.dE.toFixed(2), t: +x.n.pt.t.toFixed(4) }))
    .sort((a, b) => a.dE - b.dE);

  const mine = assigned.filter((x) => x.best.arc === key && munsellChroma(x.p.munsell) > NEUTRAL_CEILING);
  const tint = [], shade = [], wontFit = [];
  for (const x of mine) {
    const C = chroma(x.lab), H = hueDeg(x.lab);
    const pt = x.best.pt;
    const hueIsMeaningful = C > 12 && pt.C > 12;
    const dH = hueDiff(H, pt.H);
    const t = pt.t;
    const row = { name: x.p.name, range: x.p.range, munsell: x.p.munsell, hex: x.p.hex, dE: +x.best.dE.toFixed(2), t: +t.toFixed(4) };
    if (hueIsMeaningful && dH > 20) {
      row.reason = 'hue gap (dH=' + dH.toFixed(0) + ' from nearest arc point) -- not a lightness issue';
      wontFit.push(row);
      continue;
    }
    const tintThresh = lerp(thresholdVal(t1.tint), thresholdVal(t2.tint), t);
    const shadeThresh = lerp(t1.shade, t2.shade, t);
    const L = hslL(x.p.hex);
    if (L > tintThresh) { row.reason = 'lightness beyond tint threshold'; tint.push(row); }
    else if (L < shadeThresh) { row.reason = 'lightness beyond shade threshold'; shade.push(row); }
    else { row.reason = 'lightness is normal for this anchor, not a tint/shade'; wontFit.push(row); }
  }
  tint.sort((a, b) => a.dE - b.dE); shade.sort((a, b) => a.dE - b.dE); wontFit.sort((a, b) => a.dE - b.dE);

  const out = { arcLabel: key, fit: fitPool, tint, shade, wontFit };
  fs.writeFileSync(path.join(ROOT, 'data/exports/' + prefix + '_fit_tint_shade.json'), JSON.stringify(out, null, 2));
  console.log(key, '| Fit:', fitPool.length, '| Tint:', tint.length, '| Shade:', shade.length, '| WontFit:', wontFit.length);
}
