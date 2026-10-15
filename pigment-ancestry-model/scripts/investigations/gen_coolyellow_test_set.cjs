const fs = require('fs');
const { mixSpectral, mixN } = require('../../lib.cjs');

// TEST ONLY -- not canonical. Swaps Cool Yellow from Lemon Cadmium (#f6e83b,
// Derwent Artists) to one of two candidates closer to Ray's requested
// #e7fa01 (a greener, more vivid chartreuse-yellow, ~5-8deg further along
// the hue wheel). Everything else (Warm Red, Warm Yellow, Cool Blue, BvR
// synthetic) stays exactly as the canonical locked set.
const CANDIDATES = {
  lemonlime: { name: 'Lemon Lime, Derwent Chromaflow Pencils', hex: '#cbdd00' },
  luminance: { name: 'Lemon Yellow, Caran d\'Ache Luminance 6901', hex: '#f1ec29' },
};

const MAXGEN = 8;
function buildDyadic(hexP1, hexP2, maxGen) {
  let points = [{ t: 0, hex: hexP1, gen: 0 }, { t: 1, hex: hexP2, gen: 0 }];
  for (let g = 1; g <= maxGen; g++) {
    const next = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      next.push({ t: (a.t + b.t) / 2, hex: mixSpectral(a.hex, b.hex, 0.5), gen: g });
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
function crossArc(arcA, arcB, flip) {
  const n = arcA.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = arcA[i];
    const b = flip ? arcB[n - 1 - i] : arcB[i];
    out.push({ t: a.t, gen: a.gen, hex: mixSpectral(a.hex, b.hex, 0.5) });
  }
  return out;
}
function crossArc3(RoY, YgB, BvR, flipRoY, flipYgB, flipBvR) {
  const n = RoY.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = flipRoY ? RoY[n - 1 - i] : RoY[i];
    const b = flipYgB ? YgB[n - 1 - i] : YgB[i];
    const c = flipBvR ? BvR[n - 1 - i] : BvR[i];
    out.push({ t: RoY[i].t, gen: RoY[i].gen, hex: mixN([a.hex, b.hex, c.hex]) });
  }
  return out;
}

for (const [key, candidate] of Object.entries(CANDIDATES)) {
  const ARCS = {
    'Red-Yellow (Orange)': { P1: { name: 'Vermilion — Warm Red', hex: '#e3212f' }, P2: { name: 'Medium Cadmium Yellow (Imit.) — Warm Yellow', hex: '#ffd800' } },
    'Yellow-Blue (Green)': { P1: { name: candidate.name + ' — TEST Cool Yellow', hex: candidate.hex }, P2: { name: 'Cerulean Blue — Cool Blue', hex: '#0082b5' } },
    'Blue-Red (Violet)':   { P1: { name: 'Warm Blue (synthetic) — 8PB 4.8/13', hex: '#5f6bca' }, P2: { name: 'Cool Red (synthetic) — 8.25RP 4.5/14', hex: '#c62d6a' } },
  };
  const L1 = {};
  for (const [arcKey, arc] of Object.entries(ARCS)) {
    L1[arcKey] = { p1Name: arc.P1.name, p2Name: arc.P2.name, points: buildDyadic(arc.P1.hex, arc.P2.hex, MAXGEN) };
  }
  fs.writeFileSync(`level1_test_coolyellow_${key}_rows.json`, JSON.stringify(L1));

  const RoY = L1['Red-Yellow (Orange)'].points, YgB = L1['Yellow-Blue (Green)'].points, BvR = L1['Blue-Red (Violet)'].points;
  const L2 = {
    'RoY × YgB — like': { points: crossArc(RoY, YgB, false) },
    'RoY × YgB — flipped': { points: crossArc(RoY, YgB, true) },
    'YgB × BvR — like': { points: crossArc(YgB, BvR, false) },
    'YgB × BvR — flipped': { points: crossArc(YgB, BvR, true) },
    'BvR × RoY — like': { points: crossArc(BvR, RoY, false) },
    'BvR × RoY — flipped': { points: crossArc(BvR, RoY, true) },
  };
  fs.writeFileSync(`level2_test_coolyellow_${key}_rows.json`, JSON.stringify(L2));

  const L3 = {
    'Arc1 — aligned': { points: crossArc3(RoY, YgB, BvR, false, false, false) },
    'Arc2 — BvR flipped': { points: crossArc3(RoY, YgB, BvR, false, false, true) },
    'Arc3 — RoY flipped': { points: crossArc3(RoY, YgB, BvR, true, false, false) },
    'Arc4 — YgB flipped': { points: crossArc3(RoY, YgB, BvR, false, true, false) },
  };
  fs.writeFileSync(`level3_test_coolyellow_${key}_rows.json`, JSON.stringify(L3));

  console.log('written test set for', key, '(' + candidate.hex + ')');
}
