// ΔE-uniform ("arc-length") version of the ΔE ladder: same real arc,
// same real anchors, same real pencil classifications -- the only
// change is the horizontal axis. Instead of raw t (the dyadic mixing
// ratio, which moves through colour space at a wildly uneven rate --
// 6.6 to ~82 deltaE per 0.1 of t depending on where you are on the
// arc), this resamples by cumulative arc length, so every 0.1 step of
// the new parameter u covers roughly the same real colour distance
// everywhere. Built 2026-10-30 at Ray's request, after testing (and
// ruling out) literally relocating the Cool Blue anchor to achieve the
// same practical effect -- that would reshape every pencil's
// classification along the whole arc; this reparameterization changes
// nothing about the model, only how the diagnostic ladder is labelled.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist, mixSpectralTrueLab } = require(path.join(__dirname, '../lib.cjs'));

const ROOT = path.join(__dirname, '..');
const ARC_KEY = process.argv[2] || 'Yellow-Blue (Green)';
const OUT_PREFIX = process.argv[3] || 'ygb';
const MAX_STEP = 15;
const N_RESAMPLE = 257; // match the original dense arc's resolution

const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const denseArc = L1[ARC_KEY].points.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

// cumulative arc length over the dense (t-uniform) arc
let cum = 0;
const withCum = [{ t: denseArc[0].t, lab: denseArc[0].lab, cum: 0 }];
for (let i = 1; i < denseArc.length; i++) {
  cum += labDist(denseArc[i - 1].lab, denseArc[i].lab);
  withCum.push({ t: denseArc[i].t, lab: denseArc[i].lab, cum });
}
const TOTAL = cum;

function labAtCum(targetCum) {
  // linear-interpolate Lab between the two dense points straddling targetCum
  for (let i = 1; i < withCum.length; i++) {
    if (withCum[i].cum >= targetCum) {
      const a = withCum[i - 1], b = withCum[i];
      const span = b.cum - a.cum;
      const frac = span > 0 ? (targetCum - a.cum) / span : 0;
      return a.lab.map((v, k) => v + (b.lab[k] - v) * frac);
    }
  }
  return withCum[withCum.length - 1].lab;
}
function tAtCum(targetCum) {
  for (let i = 1; i < withCum.length; i++) {
    if (withCum[i].cum >= targetCum) {
      const a = withCum[i - 1], b = withCum[i];
      const span = b.cum - a.cum;
      const frac = span > 0 ? (targetCum - a.cum) / span : 0;
      return a.t + (b.t - a.t) * frac;
    }
  }
  return withCum[withCum.length - 1].t;
}
// u -> cumulative-arc-length fraction for a given real t (for placing
// real pencils, whose nearest-arc t is found against the dense arc as
// usual -- classification is unchanged, only its on-diagram position).
function uForT(t) {
  // find where t falls in the dense arc's own cum table
  for (let i = 1; i < withCum.length; i++) {
    if (withCum[i].t >= t) {
      const a = withCum[i - 1], b = withCum[i];
      const span = b.t - a.t;
      const frac = span > 0 ? (t - a.t) / span : 0;
      const c = a.cum + (b.cum - a.cum) * frac;
      return c / TOTAL;
    }
  }
  return 1;
}

function labToHex(lab) {
  return mixSpectralTrueLab(lab, mixSpectralTrueLab(lab, '#808080', 0.5), 0.001);
}

// resample the arc at N_RESAMPLE evenly-spaced u (arc-length) steps
const arcU = [];
for (let i = 0; i < N_RESAMPLE; i++) {
  const u = i / (N_RESAMPLE - 1);
  const lab = labAtCum(u * TOTAL);
  arcU.push({ u, t: tAtCum(u * TOTAL), lab });
}

const ladder = {};
for (let s = 0; s <= MAX_STEP; s++) {
  ladder['tint_' + s] = arcU.map((p) => ({ u: p.u, hex: labToHex([Math.min(100, p.lab[0] + s), p.lab[1], p.lab[2]]) }));
  ladder['shade_' + s] = arcU.map((p) => ({ u: p.u, hex: labToHex([Math.max(0, p.lab[0] - s), p.lab[1], p.lab[2]]) }));
}
fs.writeFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_de_ladder_arclength.json'), JSON.stringify(ladder));
console.log('arc-length ladder written:', Object.keys(ladder).length, 'rows, total arc length (sum dE) =', TOTAL.toFixed(2));

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
  for (const p of denseArc) { const d = labDist(lab, p.lab); if (d < best) { best = d; bestP = p; } }
  return { ...bestP, dE: best };
}

const pencils = Object.values(MASTER.pencils).filter((p) => p.lab_d65_2 && allRanges.includes(p.brand_range));
const fit = [];
for (const p of pencils) {
  const near = nearestArcLab(p.lab_d65_2);
  if (near.dE > THRESH) continue;
  fit.push({
    name: p.colour_name,
    range: p.brand_range,
    hex: p.srgb_hex,
    t: near.t,
    u: Math.round(uForT(near.t) * 10000) / 10000,
    dL: Math.round((p.lab_d65_2[0] - near.lab[0]) * 10) / 10,
    dE: Math.round(near.dE * 100) / 100,
  });
}
fs.writeFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_fit_with_dl_arclength.json'), JSON.stringify(fit, null, 2));
console.log('fit-with-dL (arc-length) written:', fit.length, 'pencils');
