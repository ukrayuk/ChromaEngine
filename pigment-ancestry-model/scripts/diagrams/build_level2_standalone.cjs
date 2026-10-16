const fs = require('fs');
// NOTE: level2_standalone_rows.json's generator wasn't migrated into this
// handoff (gen_level2_standalone_rows.cjs, not copied) -- this file needs
// that regenerated, or level2_cross_rows.json adapted to this shape, before
// this script will run.
const ROWS = JSON.parse(fs.readFileSync('level2_standalone_rows.json', 'utf8'));

// Wide gap (between different zones) stays flat/constant angle -- confirmed
// fine as-is. Seam gap (between the related like/cross pair within a zone)
// uses constant LINEAR width instead, same fix as Level 1: two straight
// lines offset a fixed physical distance from the centerline, which in polar
// terms is asin(linearHalfWidth / r) -- naturally wider near the hub,
// narrower at the rim, no manual tuning.
const WIDE_HALF = 3; // flat/constant, total 6 deg
const SEAM_LINEAR_HALF = 2.8; // sector-seam gap's physical half-width

// zone i occupies [i*120, i*120+120], its own internal seam at i*120+60
const ZONES = [
  { base: 0,   cross: 'ROYxYGB-cross', like: 'ROYxYGB-like' },
  { base: 120, cross: 'YGBxBVR-cross', like: 'YGBxBVR-like' },
  { base: 240, cross: 'ROYxBVR-cross', like: 'ROYxBVR-like' },
];
const FAMILY = {};
for (const z of ZONES) {
  // "like" is positioned before "cross" -- lower angle (first) side of the zone
  FAMILY[z.like]  = { center: z.base + 60, rawBound: z.base,       seamSide: 'end' };
  FAMILY[z.cross] = { center: z.base + 60, rawBound: z.base + 120, seamSide: 'start' };
}

const html = `<title>Level 2 Standalone</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; }
  svg.fan { width: 1100px; height: 1100px; display: block; margin: 40px auto; }
  .fan-dot { stroke: #ffffff; stroke-width: 2; }
  .fan-label { font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 13px; font-weight: 700; fill: #1E1A22; paint-order: stroke fill; stroke: #ffffff; stroke-width: 3px; stroke-linejoin: round; }
</style>
<svg class="fan" viewBox="0 0 1100 1100" id="fanSvg"></svg>
<script>
const NS = "http://www.w3.org/2000/svg";
const ROWS = ${JSON.stringify(ROWS)};
const FAMILY = ${JSON.stringify(FAMILY)};
const WIDE_HALF = ${WIDE_HALF};
const SEAM_LINEAR_HALF = ${SEAM_LINEAR_HALF};

const CX = 550, CY = 550;
const R0 = 90, BAND = 42, MAXGEN = 8;

function polar(r, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
}
function annularWedgePath(rInner, rOuter, a0, a1) {
  const [x0i, y0i] = polar(rInner, a0), [x1i, y1i] = polar(rInner, a1);
  const [x0o, y0o] = polar(rOuter, a0), [x1o, y1o] = polar(rOuter, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweepOuter = a1 > a0 ? 1 : 0;
  const sweepInner = a1 > a0 ? 0 : 1;
  return ["M", x0o, y0o, "A", rOuter, rOuter, 0, large, sweepOuter, x1o, y1o, "L", x1i, y1i, "A", rInner, rInner, 0, large, sweepInner, x0i, y0i, "Z"].join(" ");
}

const svg = document.getElementById("fanSvg");

function angularHalfWidthAt(r, linearHalf) {
  return Math.asin(Math.min(1, linearHalf / r)) * 180 / Math.PI;
}
function boundsAtRadius(key, r) {
  const f = FAMILY[key];
  const dir = f.seamSide === 'end' ? 1 : -1;
  const seam = f.center - dir * angularHalfWidthAt(r, SEAM_LINEAR_HALF);
  const wide = f.rawBound + dir * WIDE_HALF;
  return f.seamSide === 'end' ? { startDeg: wide, endDeg: seam } : { startDeg: seam, endDeg: wide };
}

function drawArc(key) {
  const rows = ROWS[key];
  const g0Rows = rows.filter(r => r[0] === "G0");
  const t0Row = g0Rows.find(r => r[3] === 0), t1Row = g0Rows.find(r => r[3] === 1);

  const b0 = boundsAtRadius(key, R0 - 14);
  const angleForT0 = (t) => b0.startDeg + (b0.endDeg - b0.startDeg) * t;
  g0Rows.forEach(row => {
    const [gen, step, steps, t, hex] = row;
    const [x, y] = polar(R0 - 14, angleForT0(t));
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", x); dot.setAttribute("cy", y); dot.setAttribute("r", 6);
    dot.setAttribute("fill", hex); dot.setAttribute("class", "fan-dot");
    svg.appendChild(dot);
  });

  const b1 = boundsAtRadius(key, (R0 + (R0 + BAND)) / 2);
  const angleForT1 = (t) => b1.startDeg + (b1.endDeg - b1.startDeg) * t;
  const EDGE_T = 0.25;
  const g1Row = rows.find(r => r[0] === "G1" && r[1] === 1);
  [{ t0: 0, t1: EDGE_T, row: t0Row }, { t0: EDGE_T, t1: 1 - EDGE_T, row: g1Row }, { t0: 1 - EDGE_T, t1: 1, row: t1Row }].forEach(seg => {
    const a0 = angleForT1(seg.t0), a1 = angleForT1(seg.t1);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", annularWedgePath(R0, R0 + BAND, a0, a1));
    path.setAttribute("fill", seg.row[4]);
    svg.appendChild(path);
  });

  for (let g = 2; g <= MAXGEN; g++) {
    const label = "G" + g;
    const rInner = R0 + (g - 1) * BAND, rOuter = R0 + g * BAND;
    const bg = boundsAtRadius(key, (rInner + rOuter) / 2);
    const angleForT = (t) => bg.startDeg + (bg.endDeg - bg.startDeg) * t;
    const genRows = rows.filter(r => r[0] === label && r[1] % 2 === 1);
    genRows.forEach(row => {
      const [gen, step, steps, t, hex] = row;
      const halfWidthT = 1 / steps;
      const a0 = angleForT(Math.max(0, t - halfWidthT));
      const a1 = angleForT(Math.min(1, t + halfWidthT));
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", annularWedgePath(rInner, rOuter, a0, a1));
      path.setAttribute("fill", hex);
      svg.appendChild(path);
    });
  }

  const bOuter = boundsAtRadius(key, R0 + MAXGEN * BAND);
  const midDeg = (bOuter.startDeg + bOuter.endDeg) / 2;
  const [lx, ly] = polar(R0 + MAXGEN * BAND + 20, midDeg);
  const t = document.createElementNS(NS, "text");
  t.setAttribute("x", lx); t.setAttribute("y", ly);
  t.setAttribute("class", "fan-label");
  t.setAttribute("text-anchor", "middle");
  t.textContent = key;
  svg.appendChild(t);
}

Object.keys(FAMILY).forEach(drawArc);
</script>
`;

fs.writeFileSync('level2-standalone.html', html);
console.log('written level2-standalone.html');
