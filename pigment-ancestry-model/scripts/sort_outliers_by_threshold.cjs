// Sorts the outlier_tracker.json pool into tint / shade / genuinely-normal-
// but-still-outlier buckets using the per-anchor thresholds in
// anchor_thresholds.json. The "normal_range_but_still_outlier" bucket is
// the interesting one: pencils the old taxonomy calls tint/shade (lighter/
// darker than the nearest ARC POINT) that actually sit within the anchor's
// own genuinely normal lightness range -- real path/anchor-fix candidates,
// not value-extreme pencils that were never reachable.
// Ray and Claude, 2026-10-21.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function hexToHslL(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return ((max + min) / 2) * 100;
}

const outliers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/outlier_tracker.json'), 'utf8'));
const thresholds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/anchor_thresholds.json'), 'utf8')).anchors;

const sorted = {};
for (const anchor of Object.keys(outliers)) {
  const t = thresholds[anchor];
  const tintMin = Array.isArray(t.tint) ? t.tint[0] : t.tint;
  const shadeMax = t.shade;
  const buckets = { tint: [], shade: [], normal_range_but_still_outlier: [] };
  for (const o of outliers[anchor]) {
    const L = hexToHslL(o.hex);
    const row = { ...o, hslL: Math.round(L * 10) / 10 };
    if (L >= tintMin) buckets.tint.push(row);
    else if (L <= shadeMax) buckets.shade.push(row);
    else buckets.normal_range_but_still_outlier.push(row);
  }
  sorted[anchor] = buckets;
}

console.log('=== Sorted by new per-anchor HSL-L thresholds ===\n');
for (const anchor of Object.keys(sorted)) {
  const b = sorted[anchor];
  console.log(`${anchor}: ${b.tint.length} tint, ${b.shade.length} shade, ${b.normal_range_but_still_outlier.length} in-normal-range-but-still-outlier`);
}

fs.writeFileSync(path.join(ROOT, 'data/outlier_tracker_sorted.json'), JSON.stringify(sorted, null, 2));
console.log('\nwritten data/outlier_tracker_sorted.json');
