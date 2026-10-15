const fs = require('fs');
const results = JSON.parse(fs.readFileSync('../../data/chapter_owned_recipes.json', 'utf8'));

const SW = 90, GAP = 18, ROW_H = 120, MARGIN = 40, HEADER_H = 40;
const COLS_X = { target: 0, mix: 1, p1: 2, p2: 3 };
const LABEL_COL_W = 90;
const BAR_W = 140;
const W = MARGIN*2 + LABEL_COL_W + 4*(SW+GAP) + 40 + BAR_W + 60;
const H = MARGIN*2 + HEADER_H + results.length*ROW_H;

function accColor(acc) {
  if (acc >= 80) return '#2e7d32';
  if (acc >= 65) return '#e6a817';
  return '#c0392b';
}

let svg = '';
// Header
const headerY = MARGIN + HEADER_H - 12;
const xTarget = MARGIN + LABEL_COL_W;
const xMix = xTarget + SW + GAP;
const xP1 = xMix + SW + GAP;
const xP2 = xP1 + SW + GAP;
const xBar = xP2 + SW + 40;
['Target','Mix result','Pencil 1','Pencil 2'].forEach((lbl,i) => {
  const x = [xTarget,xMix,xP1,xP2][i] + SW/2;
  svg += `<text x="${x}" y="${headerY}" font-family="ui-monospace,monospace" font-size="13" fill="#555" text-anchor="middle">${lbl}</text>`;
});
svg += `<text x="${xBar}" y="${headerY}" font-family="ui-monospace,monospace" font-size="13" fill="#555">Accuracy</text>`;

results.forEach((r, i) => {
  const y = MARGIN + HEADER_H + i*ROW_H + 10;
  const cy = y + SW/2;
  // target
  svg += `<rect x="${xTarget}" y="${y}" width="${SW}" height="${SW}" fill="${r.target}" stroke="#999"/>`;
  svg += `<text x="${xTarget+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="11" fill="#555" text-anchor="middle">${r.target}</text>`;
  // mix
  svg += `<rect x="${xMix}" y="${y}" width="${SW}" height="${SW}" fill="${r.mixHex}" stroke="#999"/>`;
  svg += `<text x="${xMix+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="11" fill="#555" text-anchor="middle">${r.mixHex}</text>`;
  const yellowPart = Math.round((1-r.t)*100), bluePart = 100-yellowPart;
  svg += `<text x="${xMix+SW/2}" y="${y+SW+30}" font-family="ui-monospace,monospace" font-size="10" fill="#888" text-anchor="middle">${yellowPart}:${bluePart} (${r.arcKey})</text>`;
  // p1
  svg += `<rect x="${xP1}" y="${y}" width="${SW}" height="${SW}" fill="${r.p1.hex}" stroke="#999"/>`;
  svg += `<text x="${xP1+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="10" fill="#555" text-anchor="middle">${r.p1.name}</text>`;
  svg += `<text x="${xP1+SW/2}" y="${y+SW+29}" font-family="ui-monospace,monospace" font-size="9" fill="#999" text-anchor="middle">${r.p1.range}</text>`;
  // p2
  svg += `<rect x="${xP2}" y="${y}" width="${SW}" height="${SW}" fill="${r.p2.hex}" stroke="#999"/>`;
  svg += `<text x="${xP2+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="10" fill="#555" text-anchor="middle">${r.p2.name}</text>`;
  svg += `<text x="${xP2+SW/2}" y="${y+SW+29}" font-family="ui-monospace,monospace" font-size="9" fill="#999" text-anchor="middle">${r.p2.range}</text>`;
  // arrows
  [[xTarget,xMix],[xMix,xP1]].forEach(([a,b]) => {
    svg += `<text x="${(a+SW+b)/2}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="16" fill="#bbb" text-anchor="middle">${a===xMix?'←':'→'}</text>`;
  });
  svg += `<text x="${xP1+SW+GAP/2}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="14" fill="#bbb" text-anchor="middle">+</text>`;
  // accuracy bar
  const barY = cy - 10;
  svg += `<rect x="${xBar}" y="${barY}" width="${BAR_W}" height="20" fill="#eee" stroke="#ccc"/>`;
  svg += `<rect x="${xBar}" y="${barY}" width="${BAR_W*r.accuracy/100}" height="20" fill="${accColor(r.accuracy)}"/>`;
  svg += `<text x="${xBar+BAR_W+10}" y="${barY+15}" font-family="ui-monospace,monospace" font-size="15" font-weight="bold" fill="${accColor(r.accuracy)}">${r.accuracy}%</text>`;
  svg += `<text x="${xBar}" y="${barY+36}" font-family="ui-monospace,monospace" font-size="10" fill="#999">ΔE ${r.de.toFixed(1)}</text>`;
});

const html = `<title>Chapter colours — mix strategy from owned pencils</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${svg}</svg>`;
fs.writeFileSync('chapter_owned_full.html', html);
console.log('written', W, 'x', H);
