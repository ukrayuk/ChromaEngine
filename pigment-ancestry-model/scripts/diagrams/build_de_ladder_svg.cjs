// True-vector SVG version of the ΔE ladder (standard build_de_ladder_viz.cjs
// and arc-length build_de_ladder_arclength_viz.cjs were both HTML/CSS pages,
// screenshotted to PNG to send to Ray -- raster, so scaling up in Canva for
// printing blurs the row labels/axis text and can shift swatch colours
// slightly through resampling. This builds the same ladder as a real <svg>
// (rect fills + <text> elements, no raster anywhere) so Canva imports it as
// editable vector: text stays crisp and colour fills stay flat/exact at any
// print size.
//
// Usage: node build_de_ladder_svg.cjs "<Arc Label>" <prefix> <t|u> [--clean] [--arclength]
//   <t|u>        which axis field the data uses (t = raw mixing ratio,
//                u = arc-length/ΔE-uniform position)
//   --clean      omit pencil swatches (blank version to place real pencils against)
//   --arclength  read the _arclength data files instead of the plain ones
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const ARC_LABEL = process.argv[2] || 'Yellow-Blue (Green)';
const OUT_PREFIX = process.argv[3] || 'ygb';
const AXIS = process.argv[4] === 'u' ? 'u' : 't';
const CLEAN = process.argv.includes('--clean');
const ARCLEN = process.argv.includes('--arclength');

const suffix = ARCLEN ? '_arclength' : '';
const ladder = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_de_ladder' + suffix + '.json'), 'utf8'));
const fit = CLEAN ? [] : JSON.parse(fs.readFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_fit_with_dl' + suffix + '.json'), 'utf8'));

const BAR_WIDTH = 4080;
const ROW_HEIGHT = 46;
const ROW_GAP = 2;
const SWATCH = 40;
const LEFT_MARGIN = 280;
const RIGHT_MARGIN = 280;
const TOP_MARGIN = 140;
const LABEL_GUTTER = 210;
const FOOTER_H = CLEAN ? 76 : 60;

const rowOrder = [];
for (let s = 15; s >= 1; s--) rowOrder.push({ key: 'tint_' + s, label: 'tint +' + s, dl: s });
rowOrder.push({ key: 'tint_0', label: 'EXACT ARC (ΔL=0)', dl: 0 });
for (let s = 1; s <= 15; s++) rowOrder.push({ key: 'shade_' + s, label: 'shade −' + s, dl: -s });

function rowFor(dl) {
  const r = Math.round(dl);
  if (r === 0) return 'tint_0';
  if (r > 0) return 'tint_' + Math.min(15, r);
  return 'shade_' + Math.min(15, -r);
}
const byRow = {};
for (const p of fit) {
  const k = rowFor(p.dL);
  if (!byRow[k]) byRow[k] = [];
  byRow[k].push(p);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ladderH = rowOrder.length * ROW_HEIGHT + (rowOrder.length - 1) * ROW_GAP;
const svgW = LEFT_MARGIN + LABEL_GUTTER + BAR_WIDTH + LABEL_GUTTER + RIGHT_MARGIN;
const svgH = TOP_MARGIN + ladderH + FOOTER_H + 60;
const ladderX = LEFT_MARGIN + LABEL_GUTTER;
const ladderY = TOP_MARGIN;

const svg = [];
svg.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + svgW + '" height="' + svgH + '" viewBox="0 0 ' + svgW + ' ' + svgH + '" font-family="Arial, sans-serif">');
svg.push('<rect x="0" y="0" width="' + svgW + '" height="' + svgH + '" fill="#ffffff"/>');

svg.push('<text x="' + LEFT_MARGIN + '" y="48" font-size="34" fill="#000">' + esc(ARC_LABEL + ' — ' + (CLEAN ? 'blank' : 'full') + ' ΔE ladder' + (ARCLEN ? ', arc-length (ΔE-uniform) axis' : ', 0 to 15 (lightness direction)')) + '</text>');

const subtitleLines = CLEAN
  ? (ARCLEN
    ? ['Same real arc and anchors as the standard ladder — only the horizontal axis changed. Equal steps across the page now mean roughly equal real colour', 'distance everywhere. Place a real pencil by eye: which row (ΔE/direction) and which u (position left-right) does it look closest to? Report as e.g. "ΔE 11 tint, u=0.7".']
    : ['Every integer step of lightness offset from the exact arc colour, both directions.', 'Place a real pencil by eye: which row (ΔE/direction) and which t (position left-right) does it look closest to? Report as e.g. "ΔE 11 tint, t=0.7".'])
  : (ARCLEN
    ? ['Arc-length (ΔE-uniform) axis: u is the pencil’s cumulative-colour-distance position along the arc, not its raw mixing ratio t.', 'Each fitting pencil sits on the row matching its own real ΔL, at its true u-position.']
    : ['Every integer step of lightness offset from the exact arc colour, both directions. The thick-bordered row is the exact arc (ΔL=0).', 'Each fitting pencil sits on the row matching its own real ΔL from its nearest arc point, not just at the two extremes.']);
let subY = 78;
for (const line of subtitleLines) {
  svg.push('<text x="' + LEFT_MARGIN + '" y="' + subY + '" font-size="20" fill="#555">' + esc(line) + '</text>');
  subY += 26;
}

svg.push('<defs>');
rowOrder.forEach((r, i) => {
  const pts = ladder[r.key];
  const stops = pts.map((p) => '<stop offset="' + (p[AXIS] * 100).toFixed(2) + '%" stop-color="' + p.hex + '"/>').join('');
  svg.push('<linearGradient id="grad' + i + '" x1="0%" y1="0%" x2="100%" y2="0%">' + stops + '</linearGradient>');
});
svg.push('</defs>');

svg.push('<rect x="' + ladderX + '" y="' + ladderY + '" width="' + BAR_WIDTH + '" height="' + ladderH + '" fill="none" stroke="#999" stroke-width="2" rx="4"/>');

rowOrder.forEach((r, i) => {
  const rowY = ladderY + i * (ROW_HEIGHT + ROW_GAP);
  svg.push('<rect x="' + ladderX + '" y="' + rowY + '" width="' + BAR_WIDTH + '" height="' + ROW_HEIGHT + '" fill="url(#grad' + i + ')"/>');
  if (r.dl === 0) {
    svg.push('<rect x="' + (ladderX + 1.5) + '" y="' + (rowY + 1.5) + '" width="' + (BAR_WIDTH - 3) + '" height="' + (ROW_HEIGHT - 3) + '" fill="none" stroke="#000" stroke-width="3"/>');
  }
  const labelY = rowY + ROW_HEIGHT / 2 + 6;
  svg.push('<text x="' + (ladderX - 15) + '" y="' + labelY + '" font-size="17" font-family="monospace" fill="#444" text-anchor="end">' + esc(r.label) + '</text>');
  svg.push('<text x="' + (ladderX + BAR_WIDTH + 15) + '" y="' + labelY + '" font-size="17" font-family="monospace" fill="#444" text-anchor="start">' + esc(r.label) + '</text>');
  const rowPencils = byRow[r.key] || [];
  for (const p of rowPencils) {
    const cx = ladderX + p[AXIS] * BAR_WIDTH;
    const swY = rowY + 3;
    svg.push('<rect x="' + (cx - SWATCH / 2).toFixed(1) + '" y="' + swY + '" width="' + SWATCH + '" height="' + SWATCH + '" fill="' + p.hex + '" stroke="#000" stroke-width="2"><title>' + esc(p.name) + ' dL=' + p.dL + '</title></rect>');
  }
});

const ladderBottom = ladderY + ladderH;
if (CLEAN) {
  const scaleY = ladderBottom + 2;
  svg.push('<line x1="' + ladderX + '" y1="' + scaleY + '" x2="' + (ladderX + BAR_WIDTH) + '" y2="' + scaleY + '" stroke="#333" stroke-width="3"/>');
  for (let i = 0; i <= 10; i++) {
    const frac = i / 10;
    const x = ladderX + frac * BAR_WIDTH;
    svg.push('<line x1="' + x.toFixed(1) + '" y1="' + scaleY + '" x2="' + x.toFixed(1) + '" y2="' + (scaleY + 14) + '" stroke="#333" stroke-width="2"/>');
    svg.push('<text x="' + x.toFixed(1) + '" y="' + (scaleY + 34) + '" font-size="20" font-family="monospace" fill="#222" text-anchor="middle">' + frac.toFixed(1) + '</text>');
  }
} else {
  const endY = ladderBottom + 30;
  svg.push('<text x="' + ladderX + '" y="' + endY + '" font-size="22" fill="#444" text-anchor="start">' + AXIS + '=0</text>');
  svg.push('<text x="' + (ladderX + BAR_WIDTH) + '" y="' + endY + '" font-size="22" fill="#444" text-anchor="end">' + AXIS + '=1</text>');
}

svg.push('</svg>');

const outName = OUT_PREFIX + '_de_ladder' + suffix + (CLEAN ? '_clean' : '') + '.svg';
fs.writeFileSync(path.join(__dirname, outName), svg.join('\n'));
console.log('written scripts/diagrams/' + outName);
