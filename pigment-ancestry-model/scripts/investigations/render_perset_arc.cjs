const fs = require('fs');
const all = JSON.parse(fs.readFileSync('../../data/chapter_perset_arc_results.json', 'utf8'));
function accuracyPct(de) { return Math.max(0, Math.round(100 - 2*de)); }
function accColor(acc) {
  if (acc >= 90) return '#1b5e20';
  if (acc >= 75) return '#2e7d32';
  if (acc >= 60) return '#e6a817';
  return '#c0392b';
}

const SETS = ['Castle Arts Gold', 'Castle Arts Soft Touch', 'Pablo', 'Polychromos'];

for (const setLabel of SETS) {
  const results = all.filter(r => r.setLabel === setLabel);
  const SW = 90, GAP = 18, ROW_H = 134, MARGIN = 40, HEADER_H = 50;
  const LABEL_COL_W = 90;
  const BAR_W = 140;
  const xTarget = MARGIN + LABEL_COL_W;
  const xMix = xTarget + SW + GAP;
  const xP1 = xMix + SW + GAP;
  const xP2 = xP1 + SW + GAP;
  const xBar = xP2 + SW + 40;
  const W = xBar + BAR_W + 70;
  const H = MARGIN*2 + HEADER_H + results.length*ROW_H;

  let svg = `<text x="${MARGIN}" y="${MARGIN+10}" font-family="ui-monospace,monospace" font-size="20" font-weight="bold" fill="#111">${setLabel} — restricted to pencils in the matching arc</text>`;
  const headerY = MARGIN + HEADER_H - 2;
  ['Target','Mix result','Pencil 1','Pencil 2'].forEach((lbl,i) => {
    const x = [xTarget,xMix,xP1,xP2][i] + SW/2;
    svg += `<text x="${x}" y="${headerY}" font-family="ui-monospace,monospace" font-size="13" fill="#555" text-anchor="middle">${lbl}</text>`;
  });
  svg += `<text x="${xBar}" y="${headerY}" font-family="ui-monospace,monospace" font-size="13" fill="#555">Accuracy</text>`;

  results.forEach((r, i) => {
    const y = MARGIN + HEADER_H + i*ROW_H + 10;
    const cy = y + SW/2;
    if (r.none) {
      svg += `<rect x="${xTarget}" y="${y}" width="${SW}" height="${SW}" fill="${r.target}" stroke="#999"/>`;
      svg += `<text x="${xTarget+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="11" fill="#555" text-anchor="middle">${r.target}</text>`;
      svg += `<text x="${xMix}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="13" fill="#c0392b">No ${r.arcKey} pencils in this set</text>`;
      return;
    }
    const acc = accuracyPct(r.de);
    const single = r.p1 === r.p2 || (r.p1.name === r.p2.name && r.p1.hex === r.p2.hex);
    svg += `<rect x="${xTarget}" y="${y}" width="${SW}" height="${SW}" fill="${r.target}" stroke="#999"/>`;
    svg += `<text x="${xTarget+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="11" fill="#555" text-anchor="middle">${r.target}</text>`;
    svg += `<rect x="${xMix}" y="${y}" width="${SW}" height="${SW}" fill="${r.mixHex}" stroke="#999"/>`;
    svg += `<text x="${xMix+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="11" fill="#555" text-anchor="middle">${r.mixHex}</text>`;
    if (!single) {
      const p1Part = Math.round((1-r.t)*100), p2Part = 100-p1Part;
      svg += `<text x="${xMix+SW/2}" y="${y+SW+30}" font-family="ui-monospace,monospace" font-size="10" fill="#888" text-anchor="middle">${p1Part}:${p2Part}</text>`;
    }
    svg += `<rect x="${xP1}" y="${y}" width="${SW}" height="${SW}" fill="${r.p1.hex}" stroke="#999"/>`;
    svg += `<text x="${xP1+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="10" fill="#555" text-anchor="middle">${r.p1.name}</text>`;
    if (!single) {
      svg += `<rect x="${xP2}" y="${y}" width="${SW}" height="${SW}" fill="${r.p2.hex}" stroke="#999"/>`;
      svg += `<text x="${xP2+SW/2}" y="${y+SW+16}" font-family="ui-monospace,monospace" font-size="10" fill="#555" text-anchor="middle">${r.p2.name}</text>`;
      svg += `<text x="${(xTarget+SW+xMix)/2}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="16" fill="#bbb" text-anchor="middle">→</text>`;
      svg += `<text x="${(xMix+SW+xP1)/2}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="16" fill="#bbb" text-anchor="middle">←</text>`;
      svg += `<text x="${xP1+SW+GAP/2}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="14" fill="#bbb" text-anchor="middle">+</text>`;
    } else {
      svg += `<text x="${(xTarget+SW+xMix)/2}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="16" fill="#bbb" text-anchor="middle">→</text>`;
      svg += `<text x="${(xMix+SW+xP1)/2}" y="${cy+5}" font-family="ui-monospace,monospace" font-size="16" fill="#bbb" text-anchor="middle">←</text>`;
      svg += `<text x="${xP1+SW/2}" y="${y+SW+30}" font-family="ui-monospace,monospace" font-size="9" fill="#999" text-anchor="middle">(single pencil)</text>`;
    }
    const barY = cy - 10;
    svg += `<rect x="${xBar}" y="${barY}" width="${BAR_W}" height="20" fill="#eee" stroke="#ccc"/>`;
    svg += `<rect x="${xBar}" y="${barY}" width="${BAR_W*acc/100}" height="20" fill="${accColor(acc)}"/>`;
    svg += `<text x="${xBar+BAR_W+10}" y="${barY+15}" font-family="ui-monospace,monospace" font-size="15" font-weight="bold" fill="${accColor(acc)}">${acc}%</text>`;
    svg += `<text x="${xBar}" y="${barY+36}" font-family="ui-monospace,monospace" font-size="10" fill="#999">ΔE ${r.de.toFixed(1)} · ${r.nCandidates} candidates</text>`;
  });

  const html = `<title>${setLabel} — chapter colours</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${svg}</svg>`;
  const slug = setLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  fs.writeFileSync(`perset_${slug}.html`, html);
  console.log('written', `perset_${slug}.html`, W, 'x', H);
}
