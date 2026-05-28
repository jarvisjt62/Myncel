import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToDashboardBar from '../components/BackToDashboardBar';
import { HANDBOOK_CHAPTERS } from '@/lib/handbook/content';
import HandbookSidebar from './HandbookSidebar';
import HandbookDownloadButton from './HandbookDownloadButton';

export const metadata = {
  title: 'Myncel Handbook — The Complete User Manual',
  description:
    'The complete Myncel user handbook. Everything from connecting your first equipment to setting up predictive maintenance, work orders, mobile push, integrations, and more.',
  alternates: { canonical: 'https://www.myncel.com/handbook' },
  openGraph: {
    title: 'Myncel Handbook — The Complete User Manual',
    description: 'Step-by-step guides for every Myncel feature.',
    url: 'https://www.myncel.com/handbook',
  },
};

export default function HandbookHomePage() {
  return (
    <>
      <Navbar />
      <BackToDashboardBar />
      <main className="bg-[#f6f9fc] min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0a2540] to-[#1e3a5f] text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-sm uppercase tracking-wider text-[#8898aa] mb-3">
              📖 User Handbook
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to master Myncel
            </h1>
            <p className="text-lg text-[#cbd5e1] max-w-2xl">
              From adding your first machine to running a full predictive-maintenance program — every feature, explained step-by-step. New users start here; pros use it as a reference.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/handbook/getting-started"
                className="px-5 py-3 bg-[#635bff] hover:bg-[#5b54e0] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                🚀 Start with Getting Started →
              </Link>
              <Link
                href="/free-trial"
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Start a free trial
              </Link>
            </div>
          </div>
        </section>

        {/* Layout: sidebar + content */}
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
          <HandbookSidebar activeSlug="" />

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-[#0a2540] mb-2">All chapters</h2>
            <p className="text-[#425466] text-sm mb-6">
              {HANDBOOK_CHAPTERS.length} chapters covering every part of Myncel.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {HANDBOOK_CHAPTERS.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/handbook/${c.slug}`}
                  className="block bg-white border border-[#e6ebf1] rounded-xl p-5 hover:border-[#635bff] hover:shadow-md transition-all"
                >
                  <div className="text-xs text-[#8898aa] mb-1">Chapter {i + 1}</div>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl">{c.emoji}</span>
                    <h3 className="text-lg font-semibold text-[#0a2540] leading-tight">
                      {c.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[#425466] line-clamp-3">{c.summary}</p>
                  <div className="mt-3 text-xs text-[#635bff] font-semibold">
                    Read chapter →
                  </div>
                </Link>
              ))}
            </div>

            {/* Download the handbook */}
            <div className="mt-8">
              <HandbookDownloadButton variant="card" />
            </div>

            {/* Search hint */}
            <div className="mt-10 bg-white border border-[#e6ebf1] rounded-xl p-5">
              <h3 className="text-base font-semibold text-[#0a2540] mb-1">
                Can't find what you need?
              </h3>
              <p className="text-sm text-[#425466] mb-3">
                Try the AI assistant in the chat widget at the bottom right of every page — it is grounded in this handbook and answers in plain English. Or jump straight to live support.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/help"
                  className="px-3 py-1.5 bg-[#f6f9fc] border border-[#e6ebf1] text-sm rounded text-[#425466] hover:bg-white"
                >
                  Help center
                </Link>
                <Link
                  href="/docs"
                  className="px-3 py-1.5 bg-[#f6f9fc] border border-[#e6ebf1] text-sm rounded text-[#425466] hover:bg-white"
                >
                  Technical docs
                </Link>
                <Link
                  href="/contact"
                  className="px-3 py-1.5 bg-[#f6f9fc] border border-[#e6ebf1] text-sm rounded text-[#425466] hover:bg-white"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
