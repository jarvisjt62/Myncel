import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const URL = 'https://www.myncel.com/compare';
const DESCRIPTION =
  'Compare Myncel against the leading CMMS platforms — UpKeep, Limble, Fiix, Maintainx — on pricing, mobile offline, IoT, and setup time. Honest side-by-sides.';

export const metadata = {
  title: 'Myncel vs Other CMMS Software — Comparisons & Alternatives',
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: 'Myncel vs Other CMMS — Comparisons & Alternatives',
    description: DESCRIPTION,
    url: URL,
    type: 'website',
  },
};

const COMPARISONS = [
  {
    slug: 'myncel-vs-upkeep',
    competitor: 'UpKeep',
    blurb:
      'Mobile-first CMMS for technicians. We compare pricing, IoT, and setup time for small manufacturers and facilities.',
  },
  {
    slug: 'myncel-vs-limble',
    competitor: 'Limble',
    blurb:
      'Popular CMMS for mid-size manufacturers. See how Myncel’s flat pricing and self-serve onboarding stack up.',
  },
  {
    slug: 'myncel-vs-fiix',
    competitor: 'Fiix',
    blurb:
      'Rockwell’s enterprise CMMS. We compare flat pricing, included IoT, and 30-minute setup against Fiix’s tier-gated model.',
  },
  {
    slug: 'myncel-vs-maintainx',
    competitor: 'MaintainX',
    blurb:
      'Mobile-first CMMS popular with frontline teams. See how flat pricing and included IoT compare to MaintainX’s per-user tiers.',
  },
];

export default function ComparePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="bg-gradient-to-b from-indigo-50 via-white to-white">
          <div className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Compare
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Myncel vs other CMMS software
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Honest side-by-side comparisons against the CMMS platforms small
              manufacturers and facility teams evaluate most often. Every claim
              is something we can defend.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-2">
            {COMPARISONS.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Comparison
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 group-hover:text-indigo-700">
                  Myncel vs {c.competitor}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {c.blurb}
                </p>
                <p className="mt-4 text-sm font-semibold text-indigo-600">
                  Read comparison →
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-12 text-center text-sm text-gray-500">
            More comparisons coming soon: FaultFixers, Hippo CMMS. Want one prioritised?{' '}
            <Link href="/contact" className="text-indigo-600 hover:underline">
              Tell us
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
