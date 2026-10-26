const fs = require('fs');
const SCRATCH = '/tmp/claude-0/-home-user-studioartistrybyray-site/c6eea879-48e7-5eec-ad58-2ecf5e5135ff/scratchpad';

const pencils = JSON.parse(fs.readFileSync(SCRATCH + '/bvr_blind25_round1_answers.json', 'utf8'));

const parts = [];
parts.push('<!doctype html>');
parts.push('<html><head><meta charset="utf-8"><style>');
parts.push('  body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 50px; width: 1500px; box-sizing: border-box; }');
parts.push('  h1 { font-size: 28px; margin: 0 0 8px 0; }');
parts.push('  .sub { font-size: 17px; color: #555; margin: 0 0 30px 0; max-width: 1400px; }');
parts.push('  .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 24px; }');
parts.push('  .card { text-align: center; }');
parts.push('  .swatch { width: 220px; height: 220px; border: 2px solid #000; border-radius: 4px; }');
parts.push('  .id { font-size: 22px; font-weight: bold; margin-top: 8px; font-family: monospace; }');
parts.push('</style></head>');
parts.push('<body>');
parts.push('<h1>Blue-Red (Violet) arc — 25 fitting pencils, blind placement</h1>');
parts.push('<p class="sub">Each swatch is a real pencil that mathematically fits this arc (ΔE&lt;=15.3). Numbers are IDs only -- no name, no computed position. Using the blank ladder, place each ID: which row (ΔE/direction) and which t (position left-right)? Report as e.g. "ID 7: ΔE 11 tint, t=0.7".</p>');
parts.push('<div class="grid">');
for (const p of pencils) {
  parts.push('<div class="card">');
  parts.push('  <div class="swatch" style="background:' + p.hex + ';"></div>');
  parts.push('  <div class="id">ID ' + p.id + '</div>');
  parts.push('</div>');
}
parts.push('</div>');
parts.push('</body></html>');

fs.writeFileSync(SCRATCH + '/bvr_blind25_round1_sheet.html', parts.join('\n'));
console.log('written', pencils.length, 'cards');
