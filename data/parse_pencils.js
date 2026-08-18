#!/usr/bin/env node
/*
 * ChromaEngine pencil-data parser.
 *
 * Takes the pasted colour-reference-tool text blocks (the "091 Purple Lake /
 * Castle Arts Gold Coloured Pencils / Source / ... / sRGB ... hex #xxxxxx"
 * format) and turns them into structured rows in a single master JSON
 * dataset, deduplicating as it goes.
 *
 * Usage:
 *   node parse_pencils.js <input.txt>          parse + merge into master.json
 *   node parse_pencils.js <input.txt> --dry-run   parse + report only, no write
 *
 * Input file: paste one or more blocks (any number, any order) into a plain
 * text file and pass its path. Multiple blocks in one file is fine and
 * expected — that's the normal case when working through a whole range.
 */

const fs = require('fs');
const path = require('path');

const MASTER_PATH = path.join(__dirname, 'master.json');

function num(str) {
  if (str == null) return null;
  const n = parseFloat(str.replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Split the raw paste into individual pencil blocks.
//
// Two source formats are supported:
//  - Legacy manual paste: blocks anchored on a bare "Source" line, with the
//    name + brand/range as the 1-2 lines immediately above it.
//  - Tampermonkey scrape (ArtistPigments): explicit "PENCIL_ID:" / "PENCIL_NAME:"
//    / "BRAND:" / "URL:" header lines, all section headers in caps (SOURCE,
//    PAPER, CIE-L*A*B*, etc.), blocks separated by a line of "=" characters.
// Detected automatically per file — a file is Tampermonkey-format if it
// contains a "PENCIL_ID:" line anywhere.
function splitBlocksLegacy(raw) {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const sourceIdx = [];
  lines.forEach((l, i) => { if (l === 'Source') sourceIdx.push(i); });

  const blocks = [];
  for (let k = 0; k < sourceIdx.length; k++) {
    // this block starts at its OWN name line: 2 lines above its OWN "Source"
    const blockStart = k === 0 ? 0 : Math.max(sourceIdx[k] - 2, 0);
    // it ends right before the NEXT block's name line, or EOF for the last block
    const blockEnd = k < sourceIdx.length - 1 ? Math.max(sourceIdx[k + 1] - 2, blockStart + 1) : lines.length;
    blocks.push(lines.slice(blockStart, blockEnd));
  }
  return blocks;
}

function splitBlocksTampermonkey(raw) {
  const rawLines = raw.split(/\r?\n/);
  const blocks = [];
  let current = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    // A separator line is "=" repeated, on its own line (blank lines around
    // it are stripped along with all other blank lines below).
    if (/^=+$/.test(trimmed) && trimmed.length >= 10) {
      if (current.some((l) => l.length > 0)) blocks.push(current);
      current = [];
    } else {
      current.push(trimmed);
    }
  }
  if (current.some((l) => l.length > 0)) blocks.push(current);
  return blocks.map((lines) => lines.filter((l) => l.length > 0));
}

function splitBlocks(raw) {
  if (/^PENCIL_ID:/mi.test(raw)) return splitBlocksTampermonkey(raw);
  return splitBlocksLegacy(raw);
}

function grabAfter(lines, label) {
  const i = lines.indexOf(label);
  return i >= 0 && i + 1 < lines.length ? lines[i + 1] : null;
}

// Case varies between the two source formats for section headers (e.g.
// "Source" vs "SOURCE", "CIE-L*a*b*" vs "CIE-L*A*B*") but never for the data
// rows underneath them, so lookups just need to try both exact spellings.
function findIndexAny(lines, labels) {
  for (const label of labels) {
    const i = lines.indexOf(label);
    if (i >= 0) return i;
  }
  return -1;
}
function grabAfterAny(lines, labels) {
  const i = findIndexAny(lines, labels);
  return i >= 0 && i + 1 < lines.length ? lines[i + 1] : null;
}

function parseBlock(lines) {
  const idI = lines.findIndex((l) => /^PENCIL_ID:/i.test(l));

  let colourName, productCode, brandLine, url = null;

  if (idI >= 0) {
    // Tampermonkey format: explicit labeled header fields.
    const grabField = (label) => {
      const l = lines.find((x) => x.toUpperCase().startsWith(label + ':'));
      return l ? l.slice(l.indexOf(':') + 1).trim() : null;
    };
    productCode = grabField('PENCIL_ID') || null;
    colourName = grabField('PENCIL_NAME');
    brandLine = grabField('BRAND');
    url = grabField('URL');
  } else {
    // Legacy format: name + brand/range are the 1-2 lines immediately before "Source".
    const srcI = lines.indexOf('Source');
    if (srcI < 1) return null;
    const nameLine = lines[srcI - 2] ?? lines[srcI - 1];
    brandLine = lines[srcI - 1] !== nameLine ? lines[srcI - 1] : null;

    // name line often looks like "142 Madder" or "091 Purple Lake" or just
    // "Strawberry" / "Sun Yellow" (no leading code).
    colourName = nameLine;
    productCode = null;
    const codeMatch = nameLine ? nameLine.match(/^([A-Za-z0-9]+)\s+(.+)$/) : null;
    if (codeMatch && /\d/.test(codeMatch[1])) {
      productCode = codeMatch[1];
      colourName = codeMatch[2];
    }
  }

  const record = {
    colour_name: colourName,
    product_code: productCode,
    brand_range: brandLine,
    url,
    source: grabAfterAny(lines, ['Source', 'SOURCE']),
    paper: grabAfterAny(lines, ['Paper', 'PAPER']),
    device: null,
    device_spectral_range: null,
    device_mode: null,
    lab_d50_2: null,
    lab_d65_2: null,
    lch_d50_2: null,
    lch_d65_2: null,
    oklab_d65: null,
    munsell: null,
    isccnbs_name: null,
    isccnbs_numeric: null,
    srgb_hex: null,
    srgb_rgb: null,
    srgb_gamut_status: 'in',
    p3_rgb: null,
    p3_gamut_status: 'in',
  };

  const deviceLine = grabAfterAny(lines, ['Device', 'DEVICE']);
  if (deviceLine) {
    const m = deviceLine.match(/^(.*?)\s*\(Spectral range ([\d\-–]+ ?nm)\)/i);
    if (m) { record.device = m[1].trim(); record.device_spectral_range = m[2].trim(); }
    else record.device = deviceLine;
  }
  const modeLine = grabAfterAny(lines, ['Device Mode', 'DEVICE MODE']);
  if (modeLine) record.device_mode = modeLine;

  // CIE-L*a*b* block: two lines, D50 then D65
  const labI = findIndexAny(lines, ['CIE-L*a*b*', 'CIE-L*A*B*']);
  if (labI >= 0) {
    const l1 = lines[labI + 1], l2 = lines[labI + 2];
    const parseLab = (l) => {
      if (!l) return null;
      const m = l.match(/L\*\s*([\d.\-]+)\s*a\*\s*([\d.\-]+)\s*b\*\s*([\d.\-]+)/);
      return m ? [num(m[1]), num(m[2]), num(m[3])] : null;
    };
    if (l1 && /D50/.test(l1)) record.lab_d50_2 = parseLab(l1);
    if (l1 && /D65/.test(l1)) record.lab_d65_2 = parseLab(l1);
    if (l2 && /D50/.test(l2)) record.lab_d50_2 = parseLab(l2);
    if (l2 && /D65/.test(l2)) record.lab_d65_2 = parseLab(l2);
  }

  // CIE-L*Ch°(ab): two lines, D50 then D65
  const lchI = findIndexAny(lines, ['CIE-L*Ch°(ab)', 'CIE-L*CH°(AB)']);
  if (lchI >= 0) {
    const l1 = lines[lchI + 1], l2 = lines[lchI + 2];
    const parseLch = (l) => {
      if (!l) return null;
      const m = l.match(/L\*\s*([\d.\-]+)\s*C\*\s*([\d.\-]+)\s*h°\*\s*([\d.\-]+)/);
      return m ? [num(m[1]), num(m[2]), num(m[3])] : null;
    };
    if (l1 && /D50/.test(l1)) record.lch_d50_2 = parseLch(l1);
    if (l1 && /D65/.test(l1)) record.lch_d65_2 = parseLch(l1);
    if (l2 && /D50/.test(l2)) record.lch_d50_2 = parseLch(l2);
    if (l2 && /D65/.test(l2)) record.lch_d65_2 = parseLch(l2);
  }

  // OK-Lab + Ch°  (D65 only, single line)
  const okI = findIndexAny(lines, ['OK-Lab + Ch°', 'OK-LAB + CH°']);
  if (okI >= 0 && lines[okI + 1]) {
    const m = lines[okI + 1].match(/L\s*([\d.\-]+)\s*a\s*([\d.\-]+)\s*b\s*([\d.\-]+)\s*C\s*([\d.\-]+)\s*h°\s*([\d.\-]+)/);
    if (m) record.oklab_d65 = { L: num(m[1]), a: num(m[2]), b: num(m[3]), C: num(m[4]), h: num(m[5]) };
  }

  // Munsell
  const munI = findIndexAny(lines, ['Munsell', 'MUNSELL']);
  if (munI >= 0 && lines[munI + 1]) {
    const m = lines[munI + 1].match(/Munsell\s+(\S+\s+\S+)\s*–/);
    if (m) record.munsell = m[1].trim();
  }

  // ISCC-NBS
  const isccI = lines.indexOf('ISCC-NBS');
  if (isccI >= 0 && lines[isccI + 1]) {
    const m = lines[isccI + 1].match(/Name\s+(.+?)\s+Numeric\s+(\d+)/);
    if (m) { record.isccnbs_name = m[1]; record.isccnbs_numeric = num(m[2]); }
  }

  // sRGB — may be "sRGB"/"SRGB", or a "Mapped" + "Clipped" pair
  let sI = findIndexAny(lines, ['sRGB', 'SRGB']);
  if (sI < 0) sI = findIndexAny(lines, ['sRGB Mapped', 'SRGB MAPPED']);
  if (sI >= 0) {
    // walk forward collecting r/g/b + hex + optional "Out of sRGB gamut"
    for (let j = sI + 1; j < Math.min(sI + 4, lines.length); j++) {
      const m = lines[j].match(/r\s*([\d.]+)\s*g\s*([\d.]+)\s*b\s*([\d.]+)\s*hex\s*(#?[0-9a-fA-F]{6})/);
      if (m) {
        record.srgb_rgb = [num(m[1]), num(m[2]), num(m[3])];
        record.srgb_hex = m[4].startsWith('#') ? m[4].toLowerCase() : '#' + m[4].toLowerCase();
      }
      if (/Out of sRGB gamut/i.test(lines[j])) record.srgb_gamut_status = /mapped/i.test(lines[sI]) ? 'mapped' : 'clipped';
    }
    // prefer the "Clipped" hex if both Mapped and Clipped blocks exist
    const clippedI = findIndexAny(lines, ['sRGB Clipped', 'SRGB CLIPPED']);
    if (clippedI >= 0) {
      for (let j = clippedI + 1; j < Math.min(clippedI + 4, lines.length); j++) {
        const m = lines[j].match(/r\s*([\d.]+)\s*g\s*([\d.]+)\s*b\s*([\d.]+)\s*hex\s*(#?[0-9a-fA-F]{6})/);
        if (m) {
          record.srgb_rgb = [num(m[1]), num(m[2]), num(m[3])];
          record.srgb_hex = m[4].startsWith('#') ? m[4].toLowerCase() : '#' + m[4].toLowerCase();
          record.srgb_gamut_status = 'clipped';
        }
      }
    }
  }

  // P3 RGB
  const p3I = lines.indexOf('P3 RGB');
  if (p3I >= 0 && lines[p3I + 1]) {
    const m = lines[p3I + 1].match(/r\s*([\d.]+)\s*g\s*([\d.]+)\s*b\s*([\d.]+)/);
    if (m) record.p3_rgb = [num(m[1]), num(m[2]), num(m[3])];
    if (/Out of P3 gamut/i.test(lines[p3I + 1]) || (lines[p3I + 2] && /Out of P3 gamut/i.test(lines[p3I + 2]))) {
      record.p3_gamut_status = 'clipped';
    }
  }

  if (!record.srgb_hex) return null; // reject anything we couldn't get a hex for
  return record;
}

function dedupeKey(rec) {
  const brand = (rec.brand_range || '').toLowerCase().trim();
  const code = (rec.product_code || '').toLowerCase().trim();
  const name = (rec.colour_name || '').toLowerCase().trim();
  return code ? `${brand}::${code}` : `${brand}::${name}`;
}

function loadMaster() {
  if (fs.existsSync(MASTER_PATH)) {
    return JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
  }
  return { pencils: {} };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const inputPath = args.find((a) => !a.startsWith('--'));
  if (!inputPath) {
    console.error('Usage: node parse_pencils.js <input.txt> [--dry-run]');
    process.exit(1);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  const blocks = splitBlocks(raw);
  const parsed = blocks.map(parseBlock).filter(Boolean);

  const master = loadMaster();
  let added = 0, exactDupes = 0, conflicts = 0;
  const report = [];

  for (const rec of parsed) {
    const key = dedupeKey(rec);
    const existing = master.pencils[key];
    if (!existing) {
      master.pencils[key] = rec;
      added++;
      report.push(`ADDED     ${rec.brand_range || '?'} — ${rec.product_code ? rec.product_code + ' ' : ''}${rec.colour_name} (${rec.srgb_hex})`);
    } else if (existing.srgb_hex === rec.srgb_hex) {
      exactDupes++;
      let note = '';
      if (!existing.url && rec.url) { existing.url = rec.url; note = ' [url filled in]'; }
      report.push(`DUPLICATE ${rec.brand_range || '?'} — ${rec.product_code ? rec.product_code + ' ' : ''}${rec.colour_name} (${rec.srgb_hex})${note} — already in master, skipped`);
    } else {
      conflicts++;
      if (!existing.url && rec.url) existing.url = rec.url;
      report.push(`CONFLICT  ${rec.brand_range || '?'} — ${rec.product_code ? rec.product_code + ' ' : ''}${rec.colour_name} — master has ${existing.srgb_hex}, this paste has ${rec.srgb_hex}. NOT overwritten — resolve manually.`);
    }
  }

  console.log(report.join('\n'));
  console.log(`\nParsed ${parsed.length} block(s) from ${blocks.length} detected. Added ${added}, duplicates skipped ${exactDupes}, conflicts flagged ${conflicts}.`);
  console.log(`Master dataset now has ${Object.keys(master.pencils).length} pencils.`);

  if (!dryRun) {
    fs.writeFileSync(MASTER_PATH, JSON.stringify(master, null, 2));
    console.log(`Written to ${MASTER_PATH}`);
  } else {
    console.log('(dry run — master.json not written)');
  }
}

main();
