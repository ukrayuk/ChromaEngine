const fs = require('fs');
const { annularWedgePath } = require('./polar_lib.cjs');
const DATA = JSON.parse(fs.readFileSync('../../data/level1_pure_rows.json', 'utf8'));

// "Primary fans" -- filled version of the coral one: same 20deg gap between
// the three arcs (the coral separation), same G0/G1/G0 shared inner band,
// but every cell is drawn edge-to-edge with its neighbours -- no inset gap
// within a ring, no dots. Matches the drawFan reference logic (EDGE_T split
// for the G1 band, contiguous 1/steps-wide wedges for G2+).
const GAP_TOTAL = 10, HALF_SPAN = 60 - GAP_TOTAL / 2; // 55deg each arc
const CX = 900, CY = 900;
const HOLE_R = 80;
const BAND = 46;
const RADIAL_GAP = 0; // was a 1px hairline between generation rings -- removed, same reason as the per-cell stroke: dense grid of fine lines at G7/G8, uncomfortable on screen
const MAXGEN = 8;
const EDGE_T = 0.25; // G1 band split point -- matches drawFan

const FAMILIES = [
  { key: 'Red-Yellow (Orange)', center: 0 },
  { key: 'Yellow-Blue (Green)', center: 120 },
  { key: 'Blue-Red (Violet)', center: 240 },
];

function boundsFn(center) { return { startDeg: center - HALF_SPAN, endDeg: center + HALF_SPAN }; }

const svgParts = [];

// Per-cell 1px white stroke was the original "filled" convention, but at
// G7/G8 density (64-128 cells in one ring) it reads as a dense grid of fine
// lines -- uncomfortable to look at on screen even without true moire.
// Fixed the same way as the quick-ref rings: no stroke, tiny angular
// overlap between neighbouring cells instead.
const SEAM_EPS_DEG = 0.08;

for (const f of FAMILIES) {
  const points = DATA[f.key].points;
  const b = boundsFn(f.center);
  const angleForT = (t) => b.startDeg + (b.endDeg - b.startDeg) * t;
  let rInner = HOLE_R;

  function pushCell(rI, rO, t0, t1, hex) {
    let a0 = angleForT(t0), a1 = angleForT(t1);
    const dir = a1 >= a0 ? 1 : -1;
    a0 -= dir * SEAM_EPS_DEG;
    a1 += dir * SEAM_EPS_DEG;
    svgParts.push(`<path d="${annularWedgePath(CX, CY, rI, rO, a0, a1)}" fill="${hex}"/>`);
  }

  // -- Ring 0: G0 / G1 / G0 sharing one band, fully filled, no inset --
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
    for (const c of cells) pushCell(rInner, rOuter, c.t0, c.t1, c.hex);
    rInner = rOuter + RADIAL_GAP;
  }

  // -- Ring G2..G8: each generation's new points, fully filled, contiguous --
  for (let g = 2; g <= MAXGEN; g++) {
    const rOuter = rInner + BAND;
    const newPoints = points.filter(p => p.gen === g);
    const n = newPoints.length;
    newPoints.forEach((p, i) => {
      const t0 = i / n, t1 = (i + 1) / n;
      pushCell(rInner, rOuter, t0, t1, p.hex);
    });
    rInner = rOuter + RADIAL_GAP;
  }
}

const html = `<title>Level 1 — Primary Fans (filled)</title>
<style>
  body { margin: 0; background: #ffffff; }
  svg.fan { width: 1800px; height: 1800px; display: block; margin: 40px auto; }
</style>
<svg class="fan" viewBox="0 0 1800 1800">
${svgParts.join('\n')}
</svg>
`;
fs.writeFileSync('level1-pure-circular-filled.html', html);
console.log('written level1-pure-circular-filled.html');
