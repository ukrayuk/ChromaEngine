const spectral = require('./node_modules/spectral.js/spectral.js');

// XYZ (spectral.js scale, Y~1 for white) -> Lab D65 2deg
const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
function f(t) { return t > 0.008856 ? Math.cbrt(t) : (7.787*t + 16/116); }
function xyzToLabD65(XYZ) {
  const [X,Y,Z] = XYZ;
  const fx = f(X/Xn), fy = f(Y/Yn), fz = f(Z/Zn);
  const L = 116*fy - 16;
  const a = 500*(fx-fy);
  const b = 200*(fy-fz);
  return [L,a,b];
}
function hexToLabD65(hex) {
  const c = new spectral.Color(hex);
  return xyzToLabD65(c.XYZ);
}
function mixSpectral(hexA, hexB, t) {
  const a = new spectral.Color(hexA), b = new spectral.Color(hexB);
  return spectral.gradient(t, [a,0],[b,1]).toString();
}

// Lab(D65) -> XYZ, the inverse of xyzToLabD65 above.
function labD65ToXYZ([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const finv = (t) => (t > 0.206893 ? t ** 3 : (t - 16 / 116) / 7.787);
  return [finv(fx) * Xn, finv(fy) * Yn, finv(fz) * Zn];
}
// Same matrix spectral.js uses internally (CONVERSION.XYZ_RGB), duplicated
// here since it isn't exported.
const XYZ_RGB = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];
const matVec = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
const compand = (x) => (x > 0.0031308 ? 1.055 * x ** (1 / 2.4) - 0.055 : x * 12.92);

// Found 2026-10-18 (Ray): two of Level 1's four real-pencil anchors (Warm
// Yellow, Cool Blue) are sRGB-gamut-CLIPPED in master.json -- the stored
// srgb_hex is correct as a DISPLAY colour (nothing wrong with the anchor's
// own swatch), but spectral.Color(hexString) re-estimates a 38-band
// reflectance curve FROM that already-clipped hex for MIXING purposes,
// which understates how saturated the real pigment is for every point
// mixed from it. Lab->XYZ->linear-RGB->gamma-encode is pure, reversible
// linear algebra with no inherent 0-255 bound -- skip the hex string
// entirely and feed spectral.Color the UNCLAMPED array (can go negative or
// >255), so its reflectance estimate starts from the true measured colour
// instead of an already-compressed one. Verified: Warm Yellow's real Lab
// recovers exactly; Cool Blue (more extreme, genuinely outside even P3)
// recovers about a quarter of its lost chroma -- the remainder is the
// reflectance estimator's own one-to-many ambiguity (RGB can't uniquely
// determine a 38-band curve), not something more arithmetic can fix
// without the real spectral measurement, which was lost to a drive
// failure. Only ever use this for an anchor confirmed gamut-clipped in
// master.json (srgb_gamut_status) -- for an in-gamut anchor it reproduces
// the same hex, so it's harmless but pointless to apply elsewhere.
function colorFromTrueLab(lab) {
  const XYZ = labD65ToXYZ(lab);
  const lRGB = matVec(XYZ_RGB, XYZ);
  const sRGBarr = lRGB.map((x) => compand(x) * 255);
  return new spectral.Color(sRGBarr);
}
// Mixes a gamut-clipped anchor (given as its TRUE measured Lab, not its
// hex) against an ordinary hex colour. Only meant for the first generation
// of buildDyadic, where one side is a raw anchor -- every generation after
// that mixes already-computed hex points as usual, same as mixSpectral.
function mixSpectralTrueLab(labA, hexB, t) {
  const a = colorFromTrueLab(labA), b = new spectral.Color(hexB);
  return spectral.gradient(t, [a, 0], [b, 1]).toString();
}
function mixN(hexArr) {
  const cs = hexArr.map(h => [new spectral.Color(h), 1]);
  return spectral.mix(...cs).toString();
}
const labDist = (a,b) => Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2);

// spectral.js's mix() weights by concentration = factor^2 * tintingStrength^2
// * luminance, NOT by the raw factor -- so passing equal factors (0.5/0.5,
// or 1/1/1) only gives an equal visual share when the colours also happen to
// share the same luminance. Confirmed empirically: factor 0.5:0.5 on Yellow
// Ochre + Vermilion actually lands at 77.6%:22.4% by concentration, not 50:50.
// mixTrueShare solves backward for the factors that make the REAL
// concentration share match targetShares exactly, regardless of luminance.
function mixTrueShare(hexArr, targetShares) {
  const colors = hexArr.map(h => new spectral.Color(h));
  const factors = colors.map((c, i) => Math.sqrt(targetShares[i] / (c.tintingStrength ** 2 * c.luminance)));
  const pairs = colors.map((c, i) => [c, factors[i]]);
  return spectral.mix(...pairs).toString();
}
// Equal-N convenience (e.g. a true 50:50, or a true equal-thirds).
function mixTrueEqual(hexArr) {
  return mixTrueShare(hexArr, hexArr.map(() => 1 / hexArr.length));
}

module.exports = { spectral, hexToLabD65, mixSpectral, mixN, mixTrueShare, mixTrueEqual, labDist, xyzToLabD65, colorFromTrueLab, mixSpectralTrueLab };
