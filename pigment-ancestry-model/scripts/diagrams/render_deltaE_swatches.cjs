const fs = require('fs');
const rows = JSON.parse(fs.readFileSync('deltaE_swatch_data.json', 'utf8'));

const SW = 110, SH = 110, GAP = 10, LABEL_H = 46, ROW_LABEL_W = 330, MARGIN = 40, HEADER_H = 50;
const nCols = rows[0].swatches.length;
const W = ROW_LABEL_W + nCols * (SW + GAP) + MARGIN;
const H = MARGIN + HEADER_H + rows.length * (SH + LABEL_H + GAP) + MARGIN;

let svg = '';
// Column headers (ΔE values)
rows[0].swatches.forEach((s, i) => {
  const x = MARGIN + ROW_LABEL_W + i * (SW + GAP) + SW / 2;
  const isThreshold = Math.abs(s.targetDE - 15.3) < 0.01;
  svg += `<text x="${x}" y="${MARGIN + HEADER_H - 14}" font-family="ui-monospace,monospace" font-size="20" font-weight="${isThreshold ? 'bold' : 'normal'}" fill="${isThreshold ? '#c0392b' : '#333'}" text-anchor="middle">ΔE ${s.targetDE}</text>`;
  if (isThreshold) {
    svg += `<text x="${x}" y="${MARGIN + HEADER_H}" font-family="ui-monospace,monospace" font-size="13" fill="#c0392b" text-anchor="middle">(fit threshold)</text>`;
  }
});

rows.forEach((row, ri) => {
  const y = MARGIN + HEADER_H + ri * (SH + LABEL_H + GAP);
  svg += `<text x="${MARGIN}" y="${y + SH/2 + 6}" font-family="ui-monospace,monospace" font-size="18" fill="#222">${row.name}</text>`;
  svg += `<text x="${MARGIN}" y="${y + SH/2 + 28}" font-family="ui-monospace,monospace" font-size="13" fill="#777">${row.hex} · chroma ${row.chroma0.toFixed(1)}</text>`;
  row.swatches.forEach((s, i) => {
    const x = MARGIN + ROW_LABEL_W + i * (SW + GAP);
    const isThreshold = Math.abs(s.targetDE - 15.3) < 0.01;
    const strokeColor = isThreshold ? '#c0392b' : '#ccc';
    const strokeWidth = isThreshold ? 3 : 1;
    // Left half = anchor (ΔE 0) for direct side-by-side comparison; right half = this step's colour.
    svg += `<rect x="${x}" y="${y}" width="${SW/2}" height="${SH}" fill="${row.hex}"/>`;
    svg += `<rect x="${x + SW/2}" y="${y}" width="${SW/2}" height="${SH}" fill="${s.hex}"/>`;
    svg += `<rect x="${x}" y="${y}" width="${SW}" height="${SH}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    svg += `<line x1="${x+SW/2}" y1="${y}" x2="${x+SW/2}" y2="${y+SH}" stroke="#ffffff" stroke-width="1"/>`;
    svg += `<text x="${x + SW/2}" y="${y + SH + 16}" font-family="ui-monospace,monospace" font-size="11" fill="#555" text-anchor="middle">${s.hex}</text>`;
  });
});

const html = `<title>Anchor ΔE swatch ladders</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
${svg}
</svg>
`;
fs.writeFileSync('deltaE_swatches.html', html);
console.log('written deltaE_swatches.html', W, 'x', H);
