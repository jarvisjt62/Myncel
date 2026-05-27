import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ComparisonPage, {
  buildComparisonJsonLd,
  type CompareFeature,
  type CompareFAQ,
} from '../../components/ComparisonPage';

const URL = 'https://www.myncel.com/compare/myncel-vs-limble';
const DESCRIPTION =
  'Compare Myncel vs Limble CMMS: pricing, ease of setup, IoT support, mobile offline, and integrations. Honest side-by-side for small manufacturers and facilities.';

export const metadata = {
  title: 'Myncel vs Limble: CMMS Comparison for Small Manufacturers',
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: 'Myncel vs Limble — Honest CMMS Comparison',
    description:
      'Side-by-side comparison of Myncel and Limble CMMS across pricing, offline mobile, IoT, integrations, and setup time.',
    url: URL,
    type: 'article',
  },
};

const HOOK =
  'Limble is a popular CMMS for mid-size manufacturers. Myncel is built for the smaller end: $79/month flat instead of per-user, IoT sensors included, and live in 30 minutes without an implementation call.';

const SWITCH_REASONS = [
  {
    title: 'No per-user pricing on Starter',
    body:
      'Limble’s Standard plan is $40 per user per month and Premium+ is $69 per user per month. Myncel’s Starter plan is $79/month flat with unlimited technicians, so adding people doesn’t add cost.',
  },
  {
    title: 'Self-serve, not sales-led',
    body:
      'Limble routes most prospects to a sales call before pricing or trial. Myncel publishes pricing publicly and lets you start a 14-day free trial in two minutes — no credit card, no demo required.',
  },
  {
    title: 'IoT sensors included',
    body:
      'Limble’s sensor and condition-monitoring features sit on its higher Premium+ tier. Myncel includes vibration, temperature, pressure, and current sensor support over Wi-Fi, MQTT, Modbus, and BACnet on every paid plan.',
  },
];

const FEATURES: CompareFeature[] = [
  {
    feature: 'Starting price',
    myncel: '$79/month flat (Starter, unlimited users)',
    competitor: '$28/user/month (Standard); free tier limited to 3 users',
    myncelWins: true,
  },
  {
    feature: 'User pricing model',
    myncel: 'Flat per-organization on Starter & Professional',
    competitor: 'Per-user across Standard, Premium+, Enterprise',
    myncelWins: true,
  },
  {
    feature: 'Free trial / signup',
    myncel: '14-day free trial; no credit card; instant signup',
    competitor: 'Free starter tier (3 users); demo call typically required for Standard+',
    myncelWins: true,
  },
  {
    feature: 'Setup time',
    myncel: 'Under 30 minutes; CSV import',
    competitor: 'Days to weeks; guided onboarding included',
  },
  {
    feature: 'Mobile offline mode',
    myncel: 'Yes — Android & iOS, full offline cache + sync',
    competitor: 'Yes — limited offline support',
  },
  {
    feature: 'IoT sensor monitoring',
    myncel: 'Included on all paid plans',
    competitor: 'Premium+ tier only',
    myncelWins: true,
  },
  {
    feature: 'Preventive maintenance',
    myncel: 'Time-, meter-, and condition-based',
    competitor: 'Time-, meter-, and condition-based',
  },
  {
    feature: 'Work order management',
    myncel: 'Yes — photos, signatures, labor logs',
    competitor: 'Yes — strong work order features',
  },
  {
    feature: 'Parts inventory',
    myncel: 'Yes — barcode scanning, multi-location, alerts',
    competitor: 'Yes — strong inventory features',
  },
  {
    feature: 'Reports & analytics',
    myncel: 'MTBF, MTTR, PM compliance, downtime, cost',
    competitor: 'Strong dashboards and analytics',
  },
  {
    feature: 'Built-in integrations',
    myncel: 'Google Sheets, QuickBooks, Slack, REST API + webhooks',
    competitor: 'QuickBooks, Slack, Power BI, Sage, REST API',
  },
  {
    feature: 'Compliance logs',
    myncel: 'Audit trail on every plan; HACCP, FDA, ISO ready',
    competitor: 'Audit features on higher tiers',
    myncelWins: true,
  },
  {
    feature: 'Best fit',
    myncel: 'Small manufacturers, hotels, hospitals, warehouses, oil & gas in 5–50 user range',
    competitor: 'Mid-size manufacturers and facilities, 25–500 users',
  },
];

const FAQS: CompareFAQ[] = [
  {
    q: 'Is Myncel cheaper than Limble?',
    a:
      'For small teams, yes. Limble’s Standard plan is $28 per user per month (or $40 for Premium+ which is what most teams actually need for PM, parts, and reports). Myncel’s Starter plan is $79/month flat for unlimited technicians, so a 5-person team typically pays $40–125 less per month and a 10-person team $200+ less per month.',
  },
  {
    q: 'Can I migrate from Limble to Myncel?',
    a:
      'Yes. Export your assets, work orders, and parts from Limble as CSVs. Myncel’s import wizard maps the columns and most customers complete the migration in under an hour. Your existing PM intervals and meter readings are preserved.',
  },
  {
    q: 'Does Myncel have the same depth of analytics as Limble?',
    a:
      'For the core CMMS KPIs — MTBF, MTTR, PM compliance, schedule attainment, downtime, and maintenance cost — yes. Limble has more visualization depth on its higher tiers, which is useful for plants tracking dozens of asset categories. For small and mid-size shops, Myncel’s reports cover the metrics that drive decisions.',
  },
  {
    q: 'Is Myncel only for manufacturers?',
    a:
      'No. Myncel is industry-agnostic. It powers maintenance for hotels, hospitals, warehouses, and oil and gas operators in addition to small manufacturers, with industry templates for HACCP, JCI, and FDA-aligned audit trails.',
  },
  {
    q: 'Can I start without a sales call?',
    a:
      'Yes. Pricing is published on the website. You can sign up for the 14-day free trial in two minutes with no credit card and no demo required. Sales calls are available if you want one, but they are never a prerequisite.',
  },
  {
    q: 'Does Myncel have IoT sensor monitoring like Limble Premium+?',
    a:
      'Yes — and it’s included on every paid plan rather than gated to a higher tier. Myncel supports Wi-Fi sensors, MQTT, Modbus, and BACnet so you can use vibration, temperature, pressure, and current sensors to drive condition-based PMs and threshold alerts.',
  },
];

export default function MyncelVsLimble() {
  const jsonLd = buildComparisonJsonLd({
    competitor: 'Limble',
    url: URL,
    description: DESCRIPTION,
    faqs: FAQS,
  });

  return (
    <>
      <Navbar />
      {jsonLd.map((j, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }}
        />
      ))}
      <ComparisonPage
        competitor="Limble"
        competitorTagline="CMMS for mid-size manufacturers and facilities"
        hookLine={HOOK}
        switchReasons={SWITCH_REASONS}
        features={FEATURES}
        faqs={FAQS}
        pricing={{
          myncel: {
            plan: 'Starter',
            price: '$79',
            per: 'month',
            note: 'Flat rate. Unlimited technicians. 14-day free trial.',
          },
          competitor: {
            plan: 'Standard',
            price: '$28',
            per: 'user/month',
            note: 'Premium+ tier with sensors and analytics: $69/user/month.',
          },
        }}
      />
      <Footer />
    </>
  );
}
