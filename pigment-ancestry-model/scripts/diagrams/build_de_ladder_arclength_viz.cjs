// Renders the arc-length (ΔE-uniform) ΔE ladder built by
// build_de_ladder_arclength.cjs. Same construction as the normal
// ladder viz (white row dividers, row labels on both edges) but the
// horizontal axis is u (cumulative arc-length fraction) instead of
// raw t -- equal steps across the page now mean roughly equal real
// colour distance everywhere, including the near-anchor zone that was
// badly compressed on the t axis.
// Pass --clean to omit the pencil swatches.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const ARC_LABEL = process.argv[2] || 'Yellow-Blue (Green)';
const OUT_PREFIX = process.argv[3] || 'ygb';
const CLEAN = process.argv.includes('--clean');

const ladder = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_de_ladder_arclength.json'), 'utf8'));
const fit = CLEAN ? [] : JSON.parse(fs.readFileSync(path.join(ROOT, 'data/' + OUT_PREFIX + '_fit_with_dl_arclength.json'), 'utf8'));

const BAR_WIDTH = 4080;
const ROW_HEIGHT = 46;
const SWATCH = 40;

function stops(points) {
  return points.map((p) => p.hex + ' ' + (p.u * 100).toFixed(2) + '%').join(', ');
}

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

const parts = [];
parts.push('<!doctype html>');
parts.push('<html><head><meta charset="utf-8"><style>');
parts.push('  body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 60px 280px 60px 280px; width: 4620px; box-sizing: border-box; }');
parts.push('  h1 { font-size: 34px; margin: 0 0 6px 0; }');
parts.push('  .sub { font-size: 20px; color: #555; margin: 0 0 24px 0; max-width: 3900px; }');
parts.push('  .ladder { position: relative; border: 2px solid #999; border-radius: 4px; }');
parts.push('  .rlabel { position: absolute; left: -210px; width: 195px; text-align: right; font-size: 17px; color: #444; font-family: monospace; }');
parts.push('  .rlabel.right { left: auto; right: -210px; text-align: left; }');
parts.push('  .row { width: ' + BAR_WIDTH + 'px; height: ' + ROW_HEIGHT + 'px; position: relative; border-bottom: 2px solid #fff; box-sizing: border-box; }');
parts.push('  .row:last-child { border-bottom: none; }');
parts.push('  .row.exact { outline: 3px solid #000; outline-offset: -2px; }');
parts.push('  .swatch { position: absolute; width: ' + SWATCH + 'px; height: ' + SWATCH + 'px; top: 3px; border: 2px solid #000; box-sizing: border-box; }');
parts.push('  .tscale { position: relative; width: ' + BAR_WIDTH + 'px; height: 46px; margin-top: 2px; border-top: 3px solid #333; }');
parts.push('  .tick { position: absolute; top: 0; width: 2px; height: 14px; background: #333; }');
parts.push('  .ttext { position: absolute; top: 18px; font-size: 20px; color: #222; font-family: monospace; transform: translateX(-50%); }');
parts.push('  .endrow { width: ' + BAR_WIDTH + 'px; position: relative; height: 30px; margin-top: 8px; }');
parts.push('  .endlabel { position: absolute; top: 0; font-size: 22px; color: #444; }');
parts.push('  .endlabel.left { left: 0; } .endlabel.right { right: 0; text-align: right; }');
parts.push('</style></head>');
parts.push('<body>');
parts.push('<h1>' + ARC_LABEL + ' — ' + (CLEAN ? 'blank' : 'full') + ' ΔE ladder, arc-length (ΔE-uniform) axis</h1>');
if (CLEAN) {
  parts.push('<p class="sub">Same real arc and anchors as the standard ladder -- only the horizontal axis changed. Equal steps across the page now mean roughly equal real colour distance everywhere (the standard ladder\'s t axis moved 6.6 to ~82 deltaE per 0.1 step depending on location; this one holds to roughly 15-19 throughout). Place a real pencil by eye: which row (deltaE/direction) and which u (position left-right) does it look closest to? Report as e.g. "deltaE 11 tint, u=0.7".</p>');
} else {
  parts.push('<p class="sub">Arc-length (ΔE-uniform) axis: u is the pencil\'s cumulative-colour-distance position along the arc, not its raw mixing ratio t. Each fitting pencil sits on the row matching its own real ΔL, at its true u-position.</p>');
}
parts.push('<div class="ladder">');
for (const r of rowOrder) {
  const cls = r.dl === 0 ? 'row exact' : 'row';
  parts.push('<div class="' + cls + '" style="background: linear-gradient(to right, ' + stops(ladder[r.key]) + ');">');
  parts.push('  <div class="rlabel" style="top:12px;">' + r.label + '</div>');
  parts.push('  <div class="rlabel right" style="top:12px;">' + r.label + '</div>');
  const rowPencils = byRow[r.key] || [];
  for (const p of rowPencils) {
    const left = (p.u * BAR_WIDTH) - (SWATCH / 2);
    parts.push('  <div class="swatch" style="left:' + left.toFixed(1) + 'px; background:' + p.hex + ';" title="' + p.name.replace(/"/g, '') + ' dL=' + p.dL + '"></div>');
  }
  parts.push('</div>');
}
if (CLEAN) {
  parts.push('<div class="tscale">');
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const x = u * BAR_WIDTH;
    parts.push('  <div class="tick" style="left:' + x.toFixed(1) + 'px;"></div>');
    parts.push('  <div class="ttext" style="left:' + x.toFixed(1) + 'px;">' + u.toFixed(1) + '</div>');
  }
  parts.push('</div>');
} else {
  parts.push('<div class="endrow"><div class="endlabel left">u=0</div><div class="endlabel right">u=1</div></div>');
}
parts.push('</div>');
parts.push('</body></html>');

const outName = OUT_PREFIX + '_de_ladder_arclength' + (CLEAN ? '_clean' : '') + '.html';
fs.writeFileSync(path.join(__dirname, outName), parts.join('\n'));
console.log('written scripts/diagrams/' + outName);
