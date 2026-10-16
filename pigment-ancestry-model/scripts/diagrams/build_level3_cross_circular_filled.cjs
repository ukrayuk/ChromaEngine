const fs = require('fs');
const { annularWedgePath } = require('./polar_lib.cjs');
const DATA = JSON.parse(fs.readFileSync('../../data/level3_cross_rows.json', 'utf8'));

// Level 3 standalone -- same filled style as Level 1/2 (G0/G1/G0 shared
// inner band via EDGE_T, fully contiguous G2-G8 rings, 1px white stroke
// between every cell). Three arcs evenly spaced around the full circle
// (120deg each, same convention as Level 1's three sectors), 10deg gap
// between each.
//
// "Arc1 -- aligned" (originally at 12 o'clock -- the one combination where
// each of the three Level 1 primaries contributed a different hue family
// rather than two doubling up) was dropped 2026-10-15 (Ray's call): it
// always mixed a blend of warm and cool anchors, stayed permanently
// medium-muted (chroma 22.2-41.0 vs 0.4-70.3 for the other three), and
// rescued zero book-scope pencils. See README "Open items" and
// data/level3_cross_rows.json, which now holds only Arc2/3/4.
const GAP_TOTAL = 10, HALF_SPAN = 120 / 2 - GAP_TOTAL / 2; // 55deg each arc
const CX = 900, CY = 900;
const HOLE_R = 80;
const BAND = 46;
const RADIAL_GAP = 1;
const MAXGEN = 8;
const EDGE_T = 0.25;

const ARCS = [
  { key: 'Arc2 — BvR flipped', center: 0 },
  { key: 'Arc3 — RoY flipped', center: 120 },
  { key: 'Arc4 — YgB flipped', center: 240 },
];

function boundsFn(center) { return { startDeg: center - HALF_SPAN, endDeg: center + HALF_SPAN }; }

const svgParts = [];

for (const f of ARCS) {
  const points = DATA[f.key].points;
  const b = boundsFn(f.center);
  const angleForT = (t) => b.startDeg + (b.endDeg - b.startDeg) * t;
  let rInner = HOLE_R;

  {
    const rOuter = rInner + BAND;
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
    const rOuter = rInner + BAND;
    const newPoints = points.filter(p => p.gen === g);
    const n = newPoints.length;
    newPoints.forEach((p, i) => {
      const t0 = i / n, t1 = (i + 1) / n;
      const a0 = angleForT(t0), a1 = angleForT(t1);
      svgParts.push(`<path d="${annularWedgePath(CX, CY, rInner, rOuter, a0, a1)}" fill="${p.hex}" stroke="#ffffff" stroke-width="1"/>`);
    });
    rInner = rOuter + RADIAL_GAP;
  }
}

const html = `<title>Level 3 — Three-Way Arcs (filled)</title>
<style>
  body { margin: 0; background: #ffffff; }
  svg.fan { width: 1800px; height: 1800px; display: block; margin: 40px auto; }
</style>
<svg class="fan" viewBox="0 0 1800 1800">
${svgParts.join('\n')}
</svg>
`;
fs.writeFileSync('level3-cross-circular-filled.html', html);
console.log('written level3-cross-circular-filled.html');
