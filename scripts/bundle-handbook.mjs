import { writeFileSync } from 'fs';
const m = await import('/tmp/h/content.mjs');
const out = 'myncel-mobile/src/handbook/content.json';
writeFileSync(out, JSON.stringify(m.HANDBOOK_CHAPTERS, null, 2));
console.log('Wrote', out);
console.log('chapters:', m.HANDBOOK_CHAPTERS.length);
console.log('total sections:', m.HANDBOOK_CHAPTERS.reduce((a, c) => a + c.sections.length, 0));
console.log('chapter slugs:', m.HANDBOOK_CHAPTERS.map((c) => c.slug).join(', '));
