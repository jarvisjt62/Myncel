#!/usr/bin/env node
/**
 * Mobile-responsive audit script for Myncel.
 *
 * Walks every .tsx in app/, parses className strings, and flags grids/flex
 * layouts that have hardcoded multi-column counts without sm:/md:/lg: fallbacks
 * (i.e. they will overflow a 375px viewport).
 *
 * Output is grouped by file so we can fix them in bulk.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

// Match className="..." OR className={`...`} (inline literal). We can't perfectly
// catch dynamic classNames, but most layout grids are static literals.
const CLASS_RE = /className=(?:"([^"]+)"|\{`([^`]+)`\}|\{'([^']+)'\})/g;

const issues = {};
let totalFiles = 0, flaggedFiles = 0;

for (const file of walk(APP)) {
  totalFiles++;
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  const fileIssues = [];

  let m;
  CLASS_RE.lastIndex = 0;
  while ((m = CLASS_RE.exec(src)) !== null) {
    const cls = m[1] || m[2] || m[3];
    if (!cls) continue;
    const tokens = cls.split(/\s+/);

    // Find any unprefixed grid-cols-N where N >= 2 AND no sm:/md:/lg: variant of grid-cols exists in same className
    const gridCols = tokens.filter(t => /^grid-cols-[2-9]$/.test(t));
    const hasResponsiveGridCols = tokens.some(t => /^(sm|md|lg|xl|2xl):grid-cols-[1-9]/.test(t));
    const hasGridCols1 = tokens.some(t => /^grid-cols-1$/.test(t));
    if (gridCols.length > 0 && !hasResponsiveGridCols && !hasGridCols1) {
      // Heuristic: if the unprefixed grid-cols-N is >= 3 it almost certainly breaks on 375px.
      // If it's grid-cols-2 it MIGHT be okay (cards, settings panels).
      const worstN = Math.max(...gridCols.map(t => parseInt(t.replace('grid-cols-', ''), 10)));
      if (worstN >= 3) {
        fileIssues.push({ kind: 'grid', cols: worstN, snippet: cls.slice(0, 100) });
      }
    }

    // Hardcoded min-width that breaks 375px viewport
    const fixedMinW = tokens.find(t => /^min-w-\[(\d+)px\]$/.test(t));
    if (fixedMinW) {
      const px = parseInt(fixedMinW.match(/\[(\d+)px\]/)[1], 10);
      if (px > 375) {
        // Check whether parent had overflow-x-auto in same className (rough heuristic)
        const hasOverflow = src.indexOf(`overflow-x-auto`) !== -1; // file-level — generous
        if (!hasOverflow) {
          fileIssues.push({ kind: 'fixed-min-w', px, snippet: cls.slice(0, 100) });
        }
      }
    }
  }

  if (fileIssues.length > 0) {
    flaggedFiles++;
    issues[rel] = fileIssues;
  }
}

// Group by issue count, print sorted
const sorted = Object.entries(issues).sort((a, b) => b[1].length - a[1].length);
console.log(`\n=== Mobile-responsive audit ===`);
console.log(`Files scanned: ${totalFiles}`);
console.log(`Files flagged: ${flaggedFiles}`);
console.log(`Total issues:  ${sorted.reduce((a, [, v]) => a + v.length, 0)}\n`);

for (const [file, fileIssues] of sorted) {
  console.log(`\n${file}  (${fileIssues.length})`);
  for (const i of fileIssues.slice(0, 5)) {
    console.log(`  [${i.kind}] ${i.kind === 'grid' ? `grid-cols-${i.cols}` : `${i.px}px`}  →  "${i.snippet}${i.snippet.length >= 100 ? '...' : ''}"`);
  }
  if (fileIssues.length > 5) console.log(`  ... and ${fileIssues.length - 5} more`);
}
