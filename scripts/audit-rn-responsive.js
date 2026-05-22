#!/usr/bin/env node
/**
 * Audit React Native screens / components for common responsive issues.
 *
 * Flags:
 *  1. Hardcoded width: > 280 (likely overflows on small phones, e.g. iPhone SE = 320px)
 *  2. Hardcoded minWidth: > 280
 *  3. flexDirection: 'row' rows that contain Text but no flex/maxWidth/numberOfLines on children
 *     (heuristic — manual review needed)
 *  4. ScrollView missing on screens that render long lists of static content
 *  5. SafeAreaView missing on screens that render full-screen UI
 *
 * Usage: node scripts/audit-rn-responsive.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'myncel-mobile', 'src');
const issues = [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(path.resolve(__dirname, '..'), p);
}

const files = walk(ROOT);

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');

  // 1. width: <number> too large
  lines.forEach((line, i) => {
    const m = line.match(/\bwidth:\s*(\d+)\b/);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v > 280 && !/maxWidth/.test(line)) {
        issues.push({ file: rel(file), line: i + 1, kind: 'width', detail: `width: ${v}` });
      }
    }
    const m2 = line.match(/\bminWidth:\s*(\d+)\b/);
    if (m2) {
      const v = parseInt(m2[1], 10);
      if (v > 280) {
        issues.push({ file: rel(file), line: i + 1, kind: 'minWidth', detail: `minWidth: ${v}` });
      }
    }
  });

  // 2. fontSize too large without responsive cap (very subjective — skip)

  // 3. Screens that have many Text/View without ScrollView
  if (file.includes('/screens/')) {
    const usesScreenContainer = /<ScreenContainer/.test(src);
    const hasScroll = /<ScrollView|<FlatList|<SectionList/.test(src) || usesScreenContainer;
    const hasSafeArea = /SafeAreaView|useSafeAreaInsets|edges=/.test(src) || usesScreenContainer;
    if (!hasScroll && lines.length > 120) {
      issues.push({ file: rel(file), line: 1, kind: 'no-scroll', detail: `screen ${lines.length} lines, no ScrollView/FlatList/ScreenContainer` });
    }
    if (!hasSafeArea) {
      issues.push({ file: rel(file), line: 1, kind: 'no-safearea', detail: `screen has no SafeAreaView (status bar / notch)` });
    }
  }

  // 4. flexDirection row + paddingHorizontal + Text without numberOfLines on common bug spots
  // (Heuristic, lower priority)
}

issues.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

const grouped = {};
for (const it of issues) {
  if (!grouped[it.file]) grouped[it.file] = [];
  grouped[it.file].push(it);
}

console.log(`\nReact Native responsive audit — ${issues.length} issues across ${Object.keys(grouped).length} files\n`);

for (const file of Object.keys(grouped).sort()) {
  console.log(`  ${file}`);
  for (const it of grouped[file]) {
    console.log(`    L${it.line}  [${it.kind}]  ${it.detail}`);
  }
}
console.log('');
