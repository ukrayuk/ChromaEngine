const fs = require('fs');
const { polar, annularWedgePath, angularHalfWidthAt } = require('./polar_lib.cjs');
const L1 = JSON.parse(fs.readFileSync('../../data/level1_pure_rows.json', 'utf8'));
const L2 = JSON.parse(fs.readFileSync('../../data/level2_cross_rows.json', 'utf8'));
const L3 = JSON.parse(fs.readFileSync('../../data/level3_cross_rows.json', 'utf8'));

// Summary diagram: 3 concentric rings, each showing only the full-resolution
// (all 257 points, G0..G8 merged, sorted by t) primary-to-primary gradient
// per arc -- no generation-doubling ladder, no per-cell stroke (257 abutting
// cells at this scale render as a clean gradient without one; a stroke here
// produced a washed-out moire, confirmed on the Level 2-only test).
//
// Canvas grown past 1800 to fit the requested radii without clipping.
const PX_PER_MM = 6;

// This diagram's viewBox (3000) no longer matches its rendered CSS size
// (1800px) the way the Level-2-only summary's does (1:1) -- 1 viewBox unit
// here is only 0.6 rendered px. L3_GAP_MM (still geometry-only, unchanged)
// stays correct in relative terms since every ring is scaled by the same
// factor, but L1 and L2's gaps are now specified as actual ON-SCREEN px
// (Ray's ask), so they need this correction to land exactly.
const RENDER_SCALE = 1800 / 3000;

const CX = 1500, CY = 1500;

// Rings pushed outward to free up more blank centre, gap between rings
// narrowed, Level 1 brought back down -- still thicker than Level 2/3, but
// less than the 300 it was.
const RING_GAP = 50;
const L1_INNER = 650, L1_BAND = 250, L1_OUTER = L1_INNER + L1_BAND; // 650-900
const L2_INNER = L1_OUTER + RING_GAP, L2_BAND = 200, L2_OUTER = L2_INNER + L2_BAND; // 950-1150
// 10px within a pair (small, just enough to read as two arcs -- confirmed
// fine at the original size), 60px between pairs (unrelated hue families
// meeting, needs to read as clearly separate).
const L2_WITHIN_UNITS = 10 / RENDER_SCALE, L2_BETWEEN_UNITS = 60 / RENDER_SCALE;
const L3_INNER = L2_OUTER + RING_GAP, L3_BAND = 200, L3_OUTER = L3_INNER + L3_BAND; // 1200-1400
const L3_GAP_MM = 3;
// L1's gaps sit at the same 0/120/240deg positions as Level 2's between-pair
// gaps (both mark a boundary between unrelated hue families), so matched to
// the same 60px on-screen target rather than the old flat 3mm.
const L1_GAP_UNITS = 60 / RENDER_SCALE;

const svgParts = [];

// At 257 abutting cells per ring, adjacent flat-fill wedges don't rasterise
// to a perfectly shared edge -- sub-pixel rounding leaves a hairline seam
// between neighbours, which is what reads as a fine grid of moving lines on
// screen (the renderer can't resolve a true abutting edge, so it flickers/
// shimmers as it's redrawn or compressed -- moire, not a deliberate stroke).
// Fix: give every cell a tiny angular OVERLAP with its neighbours so there's
// no seam left for anti-aliasing to catch on. EPS is tiny next to even the
// narrowest real gap (~0.5deg for Level 2's within-pair seam), so it doesn't
// visibly eat into any intentional gap.
const SEAM_EPS_DEG = 0.03;

function drawFullArc(points, rInner, rOuter, startDeg, endDeg, reversed) {
  const angleForT = reversed
    ? (t) => endDeg - (endDeg - startDeg) * t
    : (t) => startDeg + (endDeg - startDeg) * t;
  const sorted = [...points].sort((a, b) => a.t - b.t);
  const n = sorted.length;
  sorted.forEach((p, i) => {
    const t0 = i / n, t1 = (i + 1) / n;
    let a0 = angleForT(t0), a1 = angleForT(t1);
    const dir = a1 >= a0 ? 1 : -1;
    a0 -= dir * SEAM_EPS_DEG;
    a1 += dir * SEAM_EPS_DEG;
    svgParts.push(`<path d="${annularWedgePath(CX, CY, rInner, rOuter, a0, a1)}" fill="${p.hex}"/>`);
  });
}

// -- Level 1: 3 simple arcs, equal linear-width gaps between them --
{
  const rMid = (L1_INNER + L1_OUTER) / 2;
  const gapHalfDeg = angularHalfWidthAt(rMid, L1_GAP_UNITS / 2);
  const ARCS = [
    { key: 'Red-Yellow (Orange)', center: 0 },
    { key: 'Yellow-Blue (Green)', center: 120 },
    { key: 'Blue-Red (Violet)', center: 240 },
  ];
  for (const arc of ARCS) {
    drawFullArc(L1[arc.key].points, L1_INNER, L1_OUTER, arc.center - 60 + gapHalfDeg, arc.center + 60 - gapHalfDeg, false);
  }
}

// -- Level 2: 3 zones of 2 arcs, within/between linear-width gaps --
{
  const rMid = (L2_INNER + L2_OUTER) / 2;
  const withinHalfDeg = angularHalfWidthAt(rMid, L2_WITHIN_UNITS / 2);
  const betweenHalfDeg = angularHalfWidthAt(rMid, L2_BETWEEN_UNITS / 2);
  const ZONES = [
    { start: 0, end: 120,
      slotA: { key: 'RoY × YgB — like', reversed: true },
      slotB: { key: 'RoY × YgB — flipped', reversed: true } },
    { start: 120, end: 240,
      slotA: { key: 'YgB × BvR — like', reversed: true },
      slotB: { key: 'YgB × BvR — flipped', reversed: true } },
    { start: 240, end: 360,
      slotA: { key: 'BvR × RoY — like', reversed: false },
      slotB: { key: 'BvR × RoY — flipped', reversed: true } },
  ];
  for (const zone of ZONES) {
    const mid = (zone.start + zone.end) / 2;
    const pairStart = zone.start + betweenHalfDeg;
    const pairEnd = zone.end - betweenHalfDeg;
    drawFullArc(L2[zone.slotA.key].points, L2_INNER, L2_OUTER, mid - withinHalfDeg, pairStart, zone.slotA.reversed);
    drawFullArc(L2[zone.slotB.key].points, L2_INNER, L2_OUTER, mid + withinHalfDeg, pairEnd, zone.slotB.reversed);
  }
}

// -- Level 3: 3 simple arcs (Arc1 — aligned dropped 2026-10-15, rescued zero
// pencils, see README), equal linear-width gaps between them, same 120deg
// spacing as Level 1 -- no basis yet for an uneven gap here (unlike Level 2's
// within/between pair distinction, these three don't have an established
// closer/farther relationship to each other) --
{
  const rMid = (L3_INNER + L3_OUTER) / 2;
  const gapHalfDeg = angularHalfWidthAt(rMid, (L3_GAP_MM * PX_PER_MM) / 2);
  const ARCS = [
    { key: 'Arc2 — BvR flipped', center: 0 },
    { key: 'Arc3 — RoY flipped', center: 120 },
    { key: 'Arc4 — YgB flipped', center: 240 },
  ];
  for (const arc of ARCS) {
    drawFullArc(L3[arc.key].points, L3_INNER, L3_OUTER, arc.center - 60 + gapHalfDeg, arc.center + 60 - gapHalfDeg, false);
  }
}

const html = `<title>Summary — Three Rings (G8, full resolution)</title>
<style>
  body { margin: 0; background: #ffffff; }
  svg.fan { width: 1800px; height: 1800px; display: block; margin: 40px auto; }
</style>
<svg class="fan" viewBox="0 0 3000 3000">
${svgParts.join('\n')}
</svg>
`;
fs.writeFileSync('summary-rings.html', html);
console.log('written summary-rings.html');
console.log('L1', L1_INNER, '-', L1_OUTER, '  L2', L2_INNER, '-', L2_OUTER, '  L3', L3_INNER, '-', L3_OUTER);
