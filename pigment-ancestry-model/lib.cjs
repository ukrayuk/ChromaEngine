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

module.exports = { spectral, hexToLabD65, mixSpectral, mixN, mixTrueShare, mixTrueEqual, labDist, xyzToLabD65 };
