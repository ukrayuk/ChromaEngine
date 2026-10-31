// Printer calibration check sheet (2026-10-31). No measurement device
// available (Ray has eyes only, not a colorimeter/spectrophotometer),
// so this isn't a numeric ICC-style profile -- it's a reference page
// built around the one genuinely reliable ground truth available
// without instruments: the real anchor pencils themselves. Print this
// at 100% scale (no "fit to page"), then hold each real anchor pencil
// directly against its printed swatch under consistent, neutral light
// (daylight or a daylight-balanced lamp, not warm incandescent) and
// note which direction (if any) the print drifts.
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'printer_calibration_sheet.html');

const ANCHORS = [
  { role: 'Warm Red', name: 'Vermilion', range: 'Castle Arts Gold Coloured Pencils', hex: '#e3212f', munsell: '6.51R 4.82/16.65' },
  { role: 'Warm Yellow', name: 'Medium Cadmium Yellow (Imit.)', range: "Caran d'Ache Luminance 6901", hex: '#ffd800', munsell: '4.68Y 8.69/13.41' },
  { role: 'Cool Yellow', name: 'Cadmium Yellow Lemon', range: 'Faber-Castell Polychromos 9201', hex: '#e7ed46', munsell: '1.54GY 9.04/10.85' },
  { role: 'Cool Blue', name: 'Cerulean Blue', range: 'Castle Arts Premium Soft Touch', hex: '#0088d6', munsell: '1.33PB 5.17/13.15' },
  { role: 'Warm Blue', name: 'Mauve Deep', range: 'Castle Arts Premium Soft Touch', hex: '#5a42ab', munsell: '9.59PB 3.57/13.86' },
  { role: 'Cool Red', name: 'Middle Purple Pink', range: 'Faber-Castell Polychromos 9201', hex: '#c13074', munsell: '6.39RP 4.46/13.88' },
];

const GRAY_RAMP = [0, 25, 50, 75, 100].map((pct) => {
  const v = Math.round(255 * pct / 100);
  const hex = '#' + [v, v, v].map((x) => x.toString(16).padStart(2, '0')).join('');
  return { pct, hex };
});

const PRIMARIES = [
  { name: 'Red', hex: '#ff0000' }, { name: 'Green', hex: '#00ff00' }, { name: 'Blue', hex: '#0000ff' },
  { name: 'Cyan', hex: '#00ffff' }, { name: 'Magenta', hex: '#ff00ff' }, { name: 'Yellow', hex: '#ffff00' },
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#ffffff' },
];

const parts = [];
parts.push('<!doctype html>');
parts.push('<html><head><meta charset="utf-8"><style>');
parts.push('  @page { size: A4 portrait; margin: 12mm; }');
parts.push('  body { font-family: Arial, sans-serif; margin: 0; color: #111; }');
parts.push('  h1 { font-size: 20px; margin: 0 0 4px 0; }');
parts.push('  h2 { font-size: 15px; margin: 18px 0 6px 0; border-bottom: 2px solid #333; padding-bottom: 2px; }');
parts.push('  .note { font-size: 11.5px; color: #333; line-height: 1.5; background: #f3f3f3; border: 1px solid #ccc; border-radius: 4px; padding: 10px 12px; margin: 8px 0 16px 0; }');
parts.push('  .note b { color: #000; }');
parts.push('  .anchors { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }');
parts.push('  .anchor { border: 1px solid #999; border-radius: 4px; overflow: hidden; }');
parts.push('  .swatch { height: 70px; border-bottom: 1px solid #999; }');
parts.push('  .label { padding: 6px 8px; font-size: 10.5px; line-height: 1.4; }');
parts.push('  .label .role { font-weight: bold; font-size: 12px; }');
parts.push('  .ramp { display: flex; border: 1px solid #999; border-radius: 4px; overflow: hidden; }');
parts.push('  .ramp div { flex: 1; height: 50px; display: flex; align-items: flex-end; justify-content: center; font-size: 10px; padding-bottom: 3px; font-family: monospace; }');
parts.push('  .prims { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }');
parts.push('  .prim { border: 1px solid #999; border-radius: 4px; overflow: hidden; }');
parts.push('  .prim .sw { height: 45px; } .prim .lb { font-size: 10px; font-family: monospace; padding: 3px 6px; }');
parts.push('  ol { font-size: 11.5px; line-height: 1.6; padding-left: 20px; margin: 4px 0; }');
parts.push('</style></head>');
parts.push('<body>');
parts.push('<h1>Printer calibration check sheet — Pigment Ancestry Model</h1>');
parts.push('<p class="note"><b>No colorimeter in use — this is an eye-based check, not a numeric profile.</b> '
  + 'Print this page at <b>100% / actual size</b> (not "fit to page" or "shrink to fit"). Turn off any automatic '
  + 'photo enhancement / vivid colour / colour boost setting in the print driver — you want the most literal, '
  + 'unmodified reproduction of the file, not the printer’s idea of a nicer photo. If your print software offers a colour '
  + 'management choice, try <b>"No colour management" / "Let printer manage colours"</b> first — the model’s hex values are plain sRGB, '
  + 'nothing in them expects an aggressive print-side transform. Compare under consistent, neutral light — daylight from a window or a '
  + 'daylight-balanced lamp (~5000-6500K), not warm incandescent bulbs, which will push everything yellow/orange regardless of the printer.</p>');

parts.push('<h2>1. The six anchor pencils — the real ground truth</h2>');
parts.push('<p class="note">Hold each real pencil directly against its printed swatch below, in the same light, touching if possible. '
  + 'This is the single most reliable check available without an instrument: these hex values were measured FROM these exact physical pencils, '
  + 'so if a printed swatch looks off from its own real pencil, that tells you the direction and rough size of your printer’s shift at that part of the colour wheel. Note what you see (e.g. "Cool Blue prints a bit more purple / less saturated than the real pencil") — even a rough by-eye note is useful, and the same bias likely applies to the printed arc ladders too.</p>');
parts.push('<div class="anchors">');
for (const a of ANCHORS) {
  parts.push('<div class="anchor">');
  parts.push('  <div class="swatch" style="background:' + a.hex + ';"></div>');
  parts.push('  <div class="label"><span class="role">' + a.role + '</span><br>' + a.name + '<br>' + a.range + '<br>' + a.hex + ' — ' + a.munsell + '</div>');
  parts.push('</div>');
}
parts.push('</div>');

parts.push('<h2>2. Neutral grey ramp — colour-cast check</h2>');
parts.push('<p class="note">These are pure greys (equal R=G=B) at 0/25/50/75/100%. If any step looks tinted — pink, green, yellow, blue — rather than a clean grey, that tint is your printer/paper’s own colour cast, and it will be pushing every other swatch on the page the same way.</p>');
parts.push('<div class="ramp">');
for (const g of GRAY_RAMP) parts.push('<div style="background:' + g.hex + '; color:' + (g.pct > 50 ? '#000' : '#fff') + ';">' + g.pct + '%</div>');
parts.push('</div>');

parts.push('<h2>3. Pure RGB/CMY primaries — hue sanity check</h2>');
parts.push('<p class="note">Rough sanity check only (these printers cannot reproduce fully saturated red/green/blue, so some flattening is expected and not a problem) — mainly useful for spotting a gross hue shift, e.g. "red" printing visibly orange or magenta-leaning.</p>');
parts.push('<div class="prims">');
for (const p of PRIMARIES) {
  parts.push('<div class="prim">');
  parts.push('  <div class="sw" style="background:' + p.hex + ';"></div>');
  parts.push('  <div class="lb">' + p.name + ' ' + p.hex + '</div>');
  parts.push('</div>');
}
parts.push('</div>');

parts.push('<h2>4. Using this going forward</h2>');
parts.push('<ol>');
parts.push('<li>Print this sheet and the arc-length ladder on the <b>same printer, paper, and print settings</b> — any bias found here should carry over consistently.</li>');
parts.push('<li>Keep this sheet next to the ladder while testing. If you notice a pencil placement looks "wrong" in a way that keeps happening in the same direction (e.g. always reads a bit too dark, or too blue), check whether that matches the bias you noted on the anchor swatches above — a systematic printer shift would explain it, not a placement error.</li>');
parts.push('<li>This is a one-time-ish check, not something to repeat every round — redo it only if you change printer, paper, or print settings.</li>');
parts.push('</ol>');

parts.push('</body></html>');

fs.writeFileSync(OUT, parts.join('\n'));
console.log('written', OUT);
