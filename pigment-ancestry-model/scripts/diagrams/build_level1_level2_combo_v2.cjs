const fs = require('fs');
const { polar, annularWedgePath } = require('./polar_lib.cjs');
const L1 = JSON.parse(fs.readFileSync('../../data/level1_pure_rows.json', 'utf8'));
const L2 = JSON.parse(fs.readFileSync('../../data/level2_cross_rows.json', 'utf8'));

// Combo v2: ports the PROVEN layout from the earlier level1-level2-composite.html
// artifact (zones centred on the seam between two Level 1 arcs, Level 2 as
// floating petals with a radius gap + connector stem back to Level 1's rim,
// grey pair-bracket frame, zone/petal labels) onto the CURRENT finalised
// data (level1_pure_rows.json / level2_cross_rows.json) and the "filled"
// cell style (contiguous cells, permanent 1px white stroke) used by the new
// standalone Level 1/2/3 diagrams, scaled up to the 1800x1800 canvas.
const CX = 900, CY = 900;
const MAXGEN = 8;
const EDGE_T = 0.25;
const RADIAL_GAP = 1;

const HOLE_R = 80, BAND_1 = 46;
const L1_OUTER = HOLE_R + MAXGEN * BAND_1; // 448
const STEM_GAP = 78;
const R0_2 = L1_OUTER + STEM_GAP; // 526
const BAND_2 = 34;
// True outer edge of G8, including the (MAXGEN-1) accumulated RADIAL_GAP
// pixels drawRingStack actually adds between each of the 8 generation
// bands -- the naive R0_2 + MAXGEN*BAND_2 undershoots by that amount (7px),
// which is what cut the grey petal outline across G8 instead of framing its
// real edge (caught by Ray, 2026-10-04).
const L2_OUTER = R0_2 + MAXGEN * BAND_2 + (MAXGEN - 1) * RADIAL_GAP; // 805

const ARCS_L1 = [
  { key: 'Red-Yellow (Orange)', label: 'RoY', center: 0 },
  { key: 'Yellow-Blue (Green)', label: 'YgB', center: 120 },
  { key: 'Blue-Red (Violet)', label: 'BvR', center: 240 },
];

// Zones centred on the seam between two neighbouring Level 1 arcs. slotA
// sits near zone.start (the first flanking Level 1 arc), slotB near
// zone.end (the second). Per Ray's latest pass: RoY x YgB and YgB x BvR
// swap which dataset sits in which slot and reverse both; BvR x RoY also
// swaps slots but only reverses the green/red ("flipped") dataset, not the
// maroon/orange ("like") one.
const ZONES = [
  {
    name: 'RoY × YgB', start: 0, end: 120,
    slotA: { key: 'RoY × YgB — like', reversed: true },
    slotB: { key: 'RoY × YgB — flipped', reversed: true },
  },
  {
    name: 'YgB × BvR', start: 120, end: 240,
    slotA: { key: 'YgB × BvR — like', reversed: true },
    slotB: { key: 'YgB × BvR — flipped', reversed: true },
  },
  {
    name: 'BvR × RoY', start: 240, end: 360,
    slotA: { key: 'BvR × RoY — like', reversed: false },
    slotB: { key: 'BvR × RoY — flipped', reversed: true },
  },
];
// Matches the "Pigment Ancestry Arcs — Nine-Arc Composite" reference artifact's
// own constants exactly: OUTER_GAP_WITHIN_DEG=3, OUTER_GAP_BETWEEN_DEG=11.
const ZONE_GAP = 3, PAIR_GAP = 11;

const svgParts = [];

function drawRingStack(points, startDeg, endDeg, r0, band, reversed) {
  const angleForT = reversed
    ? (t) => endDeg - (endDeg - startDeg) * t
    : (t) => startDeg + (endDeg - startDeg) * t;
  let rInner = r0;

  {
    const rOuter = rInner + band;
    const g0a = points.find(p => p.gen === 0 && p.t === 0);
    const g1 = points.find(p => p.gen === 1);
    const g0b = points.find(p => p.gen === 0 && p.t === 1);
    const cells = [
      { hex: g0a.hex, t0: 0, t1: EDGE_T },
      { hex: g1.hex, t0: EDGE_T, t1: 1 - EDGE_T },
      { hex: g0b.hex, t0: 1 - EDGE_T, t1: 1 },
    ];
    for (const c of cells) {
      const a0 = angleForT(c.t0), a1 = angleForT(c.t1);
      svgParts.push(`<path d="${annularWedgePath(CX, CY, rInner, rOuter, a0, a1)}" fill="${c.hex}" stroke="#ffffff" stroke-width="1"/>`);
    }
    rInner = rOuter + RADIAL_GAP;
  }

  for (let g = 2; g <= MAXGEN; g++) {
    const rOuter = rInner + band;
    const newPoints = points.filter(p => p.gen === g);
    const n = newPoints.length;
    newPoints.forEach((p, i) => {
      const t0 = i / n, t1 = (i + 1) / n;
      const a0 = angleForT(t0), a1 = angleForT(t1);
      svgParts.push(`<path d="${annularWedgePath(CX, CY, rInner, rOuter, a0, a1)}" fill="${p.hex}" stroke="#ffffff" stroke-width="1"/>`);
    });
    rInner = rOuter + RADIAL_GAP;
  }
  return rInner;
}

// -- Level 1 --
for (const arc of ARCS_L1) {
  const points = L1[arc.key].points;
  drawRingStack(points, arc.center - 55, arc.center + 55, HOLE_R, BAND_1, false);
}

// -- Level 2 --
for (const zone of ZONES) {
  const mid = (zone.start + zone.end) / 2;
  const pairStart = zone.start + PAIR_GAP / 2;
  const pairEnd = zone.end - PAIR_GAP / 2;

  const slotABounds = [mid - ZONE_GAP / 2, pairStart];
  const slotBBounds = [mid + ZONE_GAP / 2, pairEnd];

  drawRingStack(L2[zone.slotA.key].points, slotABounds[0], slotABounds[1], R0_2, BAND_2, zone.slotA.reversed);
  drawRingStack(L2[zone.slotB.key].points, slotBBounds[0], slotBBounds[1], R0_2, BAND_2, zone.slotB.reversed);

  // outline around each petal
  for (const b of [slotABounds, slotBBounds]) {
    svgParts.push(`<path d="${annularWedgePath(CX, CY, R0_2, L2_OUTER, b[0], b[1])}" fill="none" stroke="#9a92a3" stroke-width="1"/>`);
  }

  // connector stem + dot, seam side of each petal
  for (const seamDeg of [slotABounds[0], slotBBounds[0]]) {
    const [x1, y1] = polar(CX, CY, L1_OUTER + 6, seamDeg);
    const [x2, y2] = polar(CX, CY, R0_2 - 4, seamDeg);
    svgParts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9a92a3" stroke-width="1.25"/>`);
    svgParts.push(`<circle cx="${x1}" cy="${y1}" r="4" fill="#fff" stroke="#9a92a3" stroke-width="1.25"/>`);
  }
}

const html = `<title>Level 1 + Level 2 — Combo v2</title>
<style>
  body { margin: 0; background: #ffffff; }
  svg.fan { width: 1800px; height: 1800px; display: block; margin: 40px auto; }
</style>
<svg class="fan" viewBox="0 0 1800 1800">
${svgParts.join('\n')}
</svg>
`;
fs.writeFileSync('level1-level2-combo-v2.html', html);
console.log('written level1-level2-combo-v2.html');
