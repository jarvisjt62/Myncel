/**
 * Marketing comparison-page primitives.
 *
 * Used by /compare/myncel-vs-upkeep, /compare/myncel-vs-limble, etc.
 *
 * Designed to:
 *   - Rank for "myncel vs <competitor>" and "<competitor> alternatives"
 *   - Be cited by AI search engines (clear feature tables, named entities,
 *     concrete claims with numbers).
 *   - Stay honest \u2014 every cell is a factual statement we can defend.
 *
 * Each ComparisonRow produces one HTML <tr>; each ComparisonSection a
 * page-level block. Keep the data in the page file so writers can edit
 * copy without touching layout code.
 */

export interface CompareFeature {
  feature: string;
  myncel: string;
  competitor: string;
  /** Optional explanatory note shown under the row */
  note?: string;
  /** True if Myncel "wins" this row \u2014 just controls visual emphasis */
  myncelWins?: boolean;
}

export interface CompareFAQ {
  q: string;
  a: string;
}

interface Props {
  competitor: string;          // 'UpKeep'
  competitorTagline?: string;  // 'CMMS for technicians'
  hookLine: string;            // one-sentence positioning vs them
  switchReasons: { title: string; body: string }[];
  features: CompareFeature[];
  faqs: CompareFAQ[];
  pricing: {
    myncel: { plan: string; price: string; per: string; note?: string };
    competitor: { plan: string; price: string; per: string; note?: string };
  };
  ctaUrl?: string;
}

export default function ComparisonPage(props: Props) {
  const {
    competitor,
    competitorTagline,
    hookLine,
    switchReasons,
    features,
    faqs,
    pricing,
    ctaUrl = '/signup',
  } = props;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Comparison
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Myncel vs {competitor}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            {hookLine}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={ctaUrl}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              Start free trial
            </a>
            <a
              href="/pricing"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              See pricing
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            14-day free trial &middot; No credit card required &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* WHY TEAMS SWITCH */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Why teams switch from {competitor} to Myncel
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {switchReasons.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-600">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE TABLE */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Side-by-side comparison
          </h2>
          {competitorTagline && (
            <p className="mt-3 text-center text-sm text-gray-500">
              {competitor}: {competitorTagline}
            </p>
          )}
          <div className="mt-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-indigo-600">
                    Myncel
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {competitor}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {features.map((f, i) => (
                  <tr key={i} className={f.myncelWins ? 'bg-indigo-50/40' : ''}>
                    <td className="px-4 py-4 align-top font-medium text-gray-900">
                      {f.feature}
                      {f.note && (
                        <span className="mt-1 block text-xs font-normal text-gray-500">
                          {f.note}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-gray-700">
                      {f.myncel}
                    </td>
                    <td className="px-4 py-4 align-top text-gray-700">
                      {f.competitor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Pricing
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border-2 border-indigo-600 bg-white p-8 shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Myncel
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {pricing.myncel.plan}
            </p>
            <p className="mt-4 text-4xl font-bold text-gray-900">
              {pricing.myncel.price}
              <span className="text-base font-normal text-gray-500">
                {' '}/{pricing.myncel.per}
              </span>
            </p>
            {pricing.myncel.note && (
              <p className="mt-3 text-sm text-gray-600">{pricing.myncel.note}</p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {competitor}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {pricing.competitor.plan}
            </p>
            <p className="mt-4 text-4xl font-bold text-gray-900">
              {pricing.competitor.price}
              <span className="text-base font-normal text-gray-500">
                {' '}/{pricing.competitor.per}
              </span>
            </p>
            {pricing.competitor.note && (
              <p className="mt-3 text-sm text-gray-600">
                {pricing.competitor.note}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer text-base font-semibold text-gray-900 marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Ready to try Myncel?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
          Live in under 30 minutes. Import your existing equipment from a CSV,
          schedule your first PM, and start tracking work orders today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={ctaUrl}
            className="rounded-lg bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow hover:bg-indigo-700"
          >
            Start free trial
          </a>
          <a
            href="/contact"
            className="rounded-lg border border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Talk to us
          </a>
        </div>
      </section>
    </main>
  );
}

/**
 * Build the JSON-LD blocks for a comparison page \u2014 used by individual
 * compare pages so AI search engines can cite the structured comparison
 * directly. Returns the JSON to embed in a single <script type="application/ld+json">.
 */
export function buildComparisonJsonLd({
  competitor,
  url,
  description,
  faqs,
}: {
  competitor: string;
  url: string;
  description: string;
  faqs: CompareFAQ[];
}) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Myncel vs ${competitor}`,
      url,
      description,
      isPartOf: { '@type': 'WebSite', url: 'https://www.myncel.com' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
}
