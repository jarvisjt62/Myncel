import { NextRequest, NextResponse } from 'next/server';
import { HANDBOOK_CHAPTERS, type HandbookChapter, type HandbookSection } from '@/lib/handbook/content';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';

/**
 * GET /api/handbook/download?format=md|html|txt|json|docx[&slug=getting-started]
 *
 * Public endpoint — anyone can download the handbook in any format.
 * If `slug` is provided, only that one chapter is exported.
 * Otherwise the entire handbook is exported as a single file.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FORMATS = ['md', 'html', 'txt', 'json', 'docx'] as const;
type Format = (typeof ALLOWED_FORMATS)[number];

function chaptersToInclude(slug: string | null): HandbookChapter[] {
  if (!slug) return HANDBOOK_CHAPTERS;
  const c = HANDBOOK_CHAPTERS.find((x) => x.slug === slug);
  return c ? [c] : [];
}

// ---------------------------------------------------------------
// MARKDOWN
// ---------------------------------------------------------------
function toMarkdown(chapters: HandbookChapter[]): string {
  const lines: string[] = [];
  lines.push('# Myncel Handbook');
  lines.push('');
  lines.push('_The complete user manual for the Myncel maintenance management platform._');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('Source: https://www.myncel.com/handbook');
  lines.push('');
  lines.push('---');
  lines.push('');

  if (chapters.length > 1) {
    lines.push('## Table of Contents');
    lines.push('');
    chapters.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.emoji} **${c.title}** — ${c.summary.split('.')[0]}.`);
    });
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  for (const c of chapters) {
    lines.push(`## ${c.emoji} ${c.title}`);
    lines.push('');
    lines.push(`> ${c.summary}`);
    lines.push('');

    for (const s of c.sections) {
      lines.push(`### ${s.heading}`);
      lines.push('');
      for (const p of s.body) {
        lines.push(p);
        lines.push('');
      }
      if (s.bullets) {
        for (const b of s.bullets) lines.push(`- ${b}`);
        lines.push('');
      }
      if (s.steps) {
        s.steps.forEach((st, i) => lines.push(`${i + 1}. ${st}`));
        lines.push('');
      }
      if (s.callout) {
        const prefix = s.callout.type === 'tip' ? '💡 **Tip:**' : s.callout.type === 'warning' ? '⚠️ **Warning:**' : 'ℹ️ **Info:**';
        lines.push(`> ${prefix} ${s.callout.text}`);
        lines.push('');
      }
    }
    lines.push('---');
    lines.push('');
  }

  lines.push('');
  lines.push('© Myncel · https://www.myncel.com');
  return lines.join('\n');
}

// ---------------------------------------------------------------
// HTML (print-styled — open in browser, hit Ctrl/Cmd+P → save as PDF)
// ---------------------------------------------------------------
function toHtml(chapters: HandbookChapter[]): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const sectionHtml = (s: HandbookSection): string => {
    const parts: string[] = [];
    parts.push(`<h3>${escape(s.heading)}</h3>`);
    for (const p of s.body) parts.push(`<p>${escape(p)}</p>`);
    if (s.bullets) {
      parts.push('<ul>');
      for (const b of s.bullets) parts.push(`<li>${escape(b)}</li>`);
      parts.push('</ul>');
    }
    if (s.steps) {
      parts.push('<ol>');
      for (const st of s.steps) parts.push(`<li>${escape(st)}</li>`);
      parts.push('</ol>');
    }
    if (s.callout) {
      const cls = `callout callout-${s.callout.type}`;
      const icon = s.callout.type === 'tip' ? '💡' : s.callout.type === 'warning' ? '⚠️' : 'ℹ️';
      parts.push(`<div class="${cls}"><span class="callout-icon">${icon}</span><span>${escape(s.callout.text)}</span></div>`);
    }
    return parts.join('\n');
  };

  const chapterHtml = (c: HandbookChapter, i: number): string => {
    return `
      <section class="chapter">
        <div class="chapter-num">Chapter ${i + 1}</div>
        <h2>${c.emoji} ${escape(c.title)}</h2>
        <p class="summary">${escape(c.summary)}</p>
        ${c.sections.map(sectionHtml).join('\n')}
      </section>
    `;
  };

  const toc = chapters.length > 1
    ? `
      <section class="toc">
        <h2>Table of Contents</h2>
        <ol>
          ${chapters.map((c) => `<li>${c.emoji} ${escape(c.title)}</li>`).join('\n')}
        </ol>
      </section>
    `
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Myncel Handbook</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 780px; margin: 40px auto; padding: 0 20px; color: #0a2540; line-height: 1.6; }
  h1 { font-size: 36px; margin-bottom: 0; color: #0a2540; }
  h1 + .meta { color: #8898aa; font-size: 13px; margin-bottom: 32px; }
  h2 { font-size: 26px; margin-top: 40px; padding-top: 20px; border-top: 2px solid #635bff; color: #0a2540; }
  h3 { font-size: 18px; margin-top: 24px; color: #0a2540; }
  p { color: #425466; margin: 12px 0; }
  ul, ol { color: #425466; padding-left: 24px; }
  li { margin: 4px 0; }
  .summary { font-style: italic; color: #425466; padding-left: 16px; border-left: 4px solid #635bff; }
  .chapter-num { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8898aa; margin-top: 24px; }
  .toc ol li { margin: 8px 0; font-size: 16px; }
  .callout { display: flex; gap: 12px; padding: 14px 16px; border-radius: 8px; margin: 16px 0; border: 1px solid; }
  .callout-icon { font-size: 18px; }
  .callout-tip { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
  .callout-warning { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
  .callout-info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  .chapter { page-break-before: always; }
  .chapter:first-of-type { page-break-before: auto; }
  .footer { margin-top: 60px; text-align: center; color: #8898aa; font-size: 13px; border-top: 1px solid #e6ebf1; padding-top: 24px; }
  .print-cta { background: #635bff; color: white; padding: 12px 20px; border-radius: 8px; display: inline-block; margin: 8px 0 24px 0; cursor: pointer; border: none; font-size: 14px; font-weight: 600; text-decoration: none; }
  @media print {
    body { max-width: 100%; padding: 0; }
    .print-cta, .no-print { display: none !important; }
    h2 { page-break-after: avoid; }
  }
</style>
</head>
<body>
  <h1>📖 Myncel Handbook</h1>
  <div class="meta">
    The complete user manual · Generated ${new Date().toLocaleString()} · <a href="https://www.myncel.com/handbook">myncel.com/handbook</a>
  </div>
  <button class="print-cta no-print" onclick="window.print()">🖨 Print or save as PDF</button>
  ${toc}
  ${chapters.map(chapterHtml).join('\n')}
  <div class="footer">© Myncel · <a href="https://www.myncel.com">https://www.myncel.com</a></div>
</body>
</html>`;
}

// ---------------------------------------------------------------
// PLAIN TEXT
// ---------------------------------------------------------------
function toText(chapters: HandbookChapter[]): string {
  const lines: string[] = [];
  lines.push('MYNCEL HANDBOOK');
  lines.push('===============');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('Source: https://www.myncel.com/handbook');
  lines.push('');

  for (const c of chapters) {
    lines.push('');
    lines.push(`${c.emoji}  ${c.title.toUpperCase()}`);
    lines.push('-'.repeat(60));
    lines.push(c.summary);
    lines.push('');

    for (const s of c.sections) {
      lines.push('');
      lines.push(s.heading);
      lines.push('~'.repeat(s.heading.length));
      for (const p of s.body) {
        lines.push(p);
        lines.push('');
      }
      if (s.bullets) {
        for (const b of s.bullets) lines.push(`  • ${b}`);
        lines.push('');
      }
      if (s.steps) {
        s.steps.forEach((st, i) => lines.push(`  ${i + 1}. ${st}`));
        lines.push('');
      }
      if (s.callout) {
        const tag = s.callout.type === 'tip' ? '[TIP]' : s.callout.type === 'warning' ? '[WARNING]' : '[INFO]';
        lines.push(`  ${tag} ${s.callout.text}`);
        lines.push('');
      }
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('© Myncel · https://www.myncel.com');
  return lines.join('\n');
}

// ---------------------------------------------------------------
// DOCX (Word-compatible)
// ---------------------------------------------------------------
async function toDocx(chapters: HandbookChapter[]): Promise<Buffer> {
  const para = (text: string, opts: any = {}): Paragraph =>
    new Paragraph({
      children: [new TextRun({ text, ...opts })],
      spacing: { after: 120 },
      ...(opts.alignment ? { alignment: opts.alignment } : {}),
    });

  const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph =>
    new Paragraph({
      children: [new TextRun({ text, bold: true })],
      heading: level,
      spacing: { before: 240, after: 120 },
    });

  const children: Paragraph[] = [];

  // Title page
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '📖 Myncel Handbook', bold: true, size: 48 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'The complete user manual', italics: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Generated ${new Date().toLocaleString()}`, size: 18, color: '8898aa' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
    })
  );

  if (chapters.length > 1) {
    children.push(heading('Table of Contents', HeadingLevel.HEADING_1));
    chapters.forEach((c, i) => {
      children.push(para(`${i + 1}. ${c.emoji} ${c.title}`));
    });
  }

  for (const c of chapters) {
    children.push(heading(`${c.emoji} ${c.title}`, HeadingLevel.HEADING_1));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: c.summary, italics: true, color: '425466' })],
        spacing: { after: 240 },
      })
    );

    for (const s of c.sections) {
      children.push(heading(s.heading, HeadingLevel.HEADING_2));
      for (const p of s.body) {
        children.push(para(p));
      }
      if (s.bullets) {
        for (const b of s.bullets) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: b })],
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
        }
      }
      if (s.steps) {
        s.steps.forEach((st, i) => {
          children.push(para(`${i + 1}. ${st}`));
        });
      }
      if (s.callout) {
        const tag = s.callout.type === 'tip' ? '💡 Tip' : s.callout.type === 'warning' ? '⚠️ Warning' : 'ℹ️ Info';
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${tag}: `, bold: true }),
              new TextRun({ text: s.callout.text }),
            ],
            spacing: { after: 240 },
            shading: { fill: 'f6f9fc', type: 'clear' as any, color: 'auto' },
          })
        );
      }
    }
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '© Myncel · https://www.myncel.com', size: 18, color: '8898aa' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
    })
  );

  const doc = new Document({
    creator: 'Myncel',
    title: 'Myncel Handbook',
    description: 'The complete Myncel user manual',
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}

// ---------------------------------------------------------------
// HANDLER
// ---------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fmt = (searchParams.get('format') || 'md').toLowerCase() as Format;
  const slug = searchParams.get('slug');

  if (!ALLOWED_FORMATS.includes(fmt)) {
    return NextResponse.json(
      { error: `format must be one of: ${ALLOWED_FORMATS.join(', ')}` },
      { status: 400 }
    );
  }

  const chapters = chaptersToInclude(slug);
  if (chapters.length === 0) {
    return NextResponse.json({ error: `chapter not found: ${slug}` }, { status: 404 });
  }

  const baseName = slug ? `myncel-handbook-${slug}` : 'myncel-handbook';
  const date = new Date().toISOString().slice(0, 10);

  try {
    if (fmt === 'json') {
      return new NextResponse(JSON.stringify({ chapters, generatedAt: new Date().toISOString() }, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseName}-${date}.json"`,
        },
      });
    }

    if (fmt === 'md') {
      return new NextResponse(toMarkdown(chapters), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseName}-${date}.md"`,
        },
      });
    }

    if (fmt === 'txt') {
      return new NextResponse(toText(chapters), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseName}-${date}.txt"`,
        },
      });
    }

    if (fmt === 'html') {
      // Inline (so the Print button works) — disposition=inline
      return new NextResponse(toHtml(chapters), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${baseName}-${date}.html"`,
        },
      });
    }

    if (fmt === 'docx') {
      const buf = await toDocx(chapters);
      // Copy the Node Buffer into a fresh ArrayBuffer so the type is
      // unambiguously `ArrayBuffer` (not `ArrayBufferLike` or `SharedArrayBuffer`),
      // which both `Blob` and `BodyInit` accept across Node/DOM lib mixes.
      const ab = new ArrayBuffer(buf.byteLength);
      new Uint8Array(ab).set(buf);
      const blob = new Blob([ab], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${baseName}-${date}.docx"`,
          'Content-Length': String(blob.size),
        },
      });
    }

    return NextResponse.json({ error: 'unsupported format' }, { status: 400 });
  } catch (err: any) {
    console.error('[handbook/download] error:', err?.message || err);
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }
}
