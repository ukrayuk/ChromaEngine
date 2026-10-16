const fs = require('fs');
const { polar, annularWedgePath, angularHalfWidthAt } = require('./polar_lib.cjs');
const L2 = JSON.parse(fs.readFileSync('../../data/level2_cross_rows.json', 'utf8'));

// Summary diagram, Level 2 ring built first (most data -- Level 1 and Level 3
// rings will be sized to fit around whatever this establishes). Same filled
// look as every other diagram (contiguous cells, no per-cell stroke -- 257
// abutting cells at this scale render as a clean gradient without one; a
// stroke here produced a washed-out moire, confirmed on this ring first)
// but showing only ONE band per arc -- all 257 points at once (G0..G8
// merged, sorted by t), i.e. the complete finished primary-to-primary
// gradient at full resolution, not the generation-doubling ladder.
//
// This diagram's viewBox (1800) matches its rendered CSS size (1800px) 1:1,
// so gaps specified in mm convert straight to on-screen px via PX_PER_MM --
// no RENDER_SCALE correction needed here (unlike the 3-ring composite).
// ASSUMPTION (no real print size given yet): 1800 viewBox units ~= 300mm, so
// 6px/mm. Tell me the real print/canvas size and I'll recalibrate exactly.
const PX_PER_MM = 6;
// 10px within a pair (small, just enough to read as two arcs), 60px between
// pairs (unrelated hue families meeting, needs to read as clearly separate).
const WITHIN_MM = 10 / PX_PER_MM;  // gap between the two arcs in a pair, at the seam
const BETWEEN_MM = 60 / PX_PER_MM; // gap between different pairs, over each Level 1 arc's centre

const CX = 900, CY = 900;
const R_INNER = 400, BAND = 150, R_OUTER = R_INNER + BAND;
const R_MID = R_INNER + BAND / 2;

const WITHIN_HALF_DEG = angularHalfWidthAt(R_MID, (WITHIN_MM * PX_PER_MM) / 2);
const BETWEEN_HALF_DEG = angularHalfWidthAt(R_MID, (BETWEEN_MM * PX_PER_MM) / 2);

const ZONES = [
  { name: 'RoY × YgB', start: 0, end: 120,
    slotA: { key: 'RoY × YgB — like', reversed: true },
    slotB: { key: 'RoY × YgB — flipped', reversed: true } },
  { name: 'YgB × BvR', start: 120, end: 240,
    slotA: { key: 'YgB × BvR — like', reversed: true },
    slotB: { key: 'YgB × BvR — flipped', reversed: true } },
  { name: 'BvR × RoY', start: 240, end: 360,
    slotA: { key: 'BvR × RoY — like', reversed: false },
    slotB: { key: 'BvR × RoY — flipped', reversed: true } },
];

const svgParts = [];

// Tiny angular overlap between neighbouring cells -- kills the hairline
// rasterisation seam between abutting flat-fill wedges (the moire source),
// same fix as the 3-ring composite's drawFullArc.
const SEAM_EPS_DEG = 0.03;

function drawFullArc(points, startDeg, endDeg, reversed) {
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
    svgParts.push(`<path d="${annularWedgePath(CX, CY, R_INNER, R_OUTER, a0, a1)}" fill="${p.hex}"/>`);
  });
}

for (const zone of ZONES) {
  const mid = (zone.start + zone.end) / 2;
  const pairStart = zone.start + BETWEEN_HALF_DEG;
  const pairEnd = zone.end - BETWEEN_HALF_DEG;
  const slotABounds = [mid - WITHIN_HALF_DEG, pairStart];
  const slotBBounds = [mid + WITHIN_HALF_DEG, pairEnd];

  drawFullArc(L2[zone.slotA.key].points, slotABounds[0], slotABounds[1], zone.slotA.reversed);
  drawFullArc(L2[zone.slotB.key].points, slotBBounds[0], slotBBounds[1], zone.slotB.reversed);
}

const html = `<title>Summary — Level 2 Ring (G8, full resolution)</title>
<style>
  body { margin: 0; background: #ffffff; }
  svg.fan { width: 1800px; height: 1800px; display: block; margin: 40px auto; }
</style>
<svg class="fan" viewBox="0 0 1800 1800">
${svgParts.join('\n')}
</svg>
`;
fs.writeFileSync('summary-level2-ring.html', html);
console.log('written summary-level2-ring.html');
console.log('WITHIN_HALF_DEG', WITHIN_HALF_DEG.toFixed(3), 'BETWEEN_HALF_DEG', BETWEEN_HALF_DEG.toFixed(3));
