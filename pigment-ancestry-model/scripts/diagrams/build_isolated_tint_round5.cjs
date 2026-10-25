// Round 5: isolated-tint test. Each pencil gets its OWN vertical ladder
// column built at its own real t (so the "which hue position" judgment
// is removed entirely -- the column is already at the right place).
// Ray only has to answer "which row" for each column. Tests Ray's
// hypothesis that tints are easier to place once decoupled from the
// main colour-path (t) judgment.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, mixSpectralTrueLab } = require('/home/user/chromaengine/pigment-ancestry-model/lib.cjs');

const ROOT = '/home/user/chromaengine/pigment-ancestry-model';
const SCRATCH = '/tmp/claude-0/-home-user-studioartistrybyray-site/c6eea879-48e7-5eec-ad58-2ecf5e5135ff/scratchpad';

const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const arc = L1['Yellow-Blue (Green)'].points;
const arcLabs = arc.map((p) => ({ t: p.t, lab: hexToLabD65(p.hex) }));

function nearestArcByT(t) {
  let best = Infinity, bestP = null;
  for (const p of arcLabs) { const d = Math.abs(p.t - t); if (d < best) { best = d; bestP = p; } }
  return bestP;
}
function labToHex(lab) {
  return mixSpectralTrueLab(lab, mixSpectralTrueLab(lab, '#808080', 0.5), 0.001);
}

const pencils = JSON.parse(fs.readFileSync(SCRATCH + '/ygb_isolated_tint_round5_answers.json', 'utf8'));

const MAX_ROW = 15;
const rows = [];
for (let s = MAX_ROW; s >= 1; s--) rows.push({ s, label: 'tint +' + s });
rows.push({ s: 0, label: 'EXACT' });

const COL_WIDTH = 130;
const ROW_HEIGHT = 32;

const parts = [];
parts.push('<!doctype html>');
parts.push('<html><head><meta charset="utf-8"><style>');
parts.push('  body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 50px; width: 1700px; box-sizing: border-box; }');
parts.push('  h1 { font-size: 26px; margin: 0 0 8px 0; }');
parts.push('  .sub { font-size: 16px; color: #555; margin: 0 0 24px 0; max-width: 1600px; }');
parts.push('  .board { display: flex; align-items: flex-start; }');
parts.push('  .rowlabels { display: flex; flex-direction: column; margin-right: 6px; }');
parts.push('  .rowlabels .cell { height: ' + ROW_HEIGHT + 'px; font-size: 13px; color: #444; font-family: monospace; display: flex; align-items: center; justify-content: flex-end; width: 80px; padding-right: 6px; box-sizing: border-box; }');
parts.push('  .col { width: ' + COL_WIDTH + 'px; margin-right: 10px; }');
parts.push('  .col .idlabel { text-align: center; font-weight: bold; font-family: monospace; font-size: 16px; margin-bottom: 4px; }');
parts.push('  .col .cell { height: ' + ROW_HEIGHT + 'px; border-left: 1px solid rgba(0,0,0,0.15); border-right: 1px solid rgba(0,0,0,0.15); }');
parts.push('  .col .cell.exact { outline: 2px solid #000; outline-offset: -1px; }');
parts.push('  .col .cell:first-child { border-top: 1px solid rgba(0,0,0,0.15); }');
parts.push('  .col .cell:last-child { border-bottom: 1px solid rgba(0,0,0,0.15); }');
parts.push('  .swatchrow { display: flex; margin-top: 30px; }');
parts.push('  .swatchcard { width: ' + COL_WIDTH + 'px; margin-right: 10px; text-align: center; }');
parts.push('  .swatchcard .swatch { width: ' + (COL_WIDTH - 20) + 'px; height: 90px; margin: 0 auto; border: 2px solid #000; border-radius: 3px; }');
parts.push('  .swatchcard .idlabel { font-weight: bold; font-family: monospace; font-size: 16px; margin-top: 6px; }');
parts.push('  .spacer { width: 86px; flex: none; }');
parts.push('</style></head>');
parts.push('<body>');
parts.push('<h1>Round 5 -- isolated tint test (t removed from the judgment)</h1>');
parts.push('<p class="sub">Each column below is already built at that pencil’s own correct position on the Yellow-Blue arc -- you do not need to find t, only how light. Compare each swatch (bottom row) against its own numbered column above and report just the row, e.g. "ID 4: tint +6".</p>');
parts.push('<div class="board">');
parts.push('<div class="rowlabels"><div class="cell"></div>');
for (const r of rows) parts.push('<div class="cell">' + r.label + '</div>');
parts.push('</div>');
for (const p of pencils) {
  const arcPt = nearestArcByT(p.t);
  parts.push('<div class="col">');
  parts.push('<div class="idlabel">ID ' + p.id + '</div>');
  for (const r of rows) {
    const lab = [Math.min(100, arcPt.lab[0] + r.s), arcPt.lab[1], arcPt.lab[2]];
    const hex = labToHex(lab);
    const cls = r.s === 0 ? 'cell exact' : 'cell';
    parts.push('<div class="' + cls + '" style="background:' + hex + ';"></div>');
  }
  parts.push('</div>');
}
parts.push('</div>');
parts.push('<div class="swatchrow">');
parts.push('<div class="spacer"></div>');
for (const p of pencils) {
  parts.push('<div class="swatchcard"><div class="swatch" style="background:' + p.hex + ';"></div><div class="idlabel">ID ' + p.id + '</div></div>');
}
parts.push('</div>');
parts.push('</body></html>');

fs.writeFileSync(SCRATCH + '/ygb_isolated_tint_round5.html', parts.join('\n'));
console.log('written', pencils.length, 'columns');
