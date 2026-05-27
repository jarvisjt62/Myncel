import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ComparisonPage, {
  buildComparisonJsonLd,
  type CompareFeature,
  type CompareFAQ,
} from '../../components/ComparisonPage';

const URL = 'https://www.myncel.com/compare/myncel-vs-maintainx';
const DESCRIPTION =
  'Myncel vs MaintainX CMMS: pricing, IoT, mobile offline, integrations, and setup time compared side-by-side for small manufacturers, hotels, and facilities.';

export const metadata = {
  title: 'Myncel vs MaintainX: CMMS Comparison for Small Teams',
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: 'Myncel vs MaintainX — Honest CMMS Comparison',
    description:
      'Side-by-side comparison of Myncel and MaintainX across pricing, offline mobile, IoT, integrations, and setup time.',
    url: URL,
    type: 'article',
  },
};

const HOOK =
  'MaintainX is the most-installed mobile-first CMMS, popular with frontline technicians. Myncel matches the mobile experience but adds flat pricing, included IoT sensors, and a self-serve trial without a sales call.';

const SWITCH_REASONS = [
  {
    title: 'Flat pricing instead of per-user',
    body:
      'MaintainX Essential is $21 per user per month and Premium is $59 per user per month. Myncel\u2019s Starter plan is $79/month flat with unlimited technicians, so adding people doesn\u2019t add cost.',
  },
  {
    title: 'IoT sensors included on every paid plan',
    body:
      'MaintainX adds IoT and condition-monitoring on the Premium tier and above. Myncel includes vibration, temperature, pressure, and current sensor support over Wi-Fi, MQTT, Modbus, and BACnet on every paid plan.',
  },
  {
    title: 'Compliance audit trail without upgrading',
    body:
      'Audit logging, role-based permissions, and SSO are usually gated behind MaintainX Premium or Enterprise. Myncel ships audit trails and granular permissions on Starter — useful for HACCP, FDA, JCI, and ISO 9001 documentation from day one.',
  },
];

const FEATURES: CompareFeature[] = [
  {
    feature: 'Starting price',
    myncel: '$79/month flat (Starter, unlimited users)',
    competitor: '$21/user/month (Essential); free tier available',
    myncelWins: true,
  },
  {
    feature: 'User pricing model',
    myncel: 'Flat per-organization on Starter & Professional',
    competitor: 'Per-user across Essential, Premium, Enterprise',
    myncelWins: true,
  },
  {
    feature: 'Free trial / signup',
    myncel: '14-day free trial; no credit card; instant signup',
    competitor: 'Free tier; paid trial typically self-serve',
  },
  {
    feature: 'Setup time',
    myncel: 'Under 30 minutes; CSV import',
    competitor: 'Hours to days; strong onboarding flow',
  },
  {
    feature: 'Mobile-first experience',
    myncel: 'Yes — Android & iOS, full offline cache + sync',
    competitor: 'Yes — best-in-class mobile UX',
  },
  {
    feature: 'IoT sensor monitoring',
    myncel: 'Included on all paid plans',
    competitor: 'Premium tier and above',
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
    competitor: 'Yes — strong photo and chat workflow',
  },
  {
    feature: 'Parts inventory',
    myncel: 'Yes — barcode scanning, multi-location, alerts',
    competitor: 'Yes — barcode scanning, alerts',
  },
  {
    feature: 'Audit log & RBAC',
    myncel: 'Included on every paid plan',
    competitor: 'Premium / Enterprise tiers',
    myncelWins: true,
  },
  {
    feature: 'Reports & analytics',
    myncel: 'MTBF, MTTR, PM compliance, downtime, cost',
    competitor: 'Strong reporting on Premium and above',
  },
  {
    feature: 'Built-in integrations',
    myncel: 'Google Sheets, QuickBooks, Slack, REST API + webhooks',
    competitor: 'QuickBooks, Slack, Power BI, REST API (higher tiers)',
  },
  {
    feature: 'Best fit',
    myncel: 'Small manufacturers, hotels, hospitals, warehouses, oil & gas in 5–50 user range',
    competitor: 'Frontline-heavy teams of all sizes; strong in service & facilities',
  },
];

const FAQS: CompareFAQ[] = [
  {
    q: 'Is Myncel cheaper than MaintainX?',
    a:
      'For teams of 4 or more users, almost always. MaintainX Essential is $21 per user per month and Premium (which adds IoT, audit trail, and advanced reports) is $59 per user per month. Myncel\u2019s Starter plan is $79/month flat for unlimited technicians, so a 5-person team on MaintainX Premium pays roughly $295/month vs Myncel\u2019s $79/month — and the gap widens with team size.',
  },
  {
    q: 'Can I migrate from MaintainX to Myncel?',
    a:
      'Yes. Export your assets, work orders, parts, and procedures from MaintainX as CSVs. Myncel\u2019s import wizard maps the fields automatically and most teams finish the migration in under an hour. PM schedules and meter readings carry over.',
  },
  {
    q: 'Does Myncel have the same mobile experience as MaintainX?',
    a:
      'Very close. MaintainX is widely considered the mobile-UX leader in CMMS. Myncel\u2019s Android and iOS apps include full offline mode, photo capture, barcode scanning, signatures, and chat-style comments on work orders, with the same one-thumb workflows technicians expect on the floor.',
  },
  {
    q: 'Does Myncel support IoT sensors like MaintainX Premium?',
    a:
      'Yes — and on every paid plan, not just Premium. Myncel supports Wi-Fi sensors, MQTT, Modbus, and BACnet so you can use vibration, temperature, pressure, and current readings to drive condition-based PMs and threshold alerts.',
  },
  {
    q: 'Is Myncel only for manufacturers?',
    a:
      'No. Myncel is industry-agnostic. It powers maintenance for hotels, hospitals, warehouses, and oil and gas operators in addition to small manufacturers, with industry-specific PM templates and audit trails ready for HACCP, JCI, FDA, and ISO 9001.',
  },
  {
    q: 'Can I start without a sales call?',
    a:
      'Yes. Pricing is published publicly. You can sign up for the 14-day free trial in two minutes with no credit card and no demo required. Sales calls are available if you want one, but they are never a prerequisite.',
  },
];

export default function MyncelVsMaintainX() {
  const jsonLd = buildComparisonJsonLd({
    competitor: 'MaintainX',
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
        competitor="MaintainX"
        competitorTagline="Mobile-first CMMS popular with frontline maintenance teams"
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
            plan: 'Essential',
            price: '$21',
            per: 'user/month',
            note: 'Premium (IoT, audit, reports): $59/user/month.',
          },
        }}
      />
      <Footer />
    </>
  );
}
