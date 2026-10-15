const fs = require('fs');
const { hexToLabD65, labDist } = require('../../lib.cjs');
function chroma(lab) { return Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]); }
function hueDeg(lab) { let h = Math.atan2(lab[2], lab[1]) * 180 / Math.PI; if (h < 0) h += 360; return h; }

const L1 = JSON.parse(fs.readFileSync('../../data/level1_pure_rows.json', 'utf8'));
const L2 = JSON.parse(fs.readFileSync('../../data/level2_cross_rows.json', 'utf8'));

const COOL_YELLOW = '#f6e83b', COOL_BLUE = '#0082b5';
const WARM_BLUE = '#5f6bca', COOL_RED = '#c62d6a';
const TARGET = '#497249';
const START_REF = '#00bb00';

const idx = L1['Yellow-Blue (Green)'].points.findIndex(p => Math.abs(p.t - 0.4297) < 0.001 && p.gen === 7);
const yPt = L1['Yellow-Blue (Green)'].points[idx];
const bPt = L1['Blue-Red (Violet)'].points[idx];
const mPt = L2['YgB × BvR — like'].points[idx];

const yLab = hexToLabD65(yPt.hex), bLab = hexToLabD65(bPt.hex), mLab = hexToLabD65(mPt.hex), tLab = hexToLabD65(TARGET);
const dE = labDist(mLab, tLab);

function fmt(lab) { return `L${lab[0].toFixed(0)} C${chroma(lab).toFixed(0)} H${hueDeg(lab).toFixed(0)}°`; }

const row1 = [
  { label: 'Cool Yellow', hex: COOL_YELLOW, sub: 'Lemon Cadmium' },
  { label: 'Cool Blue', hex: COOL_BLUE, sub: 'Cerulean Blue' },
  { label: 'YgB arc @ t=' + yPt.t.toFixed(3) + ' (G' + yPt.gen + ')', hex: yPt.hex, sub: fmt(yLab) + ' · near ' + START_REF },
];
const row2 = [
  { label: 'Warm Blue', hex: WARM_BLUE, sub: '8PB 4.8/13' },
  { label: 'Cool Red', hex: COOL_RED, sub: '8.25RP 4.5/14' },
  { label: 'BvR arc @ t=' + bPt.t.toFixed(3) + ' (G' + bPt.gen + ')', hex: bPt.hex, sub: fmt(bLab) },
];
const row3 = [
  { label: 'YgB green (row 1 result)', hex: yPt.hex, sub: fmt(yLab) },
  { label: 'BvR violet (row 2 result)', hex: bPt.hex, sub: fmt(bLab) },
  { label: 'Level 2 cross-mix', hex: mPt.hex, sub: fmt(mLab) },
  { label: 'Target', hex: TARGET, sub: fmt(tLab) + ' · ΔE ' + dE.toFixed(1) },
];

const SW = 180, GAP = 36, LABEL_H = 56, MARGIN = 40, ROW_GAP = 70;
const maxItems = 4;
const W = MARGIN * 2 + maxItems * SW + (maxItems - 1) * GAP;
const H = MARGIN * 2 + 3 * SW + 3 * LABEL_H + 2 * ROW_GAP + 30;

function drawRow(items, y, note) {
  let svg = '';
  if (note) svg += `<text x="${MARGIN}" y="${y - 10}" font-family="ui-monospace,monospace" font-size="14" fill="#333" font-weight="bold">${note}</text>`;
  items.forEach((it, i) => {
    const x = MARGIN + i * (SW + GAP);
    svg += `<rect x="${x}" y="${y}" width="${SW}" height="${SW}" fill="${it.hex}" stroke="#999" stroke-width="1"/>`;
    svg += `<text x="${x + SW / 2}" y="${y + SW + 22}" font-family="ui-monospace,monospace" font-size="13" fill="#222" text-anchor="middle">${it.label}</text>`;
    svg += `<text x="${x + SW / 2}" y="${y + SW + 42}" font-family="ui-monospace,monospace" font-size="13" fill="#666" text-anchor="middle">${it.sub}</text>`;
    if (i < items.length - 1) {
      const ax = x + SW + 6, ay = y + SW / 2;
      svg += `<text x="${ax + GAP / 2 - 6}" y="${ay + 5}" font-family="ui-monospace,monospace" font-size="20" fill="#999" text-anchor="middle">→</text>`;
    }
  });
  return svg;
}

let svg = '';
let y = MARGIN + 20;
svg += drawRow(row1, y, 'Level 1 — mix the green (YgB arc)');
y += SW + LABEL_H + ROW_GAP;
svg += drawRow(row2, y, 'Level 1 — mix the violet (BvR arc)');
y += SW + LABEL_H + ROW_GAP;
svg += drawRow(row3, y, 'Level 2 — cross-mix green × violet (YgB×BvR, "like" pairing) → target');

const html = `<title>00bb00 → 497249 via a Level 2 cross-mix</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
${svg}
</svg>
`;
fs.writeFileSync('crossarc_demo.html', html);
console.log('written', W, 'x', H);
console.log('dE result->target:', dE.toFixed(2));
