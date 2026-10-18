const fs = require('fs');
const path = require('path');
const { hexToLabD65, labDist } = require(path.join(__dirname, '../../lib.cjs'));

// Validates the tint ladder (gen_tint_ladder.cjs) against the real
// never-fit "tint" pencils: for each one, does the ladder land closer than
// its old nearest Level 1/2/3 match did? Uses each pencil's own measured
// lab_d65_2 from master.json, not a hex-derived approximation.
//
// Updated 2026-10-18 (Ray): also tests 'hue gap + tint (combo)' entries,
// not just 'tint'. Those 30 were originally misread as hue mismatches
// because the taxonomy only ever compared against PURE L1/L2 points -- once
// tested against this ladder (now L1+L2+L3, see gen_tint_ladder.cjs), all
// 30/30 turned out to be ordinary tints, several needing Level 3
// specifically -- which is also why gen_tint_ladder.cjs now includes L3.
const MASTER = JSON.parse(fs.readFileSync('/home/user/chromaengine/data/master.json', 'utf8'));
const TAXONOMY = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/never_fit_taxonomy.json'), 'utf8'));
const LADDER = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/ladder/tint_ladder_full.json'), 'utf8'));

const HUE_GROUP = {
  'Red-Yellow (Orange)': 'RoY-dominant',
  'Yellow-Blue (Green)': 'YgB-dominant',
  'Blue-Red (Violet)': 'BvR-dominant',
};
function groupFor(sourceArc) {
  for (const key of Object.keys(HUE_GROUP)) if (sourceArc.includes(key)) return HUE_GROUP[key];
  return 'other';
}

const THRESH = 15.3; // the model's own established "fits" threshold

const ladderLab = LADDER.map(p => ({ lab: hexToLabD65(p.hex), group: groupFor(p.sourceArc) }));

const tints = TAXONOMY.filter(p => p.category.startsWith('tint') || p.category.includes('combo'));
const results = [];
for (const p of tints) {
  const key = Object.keys(MASTER.pencils).find(k => MASTER.pencils[k].brand_range === p.range && MASTER.pencils[k].colour_name === p.name);
  if (!key) { console.error('NOT FOUND IN MASTER:', p.range, p.name); continue; }
  const lab = MASTER.pencils[key].lab_d65_2;
  let best = Infinity, bestGroup = null;
  for (const l of ladderLab) {
    const d = labDist(lab, l.lab);
    if (d < best) { best = d; bestGroup = l.group; }
  }
  results.push({
    name: p.name, range: p.range, hex: p.hex,
    oldDist: p.minDist, newDist: best,
    rescued: best <= THRESH, group: bestGroup,
  });
}

fs.writeFileSync(path.join(__dirname, '../../data/ladder/tint_ladder_validation.json'), JSON.stringify(results, null, 2));

const rescued = results.filter(r => r.rescued).length;
console.log('total', results.length, 'rescued', rescued, (100 * rescued / results.length).toFixed(1) + '%');
const byGroup = {};
for (const r of results) {
  byGroup[r.group] = byGroup[r.group] || { total: 0, rescued: 0 };
  byGroup[r.group].total++;
  if (r.rescued) byGroup[r.group].rescued++;
}
console.log(byGroup);
