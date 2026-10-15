const fs = require('fs');
const spectral = require('./node_modules/spectral.js/spectral.js');
const { hexToLabD65, labDist } = require('../../lib.cjs');
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json','utf8'));

function hueAngle(lab) { let h = Math.atan2(lab[2], lab[1]) * 180/Math.PI; if (h<0) h+=360; return h; }
function inSpan(h, lo, hi) { return lo <= hi ? (h >= lo && h <= hi) : (h >= lo || h <= hi); }
const ARC_SPANS = { RoY: [31.9, 91.6], YgB: [99.4, 252.6], BvR: [293.7, 2.3] };
function arcOf(lab) { const h = hueAngle(lab); for (const [name,[lo,hi]] of Object.entries(ARC_SPANS)) if (inSpan(h,lo,hi)) return name; return null; }

const SETS = {
  'Castle Arts Gold': 'Castle Arts Gold Coloured Pencils',
  'Castle Arts Soft Touch': 'Castle Arts Premium Soft Touch Colored Pencils',
  'Pablo': "Caran d'Ache Pablo 666",
  'Polychromos': 'Faber-Castell Polychromos 9201',
};
const poolBySet = {};
for (const [label, range] of Object.entries(SETS)) {
  poolBySet[label] = Object.values(MASTER.pencils).filter(p => p.lab_d65_2 && p.brand_range === range)
    .map(p => ({ name: p.colour_name, hex: p.srgb_hex, lab: p.lab_d65_2, arc: arcOf(p.lab_d65_2) }));
}

function mixWeighted(hexArr, weights) {
  const cs = hexArr.map((h,i) => [new spectral.Color(h), weights[i]]);
  return spectral.mix(...cs).toString();
}

// RoY + YgB targets only (BvR excluded per Ray's instruction).
const TARGETS = ['#cc0000','#e33a0b','#fa7516','#fda10b','#ffcc00','#80c300','#00bb00','#189371'];
const CHAPTER_ARC = JSON.parse(fs.readFileSync('../../data/chapter_owned_recipes.json','utf8'))
  .reduce((m,r) => { m[r.target] = r.arcKey; return m; }, {});
const BEST_PAIR = JSON.parse(fs.readFileSync('../../data/chapter_perset_arc_results.json','utf8'));

const STEP = 0.05;
const GRID = [];
for (let w1 = 0; w1 <= 1.0001; w1 += STEP) {
  for (let w2 = 0; w2 <= 1.0001 - w1; w2 += STEP) {
    const w3 = 1 - w1 - w2;
    if (w3 < -0.0001) continue;
    GRID.push([Math.round(w1*100)/100, Math.round(w2*100)/100, Math.round(Math.max(0,w3)*100)/100]);
  }
}
console.log('grid points:', GRID.length);

const SHORTLIST_K = 10;
const results = [];
const t0 = Date.now();
for (const target of TARGETS) {
  const arcKey = CHAPTER_ARC[target];
  const targetLab = hexToLabD65(target);
  for (const setLabel of Object.keys(SETS)) {
    const candidates = poolBySet[setLabel].filter(p => p.arc === arcKey);
    const ranked = candidates.map(p => ({ ...p, d: labDist(targetLab, p.lab) })).sort((a,b)=>a.d-b.d);
    const shortlist = ranked.slice(0, SHORTLIST_K);
    const pairBaseline = BEST_PAIR.find(r => r.target === target && r.setLabel === setLabel);

    let best = { de: Infinity, trio: null, weights: null, mixHex: null };
    for (let i = 0; i < shortlist.length; i++) {
      for (let j = i+1; j < shortlist.length; j++) {
        for (let k = j+1; k < shortlist.length; k++) {
          const trio = [shortlist[i], shortlist[j], shortlist[k]];
          for (const w of GRID) {
            if (w[0]===0 || w[1]===0 || w[2]===0) continue; // true 3-way only; 2-way already covered by pair search
            const mixHex = mixWeighted(trio.map(p=>p.hex), w);
            const d = labDist(targetLab, hexToLabD65(mixHex));
            if (d < best.de) best = { de: d, trio, weights: w, mixHex };
          }
        }
      }
    }
    results.push({ target, arcKey, setLabel, nCandidates: candidates.length, pairDE: pairBaseline ? pairBaseline.de : null, ...best });
  }
}
console.log('search time:', ((Date.now()-t0)/1000).toFixed(1), 's');
fs.writeFileSync('chapter_3color_results.json', JSON.stringify(results, null, 2));

function acc(de){return Math.max(0,Math.round(100-2*de));}
for (const r of results) {
  const improvement = r.pairDE - r.de;
  console.log(r.target, r.setLabel, '(' + r.arcKey + '):',
    '2-colour dE=' + (r.pairDE!=null?r.pairDE.toFixed(1):'?'),
    '-> 3-colour dE=' + r.de.toFixed(1),
    ' improvement=' + improvement.toFixed(1),
    ' acc ' + acc(r.pairDE) + '%->' + acc(r.de) + '%',
    r.trio ? '  [' + r.trio.map((p,idx)=>p.name+':'+Math.round(r.weights[idx]*100)+'%').join(', ') + ']' : '');
}
