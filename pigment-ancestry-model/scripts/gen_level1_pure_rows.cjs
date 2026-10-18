const fs = require('fs');
const path = require('path');
const { mixSpectral, mixSpectralTrueLab } = require(path.join(__dirname, '../lib.cjs'));

// The three Level 1 arcs are the cross-family ancestry pairs, not same-family
// warm/cool pairs: Red-Yellow (-> Orange), Yellow-Blue (-> Green), Blue-Red
// (-> Violet), each built from one warm and one cool primary from two
// different families.
//
// RoY and YgB use real pencil anchors (srgb_hex straight from master.json --
// G0 is never reconstructed through spectral.js there, it's just the
// pencil's own colour). BvR uses synthetic (non-pencil) anchors built
// directly from a target Munsell Hue/Value/Chroma -- chosen on the warm/cool
// Munsell wheel logic, chroma capped at what's achievable by real pencils
// near that hue/value, converted through colour-science (illuminant C -> D65
// Bradford adapt -> Lab -> sRGB). This mixed set (real RoY/YgB, synthetic
// BvR) was chosen after comparing all-real vs all-synthetic vs this mix
// against book-scope classification coverage -- the mix edges out both pure
// approaches and BvR's own coverage alone jumps substantially, while RoY/YgB
// stay on their stronger real anchors.
//
// 2026-10-04: Warm Yellow swapped from Yellow Ochre (#f7c81e, chroma 11.61)
// to a vivid real "Cadmium Yellow"-type pencil (chroma ~13-15) -- see the
// Amendment section in the reference doc for the full cause/trade-off
// writeup. Corrected 2026-10-09: the right anchor is Medium Cadmium Yellow
// (Imit.), Caran d'Ache Luminance 6901 (#ffd800, 4.68Y 8.69/13.41) -- an
// earlier pass had mistakenly locked in Lemon, Lyra Rembrandt Polycolor
// (#ffd200, 3.67Y 8.59/14.53) instead. Visually near-identical (same vivid
// Cadmium-Yellow territory, hue/value/chroma all close), so no diagram
// re-render was needed for this correction -- only the underlying data and
// classification numbers change.
//
// 2026-10-15: Cool Yellow swapped from Lemon Cadmium (#f6e83b, Derwent
// Artists, H=99.4) to Cadmium Yellow Lemon, Faber-Castell Polychromos 9201
// (#e7ed46, 1.54GY 9.04/10.85, H=105.7). Ray's by-eye finding: the old
// anchor was too warm/indistinguishable from Warm Yellow. Searched real
// pencils across H=99-111 (anchored on Ray's own picked marker #e7fa01 and
// his test swatch #d5f129, which confirmed "lime" starts around H~108-111)
// and landed just inside the yellow side of that boundary. Unlike every
// other candidate tested (Lime Green, Lime, Lemon Lime, Luminance Lemon
// Yellow -- all cost coverage, -10 to -36), this one is a net GAIN:
// +11 book-scope (771->782, 67.0%->68.0%), +14 combined (846->860,
// 65.4%->66.5%), no range lost ground anywhere. Diagrams need
// re-rendering this time -- hue shift is large enough to be visible
// (99.4 -> 105.7deg), unlike the near-identical ffd200->ffd800 correction.
// trueLab added 2026-10-18 (Ray) for the two real anchors confirmed
// sRGB-gamut-clipped in master.json (srgb_gamut_status: "clipped") --
// Warm Yellow and Cool Blue. The hex stays the correct DISPLAY colour;
// trueLab is the real measured lab_d65_2, used only for the first
// generation's mix (see mixSpectralTrueLab in lib.cjs and buildDyadic
// below) so that mixing starts from the pigment's true saturation instead
// of a value already compressed by the hex round-trip. Vermilion and
// Cadmium Yellow Lemon are both confirmed "in gamut" (real vs hex-derived
// Lab match closely) -- no trueLab needed, nothing to correct.
const ARCS = {
  'Red-Yellow (Orange)': { P1: { name: 'Vermilion — Warm Red', hex: '#e3212f' }, P2: { name: 'Medium Cadmium Yellow (Imit.), Caran d\'Ache Luminance 6901 — Warm Yellow', hex: '#ffd800', trueLab: [87.26, -2.24, 94.56] } },
  'Yellow-Blue (Green)': { P1: { name: 'Cadmium Yellow Lemon, Faber-Castell Polychromos 9201 — Cool Yellow', hex: '#e7ed46' }, P2: { name: 'Cerulean Blue — Cool Blue', hex: '#0082b5', trueLab: [48.74, -24.69, -38.99] } },
  'Blue-Red (Violet)':   { P1: { name: 'Warm Blue (synthetic) — 8PB 4.8/13', hex: '#5f6bca' }, P2: { name: 'Cool Red (synthetic) — 8.25RP 4.5/14', hex: '#c62d6a' } },
};
const MAXGEN = 8;

// Dyadic recursive-midpoint subdivision: generation n's new points are the
// 50:50 spectral.js mix of every ADJACENT PAIR in the full accumulated set
// after generation n-1 -- never a direct jump to an arbitrary fraction of
// the two original primaries. Verified to reproduce 2,3,5,9,17,33,65,129,257.
// Confirmed against real physically-swatched, layered pencils: plain
// spectral.js mixing (no luminance "correction", no directional layering
// weighting) matches reality -- that experiment was tried and reverted.
//
// trueLabP1/trueLabP2: only generation 1 ever mixes a raw anchor directly
// (points start as just the two endpoints, so g=1's single midpoint IS
// that first mix) -- every generation after that mixes already-computed
// hex points, where there's no clipped-anchor correction left to apply.
function buildDyadic(hexP1, hexP2, maxGen, trueLabP1, trueLabP2) {
  let points = [{ t: 0, hex: hexP1, gen: 0 }, { t: 1, hex: hexP2, gen: 0 }];
  for (let g = 1; g <= maxGen; g++) {
    const next = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      let hex;
      if (g === 1 && i === 0 && trueLabP1) hex = mixSpectralTrueLab(trueLabP1, b.hex, 0.5);
      else if (g === 1 && i === 0 && trueLabP2) hex = mixSpectralTrueLab(trueLabP2, a.hex, 0.5);
      else hex = mixSpectral(a.hex, b.hex, 0.5);
      next.push({ t: (a.t + b.t) / 2, hex, gen: g });
    }
    const merged = [];
    let i = 0, j = 0;
    while (i < points.length || j < next.length) {
      if (j >= next.length || (i < points.length && points[i].t < next[j].t)) merged.push(points[i++]);
      else merged.push(next[j++]);
    }
    points = merged;
  }
  return points;
}

const out = {};
for (const [key, arc] of Object.entries(ARCS)) {
  out[key] = {
    p1Name: arc.P1.name,
    p2Name: arc.P2.name,
    points: buildDyadic(arc.P1.hex, arc.P2.hex, MAXGEN, arc.P1.trueLab, arc.P2.trueLab),
  };
}

fs.writeFileSync(path.join(__dirname, '../data/level1_pure_rows.json'), JSON.stringify(out));
console.log('written level1_pure_rows.json');
for (const [key, arc] of Object.entries(out)) {
  console.log(key, ':', arc.points.length, 'total points,', arc.p1Name, '->', arc.p2Name);
}
