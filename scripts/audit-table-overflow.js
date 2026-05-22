#!/usr/bin/env node
// Find <table> elements that are NOT wrapped in overflow-x-auto within ~5 lines
const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const APP = path.resolve(__dirname, '..', 'app');
const files = walk(APP);
const issues = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/<table\b/.test(lines[i])) {
      // Look UP up to 5 lines for an overflow-x-auto on a wrapping div
      // (Tailwind class OR inline style overflowX: 'auto')
      let wrapped = false;
      for (let j = Math.max(0, i - 6); j < i; j++) {
        if (/overflow-x-auto/.test(lines[j])) { wrapped = true; break; }
        if (/overflow[XY]?\s*:\s*['"]auto['"]/.test(lines[j])) { wrapped = true; break; }
        if (/overflow[XY]?\s*:\s*auto/.test(lines[j])) { wrapped = true; break; }
      }
      if (!wrapped) {
        issues.push({
          file: path.relative(path.resolve(__dirname, '..'), file),
          line: i + 1,
          snippet: lines[i].trim().slice(0, 100),
        });
      }
    }
  }
}

console.log(`Tables NOT wrapped in overflow-x-auto: ${issues.length}\n`);
for (const i of issues) {
  console.log(`${i.file}:${i.line}  ${i.snippet}`);
}
