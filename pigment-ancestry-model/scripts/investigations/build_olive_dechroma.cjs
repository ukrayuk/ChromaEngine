const fs = require('fs');
const { hexToLabD65, labDist } = require('../../lib.cjs');
function chroma(lab) { return Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]); }
function hueDeg(lab) { let h = Math.atan2(lab[2], lab[1]) * 180 / Math.PI; if (h < 0) h += 360; return h; }

const L1 = JSON.parse(fs.readFileSync('../../data/level1_pure_rows.json', 'utf8'));
const ygb = L1['Yellow-Blue (Green)'].points;

const COOL_YELLOW = '#f6e83b', COOL_BLUE = '#0082b5';
const OLIVE = '#818659'; // Caran d'Ache Pablo "Olive", 2.26GY 5.33/3.49

// Clean low-generation point closest to Olive's hue (112.0 deg): G5, t=1/32.
const greenPoint = ygb.find(p => p.gen === 5 && Math.abs(p.t - 0.03125) < 0.0001);
const greenLab = hexToLabD65(greenPoint.hex);
const oliveLab = hexToLabD65(OLIVE);
const gC = chroma(greenLab), oC = chroma(oliveLab);
const gH = hueDeg(greenLab), oH = hueDeg(oliveLab);
const dE = labDist(greenLab, oliveLab);

console.log('Green (G5, t=1/32):', greenPoint.hex, ' L=' + greenLab[0].toFixed(1), ' C=' + gC.toFixed(1), ' H=' + gH.toFixed(1));
console.log('Olive target:       ', OLIVE, ' L=' + oliveLab[0].toFixed(1), ' C=' + oC.toFixed(1), ' H=' + oH.toFixed(1));
console.log('dL =', (oliveLab[0] - greenLab[0]).toFixed(1), ' dC =', (oC - gC).toFixed(1), ' dH =', Math.min(Math.abs(gH - oH), 360 - Math.abs(gH - oH)).toFixed(1), ' dE =', dE.toFixed(1));

const row1 = [
  { label: 'Cool Yellow (arc anchor)', hex: COOL_YELLOW, sub: 'Lemon Cadmium' },
  { label: 'Cool Blue (arc anchor)', hex: COOL_BLUE, sub: 'Cerulean Blue' },
  { label: 'Green — chosen via arc', hex: greenPoint.hex, sub: `t=1/32 (G5) · L${greenLab[0].toFixed(0)} C${gC.toFixed(0)} H${gH.toFixed(0)}°` },
];
const row2 = [
  { label: 'Green (same as above)', hex: greenPoint.hex, sub: `L${greenLab[0].toFixed(0)} C${gC.toFixed(0)} H${gH.toFixed(0)}°` },
  { label: 'Olive (target role colour)', hex: OLIVE, sub: `L${oliveLab[0].toFixed(0)} C${oC.toFixed(0)} H${oH.toFixed(0)}° · Pablo "Olive"` },
];

const SW = 200, GAP = 40, LABEL_H = 56, MARGIN = 40, ROW_GAP = 90;
const maxItems = Math.max(row1.length, row2.length);
const W = MARGIN * 2 + maxItems * SW + (maxItems - 1) * GAP;
const H = MARGIN * 2 + 2 * SW + 2 * LABEL_H + ROW_GAP;

function drawRow(items, y, note) {
  let svg = '';
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
  if (note) svg += `<text x="${MARGIN}" y="${y - 10}" font-family="ui-monospace,monospace" font-size="14" fill="#333" font-weight="bold">${note}</text>`;
  return svg;
}

let svg = '';
svg += drawRow(row1, MARGIN + 20, 'Step 1 — mix a green from the YgB arc (chapter 3 style)');
const y2 = MARGIN + 20 + SW + LABEL_H + ROW_GAP;
svg += drawRow(row2, y2, `Step 2 — dechroma to olive (ΔL ${(oliveLab[0] - greenLab[0]).toFixed(0)}, ΔC ${(oC - gC).toFixed(0)}, ΔH ${Math.min(Math.abs(gH - oH), 360 - Math.abs(gH - oH)).toFixed(0)}° — value drops with it, not chroma alone)`);

const html = `<title>Green → Olive via dechroma</title>
<style> body { margin: 0; background: #fff; } svg { display: block; margin: 20px auto; } </style>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
${svg}
</svg>
`;
fs.writeFileSync('olive_dechroma.html', html);
console.log('written', W, 'x', H);
