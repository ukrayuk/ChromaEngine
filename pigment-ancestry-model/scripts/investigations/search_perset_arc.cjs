const fs = require('fs');
const { hexToLabD65, labDist, mixSpectral } = require('../../lib.cjs');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json','utf8'));

function hueAngle(lab) { let h = Math.atan2(lab[2], lab[1]) * 180/Math.PI; if (h<0) h+=360; return h; }
function inSpan(h, lo, hi) { // handles wraparound (lo>hi means spans through 0)
  return lo <= hi ? (h >= lo && h <= hi) : (h >= lo || h <= hi);
}
const ARC_SPANS = {
  RoY: [31.9, 91.6],
  YgB: [99.4, 252.6],
  BvR: [293.7, 2.3],
};
function arcOf(lab) {
  const h = hueAngle(lab);
  for (const [name, [lo,hi]] of Object.entries(ARC_SPANS)) if (inSpan(h, lo, hi)) return name;
  return null; // in a gap zone, belongs to no arc
}

const SETS = {
  'Castle Arts Gold': 'Castle Arts Gold Coloured Pencils',
  'Castle Arts Soft Touch': 'Castle Arts Premium Soft Touch Colored Pencils',
  'Pablo': "Caran d'Ache Pablo 666",
  'Polychromos': 'Faber-Castell Polychromos 9201',
};

const poolBySet = {};
for (const [label, range] of Object.entries(SETS)) {
  const pencils = Object.values(MASTER.pencils).filter(p => p.lab_d65_2 && p.brand_range === range)
    .map(p => ({ name: p.colour_name, hex: p.srgb_hex, lab: p.lab_d65_2, arc: arcOf(p.lab_d65_2) }));
  poolBySet[label] = pencils;
  const counts = { RoY:0, YgB:0, BvR:0, none:0 };
  pencils.forEach(p => counts[p.arc || 'none']++);
  console.log(label, '-- total', pencils.length, ' RoY:'+counts.RoY, ' YgB:'+counts.YgB, ' BvR:'+counts.BvR, ' (no-arc:'+counts.none+')');
}

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
// Reuse the arc assignment already established for the chapter colours.
const CHAPTER_ARC = JSON.parse(fs.readFileSync('../../data/chapter_owned_recipes.json','utf8'))
  .reduce((m,r) => { m[r.target] = r.arcKey; return m; }, {});

function accuracyPct(de) { return Math.max(0, Math.round(100 - 2*de)); }

const results = [];
for (const target of CHAPTERS) {
  const targetLab = hexToLabD65(target);
  const arcKey = CHAPTER_ARC[target];
  for (const setLabel of Object.keys(SETS)) {
    const candidates = poolBySet[setLabel].filter(p => p.arc === arcKey);
    if (candidates.length < 1) { results.push({ target, arcKey, setLabel, none: true, nCandidates: candidates.length }); continue; }
    let best = { de: Infinity, p1: null, p2: null, t: 0, mixHex: null };
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i; j < candidates.length; j++) { // include i===j (single pencil, t=0 trivial case)
        const a = candidates[i], b = candidates[j];
        if (i === j) {
          const d = labDist(targetLab, a.lab);
          if (d < best.de) best = { de: d, p1: a, p2: a, t: 0, mixHex: a.hex };
          continue;
        }
        const pts = buildDyadic(a.hex, b.hex, 8);
        for (const p of pts) {
          const d = labDist(targetLab, hexToLabD65(p.hex));
          if (d < best.de) best = { de: d, p1: a, p2: b, t: p.t, mixHex: p.hex };
        }
      }
    }
    results.push({ target, arcKey, setLabel, nCandidates: candidates.length, ...best });
  }
}
fs.writeFileSync('chapter_perset_arc_results.json', JSON.stringify(results, null, 2));
console.log();
for (const r of results) {
  if (r.none) { console.log(r.target, r.setLabel, '(' + r.arcKey + ') -- NO candidates in this set/arc'); continue; }
  console.log(r.target, r.setLabel, '(' + r.arcKey + ', ' + r.nCandidates + ' candidates):', r.p1.name, r.p1===r.p2?'':'+ '+r.p2.name, ' t='+r.t.toFixed(3), ' dE='+r.de.toFixed(1), ' acc='+accuracyPct(r.de)+'%');
}
