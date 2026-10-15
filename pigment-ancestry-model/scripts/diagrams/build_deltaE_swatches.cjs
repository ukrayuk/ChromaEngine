const fs = require('fs');
const { hexToLabD65, labDist } = require('../../lib.cjs');

// Lab D65 -> sRGB hex (inverse of lib.cjs's hexToLabD65), standard CIE formulas,
// same Xn/Yn/Zn whitepoint as lib.cjs for a consistent round trip.
const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
function finv(t) { const t3 = t*t*t; return t3 > 0.008856 ? t3 : (t - 16/116) / 7.787; }
function gamma(c) { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92*c : 1.055*Math.pow(c, 1/2.4) - 0.055; }
function labToHex(lab) {
  const [L,a,b] = lab;
  const fy = (L+16)/116, fx = fy + a/500, fz = fy - b/200;
  const X = Xn*finv(fx), Y = Yn*finv(fy), Z = Zn*finv(fz);
  let r =  3.2406*X -1.5372*Y -0.4986*Z;
  let g = -0.9689*X +1.8758*Y +0.0415*Z;
  let bl = 0.0557*X -0.2040*Y +1.0570*Z;
  r = gamma(r); g = gamma(g); bl = gamma(bl);
  const to255 = v => Math.round(Math.max(0, Math.min(1, v)) * 255);
  const hex = v => to255(v).toString(16).padStart(2, '0');
  return '#' + hex(r) + hex(g) + hex(bl);
}

// Round-trip sanity check
const test = '#e3212f';
const roundTrip = labToHex(hexToLabD65(test));
console.log('round-trip check:', test, '->', roundTrip, labDist(hexToLabD65(test), hexToLabD65(roundTrip)).toFixed(3), 'dE (should be ~0)');

function chroma(lab) { return Math.sqrt(lab[1]*lab[1] + lab[2]*lab[2]); }

const ANCHORS = [
  { name: 'Warm Red — Vermilion', hex: '#e3212f' },
  { name: 'Warm Yellow — Cadmium Yellow (Imit.)', hex: '#ffd800' },
  { name: 'Cool Yellow — Lemon Cadmium', hex: '#f6e83b' },
  { name: 'Cool Blue — Cerulean Blue', hex: '#0082b5' },
  { name: 'Warm Blue — synthetic 8PB', hex: '#5f6bca' },
  { name: 'Cool Red — synthetic 8.25RP', hex: '#c62d6a' },
];

const STEPS = [0, 2, 4, 6, 8, 10, 12, 14, 15.3, 17, 19, 21, 24];

const rows = ANCHORS.map(anchor => {
  const lab0 = hexToLabD65(anchor.hex);
  const c0 = chroma(lab0);
  const swatches = STEPS.map(targetDE => {
    const t = Math.min(1, targetDE / c0); // desaturate toward same-L grey
    const lab = [lab0[0], lab0[1]*(1-t), lab0[2]*(1-t)];
    const hex = labToHex(lab);
    const actualDE = labDist(lab0, hexToLabD65(hex));
    return { targetDE, actualDE, hex, clamped: t >= 1 };
  });
  return { ...anchor, lab0, chroma0: c0, swatches };
});

fs.writeFileSync('deltaE_swatch_data.json', JSON.stringify(rows, null, 2));
console.log('\nPer-anchor chroma (max meaningful dE via pure desaturation):');
rows.forEach(r => console.log(' ', r.name, '  chroma=', r.chroma0.toFixed(1)));
