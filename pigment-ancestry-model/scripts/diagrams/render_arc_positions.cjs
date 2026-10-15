const fs = require('fs');
const positions = JSON.parse(fs.readFileSync('../../data/chapter_official_positions.json', 'utf8'));
const L1 = JSON.parse(fs.readFileSync('../../data/level1_pure_rows.json', 'utf8'));

const ARC_INFO = {
  'Red-Yellow (Orange)': { label: 'RoY', p1Name: 'Warm Red', p2Name: 'Warm Yellow' },
  'Yellow-Blue (Green)': { label: 'YgB', p1Name: 'Cool Yellow', p2Name: 'Cool Blue' },
  'Blue-Red (Violet)':   { label: 'BvR', p1Name: 'Warm Blue', p2Name: 'Cool Red' },
};

const BAR_W = 900, BAR_H = 60, MARGIN = 120, GAP = 260, SWATCH = 40;
const W = MARGIN + BAR_W + 60;
const arcKeys = Object.keys(ARC_INFO);
const H = MARGIN + arcKeys.length*(BAR_H + GAP) + 60;
const MIN_SPACING = 80; // minimum horizontal distance between adjacent swatch centres

function gradientStops(points) {
  const sorted = [...points].sort((a,b)=>a.t-b.t);
  const n = sorted.length;
  return sorted.map((p,i) => `<stop offset="${(i/(n-1)*100).toFixed(2)}%" stop-color="${p.hex}"/>`).join('');
}

// Greedily spread out x positions (sorted) so no two are closer than MIN_SPACING,
// keeping the set as centred as possible on the true positions.
function declutter(xs) {
  const n = xs.length;
  const adjusted = xs.slice();
  for (let i = 1; i < n; i++) {
    if (adjusted[i] - adjusted[i-1] < MIN_SPACING) adjusted[i] = adjusted[i-1] + MIN_SPACING;
  }
  return adjusted;
}

let svg = '<defs>';
arcKeys.forEach((key,i) => { svg += `<linearGradient id="grad${i}" x1="0" y1="0" x2="1" y2="0">${gradientStops(L1[key].points)}</linearGradient>`; });
svg += '</defs>';

arcKeys.forEach((key, i) => {
  const info = ARC_INFO[key];
  const y = MARGIN + i*(BAR_H+GAP);
  const x0 = MARGIN;
  svg += `<text x="${MARGIN - 70}" y="${y + BAR_H/2 + 7}" font-family="ui-monospace,monospace" font-size="22" font-weight="bold" fill="#111">${info.label}</text>`;
  svg += `<rect x="${x0}" y="${y}" width="${BAR_W}" height="${BAR_H}" fill="url(#grad${i})" stroke="#999"/>`;
  svg += `<text x="${x0}" y="${y+BAR_H+22}" font-family="ui-monospace,monospace" font-size="13" fill="#555">t=0: ${info.p1Name}</text>`;
  svg += `<text x="${x0+BAR_W}" y="${y+BAR_H+22}" font-family="ui-monospace,monospace" font-size="13" fill="#555" text-anchor="end">t=1: ${info.p2Name}</text>`;

  const items = positions.filter(p => p.arcKey === key).sort((a,b)=>a.t-b.t);
  const trueX = items.map(p => x0 + p.t*BAR_W);

  // Split into above/below alternating groups, declutter each group independently
  // (so crowding on one side doesn't push labels on the other side around).
  const aboveIdx = [], belowIdx = [];
  items.forEach((p, idx) => (idx % 2 === 0 ? aboveIdx : belowIdx).push(idx));
  const aboveAdj = declutter(aboveIdx.map(idx => trueX[idx]));
  const belowAdj = declutter(belowIdx.map(idx => trueX[idx]));
  const adjX = new Array(items.length);
  aboveIdx.forEach((idx, k) => adjX[idx] = aboveAdj[k]);
  belowIdx.forEach((idx, k) => adjX[idx] = belowAdj[k]);

  items.forEach((p, idx) => {
    const above = idx % 2 === 0;
    const tx = trueX[idx], ax = adjX[idx];
    const tickY1 = above ? y : y + BAR_H;
    const tickY2 = above ? y - 20 : y + BAR_H + 20;
    // leader line: vertical from bar to mid-height, then diagonal to the (possibly shifted) label x
    const midY = above ? y - 10 : y + BAR_H + 10;
    svg += `<polyline points="${tx},${tickY1} ${tx},${midY} ${ax},${tickY2}" fill="none" stroke="#333" stroke-width="1.25"/>`;
    const swY = above ? tickY2 - SWATCH - 4 : tickY2 + 4;
    svg += `<rect x="${ax-SWATCH/2}" y="${swY}" width="${SWATCH}" height="${SWATCH}" fill="${p.target}" stroke="#333" stroke-width="1"/>`;
    const textY1 = above ? swY - 20 : swY + SWATCH + 16;
    const textY2 = above ? swY - 6 : swY + SWATCH + 30;
    svg += `<text x="${ax}" y="${textY1}" font-family="ui-monospace,monospace" font-size="12" fill="#222" text-anchor="middle">${p.target}</text>`;
    svg += `<text x="${ax}" y="${textY2}" font-family="ui-monospace,monospace" font-size="10" fill="#888" text-anchor="middle">t=${p.t.toFixed(2)}</text>`;
  });
});

const html = `<title>Chapter colours — position on each Level 1 arc</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${svg}</svg>`;
fs.writeFileSync('arc_positions.html', html);
console.log('written', W, 'x', H);
