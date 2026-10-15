const fs = require('fs');
const { hexToLabD65, labDist, mixSpectral } = require('../../lib.cjs');

function buildDyadic(hexP1, hexP2, maxGen) {
  let points = [{ t: 0, hex: hexP1, gen: 0 }, { t: 1, hex: hexP2, gen: 0 }];
  for (let g = 1; g <= maxGen; g++) {
    const next = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      next.push({ t: (a.t + b.t) / 2, hex: mixSpectral(a.hex, b.hex, 0.5), gen: g });
    }
    const merged = [];
    let i = 0, j = 0;
    while (i < points.length || j < next.length) {
      if (j >= next.length || (i < points.length && points[i].t < next[j].t)) merged.push(points[i++]);
      else merged.push(next[j++]);
    }
    points = merged;
  }
  return points;
}

// Owned-pencil substitutes for each Level 1 arc, found earlier (nearest in
// the Castle Arts Gold + Castle Arts Premium Soft Touch + Pablo + Polychromos pool).
const ARCS_OWNED = {
  RoY: { p1: { name: 'Vermilion', range: 'Castle Arts Gold', hex: '#e3212f' }, p2: { name: 'Light Chrome Yellow', range: 'Polychromos', hex: '#fedd29' } },
  YgB: { p1: { name: 'Canary Yellow', range: 'Pablo', hex: '#f8e538' }, p2: { name: 'Blue Jeans', range: 'Pablo', hex: '#427caa' } },
  BvR: { p1: { name: 'Purple Lake', range: 'Castle Arts Gold', hex: '#685fbb' }, p2: { name: 'Fuchsia', range: 'Polychromos', hex: '#d83a70' } },
};
for (const key of Object.keys(ARCS_OWNED)) {
  const a = ARCS_OWNED[key];
  a.points = buildDyadic(a.p1.hex, a.p2.hex, 8);
}

const CHAPTERS = [
  '#cc0000','#e33a0b','#fa7516','#fda10b','#ffcc00','#80c300',
  '#00bb00','#189371','#306be2','#4d5dc3','#6a4ea3','#9b2752',
];

function accuracyPct(de) { return Math.max(0, Math.round(100 - 2*de)); }

const results = CHAPTERS.map(hex => {
  const lab = hexToLabD65(hex);
  let best = Infinity, bestArc = null, bestPoint = null;
  for (const [key, arc] of Object.entries(ARCS_OWNED)) {
    for (const p of arc.points) {
      const d = labDist(lab, hexToLabD65(p.hex));
      if (d < best) { best = d; bestArc = key; bestPoint = p; }
    }
  }
  const arc = ARCS_OWNED[bestArc];
  return {
    target: hex, arcKey: bestArc,
    p1: arc.p1, p2: arc.p2,
    mixHex: bestPoint.hex, t: bestPoint.t, gen: bestPoint.gen,
    de: best, accuracy: accuracyPct(best),
  };
});

fs.writeFileSync('chapter_owned_recipes.json', JSON.stringify(results, null, 2));
results.forEach(r => {
  const bluePart = Math.round(r.t*100), yellowPart = 100-bluePart;
  console.log(r.target, '->', r.arcKey, ' mix t='+r.t.toFixed(3), ' ('+yellowPart+':'+bluePart+' '+r.p1.name+':'+r.p2.name+')', ' dE='+r.de.toFixed(1), ' acc='+r.accuracy+'%');
});
