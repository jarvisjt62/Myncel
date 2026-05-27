import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ComparisonPage, {
  buildComparisonJsonLd,
  type CompareFeature,
  type CompareFAQ,
} from '../../components/ComparisonPage';

const URL = 'https://www.myncel.com/compare/myncel-vs-upkeep';
const DESCRIPTION =
  'Compare Myncel vs UpKeep CMMS: pricing, mobile offline support, IoT sensors, setup time, and integrations. See why small manufacturers and facilities switch.';

export const metadata = {
  title: 'Myncel vs UpKeep: CMMS Comparison for Small Manufacturers',
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: 'Myncel vs UpKeep — Honest CMMS Comparison',
    description:
      'Side-by-side comparison of Myncel and UpKeep across pricing, offline mobile, IoT, integrations, and setup time.',
    url: URL,
    type: 'article',
  },
};

const HOOK =
  'UpKeep is built around technicians and field teams. Myncel is built around small operations: setup in 30 minutes, $79/month flat (not per user), offline mobile, and IoT sensor support included instead of being a separate product.';

const SWITCH_REASONS = [
  {
    title: 'Flat pricing, not per-user',
    body:
      'UpKeep charges $20–80 per user per month. Myncel is $79/month total for the Starter plan with unlimited technicians. A 5-person maintenance team saves $200–400/month.',
  },
  {
    title: 'Live in 30 minutes',
    body:
      'No 6-week onboarding, no implementation fees. Import your equipment from a CSV, schedule your first PM, and your techs are working off the mobile app the same day.',
  },
  {
    title: 'IoT sensors included',
    body:
      'UpKeep’s sensor integration is on a higher tier. Myncel includes vibration, temperature, current, and pressure sensor support over Wi-Fi, MQTT, Modbus, and BACnet on every paid plan.',
  },
];

const FEATURES: CompareFeature[] = [
  {
    feature: 'Starting price',
    myncel: '$79/month flat (unlimited users on Starter)',
    competitor: '$20/user/month (Lite); $45+/user/month for full features',
    myncelWins: true,
  },
  {
    feature: 'User pricing model',
    myncel: 'Flat per-organization on Starter & Professional',
    competitor: 'Per-user; price multiplies with team size',
    myncelWins: true,
  },
  {
    feature: 'Setup time',
    myncel: 'Under 30 minutes; CSV import for equipment, work orders, parts',
    competitor: 'Typically 2–6 weeks; paid implementation packages available',
    myncelWins: true,
  },
  {
    feature: 'Mobile offline mode',
    myncel: 'Yes — work orders, machines, parts cached locally; auto-sync on reconnect',
    competitor: 'Yes',
  },
  {
    feature: 'IoT sensor monitoring',
    myncel: 'Included on all paid plans; Wi-Fi, MQTT, Modbus, BACnet',
    competitor: 'Separate sensor product (UpKeep Edge); add-on hardware fees',
    myncelWins: true,
  },
  {
    feature: 'Preventive maintenance scheduling',
    myncel: 'Time-based, meter-based, and condition-based',
    competitor: 'Time-based and meter-based',
  },
  {
    feature: 'Work order management',
    myncel: 'Yes — with photo attachments, signatures, and labor logs',
    competitor: 'Yes',
  },
  {
    feature: 'Parts inventory',
    myncel: 'Yes — barcode scanning, low-stock alerts, multi-location',
    competitor: 'Yes',
  },
  {
    feature: 'Multi-site',
    myncel: 'Included on Professional and Enterprise',
    competitor: 'Available on higher tiers; per-site licensing common',
  },
  {
    feature: 'Reports & analytics',
    myncel: 'MTBF, MTTR, PM compliance, downtime, cost; PDF + CSV export',
    competitor: 'Standard CMMS reports; advanced analytics on higher tier',
  },
  {
    feature: 'Built-in integrations',
    myncel: 'Google Sheets, QuickBooks, Slack, public REST API + webhooks',
    competitor: 'QuickBooks, Slack, NetSuite, SAP, public API',
  },
  {
    feature: 'Audit / compliance logs',
    myncel: 'Full audit trail; HACCP, FDA, ISO 9001 ready',
    competitor: 'Audit trail on higher tiers',
    myncelWins: true,
  },
  {
    feature: 'Support response',
    myncel: 'Direct founder support during business hours; <2 h on Pro',
    competitor: 'Tiered: email, chat, phone depending on plan',
  },
];

const FAQS: CompareFAQ[] = [
  {
    q: 'Is Myncel cheaper than UpKeep?',
    a:
      'For most small teams, yes. Myncel’s Starter plan is $79/month flat for unlimited technicians, while UpKeep starts at $20 per user per month for the Lite tier and $45+ per user per month for the Starter and Professional tiers that include the features most small manufacturers need. A 5-technician team typically pays $200–400 more per month on UpKeep than on Myncel.',
  },
  {
    q: 'Can I migrate from UpKeep to Myncel?',
    a:
      'Yes. Export your equipment, work orders, and parts from UpKeep as CSVs. Myncel’s import wizard maps the columns automatically and most customers complete the migration in under an hour. Historical work order data is preserved.',
  },
  {
    q: 'Does Myncel work offline like UpKeep does?',
    a:
      'Yes. The Myncel mobile app for Android and iOS caches work orders, machines, and parts so technicians can continue working in poor-signal areas. Updates sync automatically once connectivity returns.',
  },
  {
    q: 'What about IoT sensors? UpKeep has UpKeep Edge.',
    a:
      'UpKeep Edge is a separate product with its own hardware and pricing. Myncel includes IoT sensor monitoring on every paid plan, supporting Wi-Fi sensors, MQTT, Modbus, and BACnet so you can use vibration, temperature, current, and pressure sensors without buying a second product.',
  },
  {
    q: 'Is Myncel suitable for hotels, hospitals, and warehouses, or only manufacturers?',
    a:
      'Myncel is industry-agnostic. It powers maintenance for hotels (HVAC, generators, kitchen equipment), hospitals (medical equipment compliance and audit logs), warehouses (refrigeration, conveyors, MHE), and oil and gas operators in addition to small manufacturers.',
  },
  {
    q: 'Can I try Myncel before paying?',
    a:
      'Yes. Myncel offers a 14-day free trial with no credit card required. You can import your equipment, schedule your first PM, and let your technicians use the mobile app during the trial. If you decide not to continue, you can export everything and walk away.',
  },
];

export default function MyncelVsUpKeep() {
  const jsonLd = buildComparisonJsonLd({
    competitor: 'UpKeep',
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
        competitor="UpKeep"
        competitorTagline="Mobile-first CMMS for technicians"
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
            plan: 'Starter',
            price: '$45',
            per: 'user/month',
            note: 'Billed per user. Lite tier $20/user limits PM features.',
          },
        }}
      />
      <Footer />
    </>
  );
}
