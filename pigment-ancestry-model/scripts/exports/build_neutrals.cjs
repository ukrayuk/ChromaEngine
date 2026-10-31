// Rebuilds the "Neutrals" export against the current taxonomy,
// reproducing an earlier one-off version from before the 2026-10-31
// Pastel-Adjacent band was added. One sheet, grouped by Munsell-chroma
// band (True Achromatic / Near-Neutral / Earth-Adjacent / Pastel-Adjacent).
// classify_never_fit_taxonomy.cjs's neutral branch returns before
// computing a nearest-point match (a neutral pencil is classified by
// its own Munsell chroma alone, not by comparison to the model), so
// this script does its own nearest-point search across the whole model
// (L1 union L2 union L3) to populate the "what deltaE is measured
// from" column, same format as the original file (e.g. "Arc4 — YgB
// flipped, t=0.0742 (L3)").
// Requires scripts/classify_never_fit_taxonomy.cjs to have been run
// first (reads its data/never_fit_taxonomy.json output for the band
// assignment and the pencil's hex).
// Output: data/exports/neutrals.json.
const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require('../../lib.cjs');

const ROOT = path.join(__dirname, '../..');
const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/never_fit_taxonomy.json'), 'utf8'));
const L1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level1_pure_rows.json'), 'utf8'));
const L2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level2_cross_rows.json'), 'utf8'));
const L3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/level3_cross_rows.json'), 'utf8'));

function loadLevel(levelData, levelName) {
  const out = [];
  for (const key of Object.keys(levelData)) {
    for (const p of levelData[key].points) out.push({ arc: key, t: p.t, level: levelName, lab: hexToLabD65(p.hex) });
  }
  return out;
}
const allPoints = [...loadLevel(L1, 'L1'), ...loadLevel(L2, 'L2'), ...loadLevel(L3, 'L3')];

function nearest(lab) {
  let best = Infinity, bestPt = null;
  for (const p of allPoints) { const d = labDist(lab, p.lab); if (d < best) { best = d; bestPt = p; } }
  return { dE: best, pt: bestPt };
}

const BANDS = ['True Achromatic', 'Near-Neutral', 'Earth-Adjacent', 'Pastel-Adjacent'];
const out = {};
for (const band of BANDS) {
  out[band] = taxonomy
    .filter((r) => r.category === 'neutral (' + band + ')')
    .map((r) => {
      const n = nearest(hexToLabD65(r.hex));
      return {
        name: r.name, range: r.range, munsell: r.munsell, hex: r.hex,
        dE: +n.dE.toFixed(2),
        desc: n.pt.arc + ', t=' + n.pt.t.toFixed(4) + ' (' + n.pt.level + ') -- nearest point, does not fit (>15.3)',
      };
    })
    .sort((a, b) => a.dE - b.dE);
}

fs.mkdirSync(path.join(ROOT, 'data/exports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/exports/neutrals.json'), JSON.stringify(out, null, 2));
for (const band of BANDS) console.log(band + ':', out[band].length);
