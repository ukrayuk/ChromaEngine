const fs = require('fs');
const { hexToLabD65, labDist, mixSpectral } = require('../../lib.cjs');

const TARGET = '#80c300';
const CANARY_YELLOW = '#f8e538';  // Caran d'Ache Pablo, "Canary Yellow"
const BLUE_JEANS = '#427caa';     // Caran d'Ache Pablo, "Blue Jeans"

// Rebuild a dyadic arc between the two OWNED pencils (not the official
// anchors) so the G3 position (t=0.125) is comparable on a like-for-like
// basis -- same construction method, just swapped endpoints.
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

const pts = buildDyadic(CANARY_YELLOW, BLUE_JEANS, 8);
const targetLab = hexToLabD65(TARGET);
let best = Infinity, bestP = null;
for (const p of pts) {
  const d = labDist(targetLab, hexToLabD65(p.hex));
  if (d < best) { best = d; bestP = p; }
}
console.log('Nearest point on Canary Yellow -> Blue Jeans arc:', bestP.hex, ' t=' + bestP.t.toFixed(4), ' gen=' + bestP.gen, ' dE=' + best.toFixed(2));

// Also show the exact G3 (t=0.125) point for a clean "1 in 8" instruction, same as the reference example.
const g3 = bestP;
console.log('G3 (t=0.125) point:', g3.hex, ' dE from target=' + labDist(targetLab, hexToLabD65(g3.hex)).toFixed(2));

const items = [
  { label: 'Target (chapter colour)', hex: TARGET, sub: TARGET },
  { label: 'Canary Yellow + Blue Jeans mix', hex: g3.hex, sub: `t=${g3.t.toFixed(3)} · ΔE ${labDist(targetLab, hexToLabD65(g3.hex)).toFixed(1)}` },
  { label: 'Canary Yellow (owned)', hex: CANARY_YELLOW, sub: "Caran d'Ache Pablo" },
  { label: 'Blue Jeans (owned)', hex: BLUE_JEANS, sub: "Caran d'Ache Pablo" },
];

const SW = 200, GAP = 40, LABEL_H = 56, MARGIN = 40;
const W = MARGIN*2 + items.length*SW + (items.length-1)*GAP;
const H = MARGIN*2 + SW + LABEL_H;
let svg = '';
items.forEach((it, i) => {
  const x = MARGIN + i*(SW+GAP), y = MARGIN;
  svg += `<rect x="${x}" y="${y}" width="${SW}" height="${SW}" fill="${it.hex}" stroke="#999" stroke-width="1"/>`;
  svg += `<text x="${x+SW/2}" y="${y+SW+22}" font-family="ui-monospace,monospace" font-size="13" fill="#222" text-anchor="middle">${it.label}</text>`;
  svg += `<text x="${x+SW/2}" y="${y+SW+42}" font-family="ui-monospace,monospace" font-size="13" fill="#666" text-anchor="middle">${it.sub}</text>`;
  if (i < items.length-1) svg += `<text x="${x+SW+GAP/2}" y="${y+SW/2+5}" font-family="ui-monospace,monospace" font-size="20" fill="#999" text-anchor="middle">→</text>`;
});
const html = `<title>Worked example (owned pencils) — #80c300</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${svg}</svg>`;
fs.writeFileSync('worked_example_owned.html', html);
console.log('written', W, 'x', H);
