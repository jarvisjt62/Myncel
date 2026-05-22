/**
 * src/handbook/index.ts
 *
 * Bundled copy of the Myncel handbook for offline use in the native app.
 *
 * This JSON is built from /lib/handbook/content.ts in the web repo by:
 *   npx tsc lib/handbook/content.ts --outDir /tmp/h --target es2020 \
 *     --module esnext --moduleResolution node --esModuleInterop --skipLibCheck
 *   node --input-type=module -e "import('/tmp/h/content.js').then(m => \
 *     require('fs').writeFileSync('myncel-mobile/src/handbook/content.json', \
 *     JSON.stringify(m.HANDBOOK_CHAPTERS,null,2)))"
 *
 * Re-run that whenever the web handbook changes so the native app stays in sync.
 */

import handbook from './content.json';

export interface HandbookSection {
  heading: string;
  body: string[];
  bullets?: string[];
  steps?: string[];
  callout?: { type: 'tip' | 'warning' | 'info'; text: string };
}

export interface HandbookChapter {
  slug: string;
  emoji: string;
  title: string;
  summary: string;
  sections: HandbookSection[];
}

export const HANDBOOK_CHAPTERS = handbook as HandbookChapter[];

export function findChapter(slug: string): HandbookChapter | undefined {
  return HANDBOOK_CHAPTERS.find((c) => c.slug === slug);
}
