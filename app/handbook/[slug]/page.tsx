import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { HANDBOOK_CHAPTERS, findChapter, type HandbookSection } from '@/lib/handbook/content';
import HandbookSidebar from '../HandbookSidebar';
import HandbookDownloadButton from '../HandbookDownloadButton';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return HANDBOOK_CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const chapter = findChapter(params.slug);
  if (!chapter) return { title: 'Chapter not found — Myncel Handbook' };
  return {
    title: `${chapter.title} — Myncel Handbook`,
    description: chapter.summary,
    alternates: { canonical: `https://www.myncel.com/handbook/${chapter.slug}` },
  };
}

function CalloutBox({ type, text }: { type: 'tip' | 'warning' | 'info'; text: string }) {
  const styles = {
    tip: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '💡', label: 'Tip' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-300', icon: '⚠️', label: 'Warning' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️', label: 'Info' },
  }[type];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-4 my-4`}>
      <div className="flex gap-3">
        <span className="text-xl">{styles.icon}</span>
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-[#425466] mb-1">
            {styles.label}
          </div>
          <p className="text-sm text-[#0a2540] leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: HandbookSection }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-[#0a2540] mb-3 scroll-mt-20" id={slugify(section.heading)}>
        {section.heading}
      </h2>
      {section.body.map((p, i) => (
        <p key={i} className="text-[#425466] leading-relaxed mb-3">
          {p}
        </p>
      ))}
      {section.bullets && section.bullets.length > 0 && (
        <ul className="list-disc pl-6 space-y-1 mb-3 text-[#425466]">
          {section.bullets.map((b, i) => (
            <li key={i} className="leading-relaxed">{b}</li>
          ))}
        </ul>
      )}
      {section.steps && section.steps.length > 0 && (
        <ol className="list-decimal pl-6 space-y-1 mb-3 text-[#425466]">
          {section.steps.map((s, i) => (
            <li key={i} className="leading-relaxed">{s}</li>
          ))}
        </ol>
      )}
      {section.callout && <CalloutBox type={section.callout.type} text={section.callout.text} />}
    </section>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function HandbookChapterPage({ params }: Props) {
  const chapter = findChapter(params.slug);
  if (!chapter) return notFound();

  const idx = HANDBOOK_CHAPTERS.findIndex((c) => c.slug === chapter.slug);
  const prev = idx > 0 ? HANDBOOK_CHAPTERS[idx - 1] : null;
  const next = idx < HANDBOOK_CHAPTERS.length - 1 ? HANDBOOK_CHAPTERS[idx + 1] : null;

  return (
    <>
      <Navbar />
      <main className="bg-[#f6f9fc] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
          <HandbookSidebar activeSlug={chapter.slug} />

          <article className="flex-1 min-w-0 bg-white border border-[#e6ebf1] rounded-xl p-6 md:p-10">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="text-xs text-[#8898aa] uppercase tracking-wider">
                <Link href="/handbook" className="hover:text-[#635bff]">Handbook</Link>
                {' › '}
                Chapter {idx + 1} of {HANDBOOK_CHAPTERS.length}
              </div>
              <HandbookDownloadButton variant="compact" slug={chapter.slug} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-3 flex items-start gap-3">
              <span>{chapter.emoji}</span>
              <span>{chapter.title}</span>
            </h1>
            <p className="text-[#425466] text-base leading-relaxed mb-8 italic border-l-4 border-[#635bff] pl-4">
              {chapter.summary}
            </p>

            {/* In-page TOC */}
            {chapter.sections.length > 1 && (
              <nav className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-4 mb-8">
                <div className="text-xs uppercase tracking-wider text-[#8898aa] font-semibold mb-2">
                  In this chapter
                </div>
                <ul className="space-y-1">
                  {chapter.sections.map((s, i) => (
                    <li key={i}>
                      <a
                        href={`#${slugify(s.heading)}`}
                        className="text-sm text-[#635bff] hover:underline"
                      >
                        {i + 1}. {s.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {chapter.sections.map((s, i) => (
              <SectionBlock key={i} section={s} />
            ))}

            {/* Prev / Next */}
            <div className="border-t border-[#e6ebf1] pt-6 mt-10 grid grid-cols-2 gap-3">
              {prev ? (
                <Link
                  href={`/handbook/${prev.slug}`}
                  className="block p-4 border border-[#e6ebf1] rounded-lg hover:border-[#635bff] transition-colors"
                >
                  <div className="text-xs text-[#8898aa]">← Previous</div>
                  <div className="text-sm font-semibold text-[#0a2540] mt-1">
                    {prev.emoji} {prev.title}
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/handbook/${next.slug}`}
                  className="block p-4 border border-[#e6ebf1] rounded-lg hover:border-[#635bff] transition-colors text-right"
                >
                  <div className="text-xs text-[#8898aa]">Next →</div>
                  <div className="text-sm font-semibold text-[#0a2540] mt-1">
                    {next.emoji} {next.title}
                  </div>
                </Link>
              ) : (
                <Link
                  href="/handbook"
                  className="block p-4 border border-[#e6ebf1] rounded-lg hover:border-[#635bff] transition-colors text-right"
                >
                  <div className="text-xs text-[#8898aa]">Done →</div>
                  <div className="text-sm font-semibold text-[#0a2540] mt-1">
                    📖 Back to handbook home
                  </div>
                </Link>
              )}
            </div>

            {/* Help footer */}
            <div className="mt-8 bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-4 text-sm text-[#425466]">
              Still have questions about this chapter? The AI chat at the bottom-right of every page is grounded in this handbook and answers in seconds. Or{' '}
              <Link href="/contact" className="text-[#635bff] hover:underline font-semibold">
                contact support
              </Link>
              .
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
