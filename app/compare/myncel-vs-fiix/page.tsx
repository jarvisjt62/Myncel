import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ComparisonPage, {
  buildComparisonJsonLd,
  type CompareFeature,
  type CompareFAQ,
} from '../../components/ComparisonPage';

const URL = 'https://www.myncel.com/compare/myncel-vs-fiix';
const DESCRIPTION =
  'Myncel vs Fiix CMMS: pricing, AI features, mobile offline, IoT, and integrations compared side-by-side for small manufacturers and facilities.';

export const metadata = {
  title: 'Myncel vs Fiix: CMMS Comparison for Small & Mid-Size Teams',
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: 'Myncel vs Fiix — Honest CMMS Comparison',
    description:
      'Side-by-side comparison of Myncel and Fiix (by Rockwell Automation) across pricing, mobile, IoT, integrations, and setup time.',
    url: URL,
    type: 'article',
  },
};

const HOOK =
  'Fiix is a Rockwell Automation product geared toward enterprise reliability teams. Myncel is built for the smaller end: $79/month flat, no per-technician pricing, IoT included, and live in 30 minutes without a sales call.';

const SWITCH_REASONS = [
  {
    title: 'Transparent flat pricing',
    body:
      'Fiix lists a Basic tier around $45 per user per month and quotes Professional and Enterprise tiers by sales call. Myncel publishes Starter at $79/month flat with unlimited technicians — no quote, no sales call required.',
  },
  {
    title: 'Built for small teams, not enterprises',
    body:
      'Fiix shines in 200+ asset, multi-site enterprise rollouts. Myncel is engineered for the 5–50 user range typical of small manufacturers, hotels, and facilities — simpler UI, faster onboarding, and no Rockwell ecosystem dependency.',
  },
  {
    title: 'IoT and mobile offline included',
    body:
      'Fiix\u2019s asset risk predictor and IoT integrations are part of higher tiers. Myncel includes vibration, temperature, pressure, and current sensors over Wi-Fi, MQTT, Modbus, and BACnet on every paid plan, plus full Android/iOS offline mode.',
  },
];

const FEATURES: CompareFeature[] = [
  {
    feature: 'Starting price',
    myncel: '$79/month flat (Starter, unlimited users)',
    competitor: '~$45/user/month (Basic); Professional & Enterprise quote-only',
    myncelWins: true,
  },
  {
    feature: 'User pricing model',
    myncel: 'Flat per-organization on Starter & Professional',
    competitor: 'Per-user across all paid tiers',
    myncelWins: true,
  },
  {
    feature: 'Free trial / signup',
    myncel: '14-day free trial; no credit card; instant signup',
    competitor: 'Free tier available; Basic+ typically gated by sales contact',
    myncelWins: true,
  },
  {
    feature: 'Setup time',
    myncel: 'Under 30 minutes; CSV import',
    competitor: 'Weeks; implementation services for Professional & Enterprise',
  },
  {
    feature: 'Mobile offline mode',
    myncel: 'Yes — Android & iOS, full offline cache + sync',
    competitor: 'Yes — offline supported on mobile app',
  },
  {
    feature: 'IoT sensor monitoring',
    myncel: 'Included on all paid plans (Wi-Fi, MQTT, Modbus, BACnet)',
    competitor: 'Asset Risk Predictor and IoT on higher tiers; Rockwell ecosystem oriented',
    myncelWins: true,
  },
  {
    feature: 'AI / predictive features',
    myncel: 'AI-suggested PM intervals, anomaly alerts on every paid plan',
    competitor: 'Asset Risk Predictor on higher tiers',
  },
  {
    feature: 'Preventive maintenance',
    myncel: 'Time-, meter-, and condition-based',
    competitor: 'Time-, meter-, and condition-based',
  },
  {
    feature: 'Work order management',
    myncel: 'Yes — photos, signatures, labor logs',
    competitor: 'Yes — enterprise-grade workflow engine',
  },
  {
    feature: 'Parts inventory',
    myncel: 'Yes — barcode scanning, multi-location, alerts',
    competitor: 'Yes — strong multi-location inventory',
  },
  {
    feature: 'Built-in integrations',
    myncel: 'Google Sheets, QuickBooks, Slack, REST API + webhooks',
    competitor: 'Rockwell FactoryTalk, SAP, Oracle, REST API',
  },
  {
    feature: 'Compliance logs',
    myncel: 'Audit trail on every plan; HACCP, FDA, ISO ready',
    competitor: 'Strong audit & compliance features',
  },
  {
    feature: 'Best fit',
    myncel: 'Small manufacturers, hotels, hospitals, warehouses, 5–50 user range',
    competitor: 'Enterprise reliability teams, 100+ users, multi-site Rockwell shops',
  },
];

const FAQS: CompareFAQ[] = [
  {
    q: 'Is Myncel cheaper than Fiix?',
    a:
      'For small and mid-size teams, yes. Fiix Basic starts around $45 per user per month and Professional/Enterprise are quote-only. Myncel\u2019s Starter plan is $79/month flat for unlimited technicians, so a 5-person team typically pays $145+ less per month and a 10-person team $370+ less per month than equivalent Fiix coverage.',
  },
  {
    q: 'Can I migrate from Fiix to Myncel?',
    a:
      'Yes. Export your assets, work orders, parts, and PM schedules from Fiix as CSVs. Myncel\u2019s import wizard maps the columns automatically and most teams complete the migration in under two hours. Meter readings and PM intervals are preserved.',
  },
  {
    q: 'Does Myncel work for enterprise rollouts the way Fiix does?',
    a:
      'Fiix is purpose-built for enterprise reliability programs with deep Rockwell FactoryTalk integration. Myncel is intentionally focused on the small-to-mid market (5–50 users per org). If you need a Rockwell-native, multi-site, multi-currency rollout for hundreds of users, Fiix may be a better fit. If you want flat pricing, fast setup, and modern UX without an implementation project, Myncel is the better choice.',
  },
  {
    q: 'Does Myncel have predictive maintenance like Fiix Asset Risk Predictor?',
    a:
      'Yes. Myncel includes AI-suggested PM intervals, condition-based triggers from IoT sensors, and anomaly alerts on every paid plan — not gated to a higher tier. The depth of statistical modeling is more focused than enterprise reliability suites, but covers the practical use cases for small manufacturers and facilities.',
  },
  {
    q: 'Can I start without talking to sales?',
    a:
      'Yes. Pricing is public on the website and you can sign up for a 14-day free trial in two minutes with no credit card. Demos are available on request but are never required.',
  },
  {
    q: 'Does Myncel integrate with QuickBooks and Slack like Fiix?',
    a:
      'Yes. Myncel ships with Google Sheets, QuickBooks, and Slack integrations plus a REST API and webhook framework so you can wire it into existing accounting and notification workflows. Rockwell FactoryTalk-specific integrations are not supported — that is one area where Fiix has a structural advantage.',
  },
];

export default function MyncelVsFiix() {
  const jsonLd = buildComparisonJsonLd({
    competitor: 'Fiix',
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
        competitor="Fiix"
        competitorTagline="CMMS by Rockwell Automation, built for enterprise reliability teams"
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
            plan: 'Basic',
            price: '~$45',
            per: 'user/month',
            note: 'Professional & Enterprise tiers are quote-only.',
          },
        }}
      />
      <Footer />
    </>
  );
}
