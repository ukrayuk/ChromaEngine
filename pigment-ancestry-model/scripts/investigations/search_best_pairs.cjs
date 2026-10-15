const fs = require('fs');
const { hexToLabD65, labDist, mixSpectral } = require('../../lib.cjs');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json','utf8'));

const POOL_RANGES = [
  'Castle Arts Gold Coloured Pencils',
  'Castle Arts Premium Soft Touch Colored Pencils',
  "Caran d'Ache Pablo 666",
  'Faber-Castell Polychromos 9201',
];
const pool = Object.values(MASTER.pencils).filter(p => p.lab_d65_2 && POOL_RANGES.includes(p.brand_range))
  .map(p => ({ name: p.colour_name, range: p.brand_range, hex: p.srgb_hex, lab: p.lab_d65_2 }));
console.log('Pool size:', pool.length);

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

const CHAPTERS = [
  '#cc0000','#e33a0b','#fa7516','#fda10b','#ffcc00','#80c300',
  '#00bb00','#189371','#306be2','#4d5dc3','#6a4ea3','#9b2752',
];

const K = 40; // candidate shortlist size per target

const t0 = Date.now();
const results = CHAPTERS.map(targetHex => {
  const targetLab = hexToLabD65(targetHex);
  const ranked = pool.map(p => ({ ...p, d: labDist(targetLab, p.lab) })).sort((a,b) => a.d - b.d);
  const shortlist = ranked.slice(0, K);

  let best = { de: ranked[0].d, p1: ranked[0], p2: ranked[0], t: 0, mixHex: ranked[0].hex };
  for (let i = 0; i < shortlist.length; i++) {
    for (let j = i+1; j < shortlist.length; j++) {
      const a = shortlist[i], b = shortlist[j];
      const pts = buildDyadic(a.hex, b.hex, 8);
      for (const p of pts) {
        const d = labDist(targetLab, hexToLabD65(p.hex));
        if (d < best.de) best = { de: d, p1: a, p2: b, t: p.t, mixHex: p.hex };
      }
    }
  }
  return { target: targetHex, ...best };
});
console.log('search time:', ((Date.now()-t0)/1000).toFixed(1), 's');

function accuracyPct(de) { return Math.max(0, Math.round(100 - 2*de)); }
fs.writeFileSync('chapter_bestpair_results.json', JSON.stringify(results, null, 2));
results.forEach(r => {
  console.log(r.target, '->', r.p1.name+'('+r.p1.range+')', '+', r.p2.name+'('+r.p2.range+')', ' t='+r.t.toFixed(3), ' dE='+r.de.toFixed(1), ' acc='+accuracyPct(r.de)+'%');
});
