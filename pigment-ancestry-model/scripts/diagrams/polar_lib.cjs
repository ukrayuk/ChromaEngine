// Shared polar/gap geometry for the circular Arc System diagrams.
// Constant-LINEAR-width gap (not constant angle, not manually tapered):
// angularHalfWidth(r, d) = asin(min(1, d/r)) * 180/PI -- the geometry Ray
// confirmed as correct for "a straight line, equal gap" earlier this project.
function polar(cx, cy, r, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}
function annularWedgePath(cx, cy, rInner, rOuter, a0, a1) {
  const [x0i, y0i] = polar(cx, cy, rInner, a0), [x1i, y1i] = polar(cx, cy, rInner, a1);
  const [x0o, y0o] = polar(cx, cy, rOuter, a0), [x1o, y1o] = polar(cx, cy, rOuter, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweepOuter = a1 > a0 ? 1 : 0;
  const sweepInner = a1 > a0 ? 0 : 1;
  return ['M', x0o, y0o, 'A', rOuter, rOuter, 0, large, sweepOuter, x1o, y1o,
          'L', x1i, y1i, 'A', rInner, rInner, 0, large, sweepInner, x0i, y0i, 'Z'].join(' ');
}
function angularHalfWidthAt(r, linearHalf) {
  return Math.asin(Math.min(1, linearHalf / r)) * 180 / Math.PI;
}

// Symmetric case (Level 1, Level 3): one gap type on both sides of center.
function boundsSymmetric(center, rawHalfSpan, r, gapLinearHalf) {
  const half = rawHalfSpan - angularHalfWidthAt(r, gapLinearHalf);
  return { startDeg: center - half, endDeg: center + half };
}

// Asymmetric case (Level 2): one side is the "seam" (related pair, constant
// linear width), the other the "wide" family-boundary gap (can be linear or
// flat/constant-angle -- set via wideSpec.type).
function boundsAsymmetric(f, r, seamLinearHalf, wideSpec) {
  const dir = f.seamSide === 'end' ? 1 : -1;
  const seam = f.center - dir * angularHalfWidthAt(r, seamLinearHalf);
  const wideHalf = wideSpec.type === 'linear' ? angularHalfWidthAt(r, wideSpec.half) : wideSpec.half;
  const wide = f.rawBound + dir * wideHalf;
  return f.seamSide === 'end' ? { startDeg: wide, endDeg: seam } : { startDeg: seam, endDeg: wide };
}

// Draws one arc (flat {t, gen, hex} point array, from gen_level*_*.cjs) as
// concentric generation bands. boundsFn(r) => {startDeg, endDeg} supplies
// the angular placement at a given radius (symmetric or asymmetric above).
function drawArc(svgParts, opts) {
  const { cx, cy, points, boundsFn, R0, BAND, MAXGEN, label, labelSize } = opts;
  for (let g = 0; g <= MAXGEN; g++) {
    const rInner = R0 + g * BAND, rOuter = R0 + (g + 1) * BAND;
    const b = boundsFn((rInner + rOuter) / 2);
    const angleForT = (t) => b.startDeg + (b.endDeg - b.startDeg) * t;
    // Boundaries come from the FULL set accumulated through this generation
    // (so a new point's cell still spans correctly to its neighbours), but
    // only points actually NEW at this generation get drawn -- each ring
    // shows only what's new there, nothing carried forward (primaries only
    // ever appear at G0).
    const fullSet = points.filter(p => p.gen <= g);
    const n = fullSet.length;
    fullSet.forEach((p, i) => {
      if (p.gen !== g) return;
      const tLo = i === 0 ? fullSet[0].t : (fullSet[i - 1].t + p.t) / 2;
      const tHi = i === n - 1 ? fullSet[n - 1].t : (p.t + fullSet[i + 1].t) / 2;
      const a0 = angleForT(tLo), a1 = angleForT(tHi);
      svgParts.push(`<path d="${annularWedgePath(cx, cy, rInner, rOuter, a0, a1)}" fill="${p.hex}"/>`);
    });
  }
  if (labelSize !== null) {
    const bOuter = boundsFn(R0 + MAXGEN * BAND);
    const midDeg = (bOuter.startDeg + bOuter.endDeg) / 2;
    const [lx, ly] = polar(cx, cy, R0 + (MAXGEN + 1) * BAND + labelSize, midDeg);
    svgParts.push(`<text x="${lx}" y="${ly}" class="fan-label" text-anchor="middle">${label}</text>`);
  }
}

module.exports = { polar, annularWedgePath, angularHalfWidthAt, boundsSymmetric, boundsAsymmetric, drawArc };
