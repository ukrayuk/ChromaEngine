const fs = require('fs');
const SCRATCH = '/tmp/claude-0/-home-user-studioartistrybyray-site/c6eea879-48e7-5eec-ad58-2ecf5e5135ff/scratchpad';

const pencils = JSON.parse(fs.readFileSync(SCRATCH + '/ygb_blind5_round7_answers.json', 'utf8'));

const parts = [];
parts.push('<!doctype html>');
parts.push('<html><head><meta charset="utf-8"><style>');
parts.push('  body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 50px; width: 1280px; box-sizing: border-box; }');
parts.push('  h1 { font-size: 26px; margin: 0 0 8px 0; }');
parts.push('  .sub { font-size: 16px; color: #555; margin: 0 0 28px 0; max-width: 1200px; }');
parts.push('  .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 24px; }');
parts.push('  .card { text-align: center; }');
parts.push('  .swatch { width: 220px; height: 220px; border: 2px solid #000; border-radius: 4px; }');
parts.push('  .id { font-size: 22px; font-weight: bold; margin-top: 8px; font-family: monospace; }');
parts.push('</style></head>');
parts.push('<body>');
parts.push('<h1>Round 7 — 5 pencils (view-method trial)</h1>');
parts.push('<p class="sub">Zoom in only to pick the colour, then zoom OUT to the full ladder before placing -- testing whether viewing the whole arc at once changes accuracy. IDs only, shuffled, no name/position. Report as e.g. "ID 4: dE 9 shade, t=0.5" -- within +/-2 rows counts as a correct placement this round.</p>');
parts.push('<div class="grid">');
for (const p of pencils) {
  parts.push('<div class="card">');
  parts.push('  <div class="swatch" style="background:' + p.hex + ';"></div>');
  parts.push('  <div class="id">ID ' + p.id + '</div>');
  parts.push('</div>');
}
parts.push('</div>');
parts.push('</body></html>');

fs.writeFileSync(SCRATCH + '/ygb_blind5_round7_sheet.html', parts.join('\n'));
console.log('written', pencils.length, 'cards');
