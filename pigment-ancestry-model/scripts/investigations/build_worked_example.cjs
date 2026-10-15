const fs = require('fs');
const { hexToLabD65, labDist } = require('../../lib.cjs');
const L1 = JSON.parse(fs.readFileSync('../../data/level1_pure_rows.json', 'utf8'));

const TARGET = '#80c300';
const targetLab = hexToLabD65(TARGET);
const ygb = L1['Yellow-Blue (Green)'].points;

// Use the clean G3 construction point (t=1/8) rather than the marginally
// closer G8 point -- a reader can actually reproduce "1 part in 8" by eye,
// not a 257-step fraction.
const g3Point = ygb.find(p => p.gen === 3 && Math.abs(p.t - 0.125) < 0.001);
const dE = labDist(targetLab, hexToLabD65(g3Point.hex));

const COOL_YELLOW = '#f6e83b', COOL_BLUE = '#0082b5';

const items = [
  { label: 'Target (chapter colour)', hex: TARGET, sub: TARGET },
  { label: 'Nearest point on the YgB arc', hex: g3Point.hex, sub: `t=0.125 (G3) · ΔE ${dE.toFixed(1)}` },
  { label: 'Cool Yellow (arc anchor)', hex: COOL_YELLOW, sub: 'Lemon Cadmium' },
  { label: 'Cool Blue (arc anchor)', hex: COOL_BLUE, sub: 'Cerulean Blue' },
];

const SW = 200, GAP = 40, LABEL_H = 56, MARGIN = 40;
const W = MARGIN*2 + items.length*SW + (items.length-1)*GAP;
const H = MARGIN*2 + SW + LABEL_H;

let svg = '';
items.forEach((it, i) => {
  const x = MARGIN + i*(SW+GAP);
  const y = MARGIN;
  svg += `<rect x="${x}" y="${y}" width="${SW}" height="${SW}" fill="${it.hex}" stroke="#999" stroke-width="1"/>`;
  svg += `<text x="${x+SW/2}" y="${y+SW+22}" font-family="ui-monospace,monospace" font-size="13" fill="#222" text-anchor="middle">${it.label}</text>`;
  svg += `<text x="${x+SW/2}" y="${y+SW+42}" font-family="ui-monospace,monospace" font-size="13" fill="#666" text-anchor="middle">${it.sub}</text>`;
  if (i < items.length-1) {
    const ax = x+SW+6, ay = y+SW/2;
    svg += `<text x="${ax+GAP/2-6}" y="${ay+5}" font-family="ui-monospace,monospace" font-size="20" fill="#999" text-anchor="middle">→</text>`;
  }
});

const html = `<title>Worked example — #80c300</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
${svg}
</svg>
`;
fs.writeFileSync('worked_example.html', html);
console.log('G3 point hex:', g3Point.hex, ' dE from target:', dE.toFixed(2));
console.log('written', W, 'x', H);
