'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OpenInBrowserButton from './components/OpenInBrowserButton';
import { useIsCapacitorWebview, useCapacitorPlatform } from '../lib/use-capacitor-webview';

const platformMetrics = [
  { label: 'Trial access', value: '30 days', detail: 'Full product access before you choose a plan' },
  { label: 'Starter plan', value: '$49/mo', detail: 'For teams managing up to 25 machines' },
  { label: 'Setup time', value: '15 min', detail: 'Add assets, schedules, and team members fast' },
  { label: 'Work visibility', value: 'Real time', detail: 'Live work orders, alerts, and maintenance status' },
];

const productPillars = [
  {
    eyebrow: 'Equipment intelligence',
    title: 'Equipment maintenance software for every machine.',
    description:
      'Track model details, locations, photos, QR labels, warranties, parts, downtime notes, and complete service history in one equipment maintenance software platform your whole team can trust.',
    color: 'from-violet-500 to-indigo-500',
    points: ['Machine registry', 'Service history', 'QR code labels', 'Warranty and documentation tracking'],
  },
  {
    eyebrow: 'Preventive maintenance',
    title: 'Preventive maintenance software that keeps production moving.',
    description:
      'Build recurring preventive maintenance tasks by calendar dates, running hours, or production cycles. Myncel automatically shows what is due, upcoming, overdue, and already completed.',
    color: 'from-cyan-500 to-blue-500',
    points: ['Recurring PM schedules', 'Due and overdue queues', 'Technician assignments', 'Completion evidence'],
  },
  {
    eyebrow: 'Work execution',
    title: 'Work order management software built for the shop floor.',
    description:
      'Technicians can open digital work orders from any device, see exactly what needs to be done, upload photos, log labor, and close the loop without chasing paper forms.',
    color: 'from-emerald-500 to-teal-500',
    points: ['Mobile-friendly tasks', 'Photos and notes', 'Labor and parts logs', 'Manager review'],
  },
];

const featureGrid = [
  {
    title: 'Preventive maintenance software',
    description: 'Create recurring PM schedules and let Myncel automatically surface what needs attention before failures happen.',
    icon: 'preventive',
  },
  {
    title: 'Work order management software',
    description: 'Assign, track, and complete maintenance work from desktop or mobile with notes, photos, priorities, and due dates.',
    icon: 'workorders',
  },
  {
    title: 'Equipment maintenance software',
    description: 'Keep all assets, locations, serial numbers, warranty data, QR labels, documents, and service records searchable.',
    icon: 'registry',
  },
  {
    title: 'Alerts and notifications',
    description: 'Notify the right people by email, SMS, and integrated channels when work is due, overdue, or needs attention.',
    icon: 'alerts',
  },
  {
    title: 'Downtime and cost analytics',
    description: 'Understand recurring breakdowns, labor spend, parts usage, and bottlenecks with reports made for managers.',
    icon: 'analytics',
  },
  {
    title: 'Team permissions',
    description: 'Give owners, managers, and technicians the right level of access with role-based user controls by plan.',
    icon: 'permissions',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Import your operation',
    description:
      'Add machines, assign locations, upload photos, and organize the maintenance data currently trapped in binders, spreadsheets, and memory.',
  },
  {
    step: '02',
    title: 'Automate the maintenance rhythm',
    description:
      'Turn repeating tasks into schedules, assign owners, set priorities, and let Myncel calculate the next due dates for every critical asset.',
  },
  {
    step: '03',
    title: 'Run the day from one dashboard',
    description:
      'Managers see the live status of work orders, overdue tasks, downtime events, technician workload, and equipment health in one clean view.',
  },
];

const industryCards = [
  { title: 'CNC shops', icon: 'cnc', accent: 'from-[#635bff] to-[#00d4ff]' },
  { title: 'Metal fabrication', icon: 'metal', accent: 'from-[#ff7ab6] to-[#635bff]' },
  { title: 'Plastics manufacturing', icon: 'plastics', accent: 'from-[#00d4ff] to-[#00b894]' },
  { title: 'Auto parts suppliers', icon: 'auto', accent: 'from-[#0570de] to-[#635bff]' },
  { title: 'Food and beverage', icon: 'food', accent: 'from-[#00b894] to-[#ffd166]' },
  { title: 'Woodworking shops', icon: 'wood', accent: 'from-[#c084fc] to-[#44c2c2]' },
  { title: 'Packaging lines', icon: 'packaging', accent: 'from-[#635bff] to-[#ff7ab6]' },
  { title: 'Growing maintenance teams', icon: 'team', accent: 'from-[#00d4ff] to-[#635bff]' },
];

const motionRailBrands = [
  { name: 'HAAS', detail: 'CNC machines', accent: '#e11d48' },
  { name: 'FANUC', detail: 'Robotics', accent: '#facc15' },
  { name: 'Siemens', detail: 'Automation', accent: '#00a0a8' },
  { name: 'ABB', detail: 'Drives', accent: '#ef4444' },
  { name: 'Rockwell', detail: 'Controls', accent: '#f97316' },
  { name: 'Bosch Rexroth', detail: 'Hydraulics', accent: '#dc2626' },
  { name: 'Parker', detail: 'Motion', accent: '#2563eb' },
  { name: 'SKF', detail: 'Bearings', accent: '#0ea5e9' },
  { name: 'Festo', detail: 'Pneumatics', accent: '#1d4ed8' },
  { name: 'SICK', detail: 'Sensors', accent: '#f59e0b' },
  { name: 'Cognex', detail: 'Vision', accent: '#16a34a' },
  { name: 'Keyence', detail: 'Inspection', accent: '#dc2626' },
];

const pricingPlans = [
  {
    name: 'Starter',
    monthlyPrice: '$49',
    yearlyPrice: '$39',
    description: 'Perfect for small maintenance teams getting organized.',
    highlight: false,
    features: ['Up to 25 machines', 'Up to 10 users', '500 work orders/month', 'Advanced reporting', 'Email & SMS notifications', 'API access', 'QR code labels'],
  },
  {
    name: 'Growth',
    monthlyPrice: '$99',
    yearlyPrice: '$79',
    description: 'For growing teams that need deeper visibility and automation.',
    highlight: true,
    features: ['Up to 100 machines', 'Up to 25 users', '2,000 work orders/month', 'Full analytics suite', 'IoT sensor integration', 'API access + webhooks', 'Priority email support'],
  },
  {
    name: 'Professional',
    monthlyPrice: '$249',
    yearlyPrice: '$199',
    description: 'Advanced maintenance operations with large teams and assets.',
    highlight: false,
    features: ['Up to 500 machines', 'Up to 100 users', '10,000 work orders/month', 'Custom reports', 'IoT + SCADA integration', 'Priority phone support', 'SSO / SAML'],
  },
];

const faqs = [
  {
    q: 'How long is the free trial?',
    a: 'Myncel includes a 30-day free trial with full product access. You can add machines, invite your team, create schedules, and test work orders before choosing a paid plan.',
  },
  {
    q: 'Do I need special hardware or sensors?',
    a: 'No. Myncel works immediately with the maintenance data your team already has. Sensor and IoT integrations are optional on supported plans if you want automated readings later.',
  },
  {
    q: 'Which plan matches my team size?',
    a: 'Starter supports up to 25 machines and 10 users. Growth supports up to 100 machines and 25 users. Professional supports up to 500 machines and 100 users. Enterprise is available for custom scale.',
  },
  {
    q: 'Can technicians use it from phones?',
    a: 'Yes. Myncel is mobile-friendly, so technicians can view work orders, complete tasks, add notes, and upload photos from the shop floor without installing a separate app.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Paid plans are subscription-based and can be managed from the dashboard. This homepage now uses the same trial length, plan names, limits, and public prices shown in the application billing experience.',
  },
];

function FeatureIllustration({ type }: { type: string }) {
  const stroke = 'rgba(255,255,255,0.92)';
  const glow = 'rgba(0,212,255,0.75)';

  if (type === 'preventive') {
    return (
      <div className="myncel-icon-stage">
        <svg viewBox="0 0 96 96" className="h-full w-full">
          <rect x="18" y="20" width="60" height="56" rx="14" fill="rgba(255,255,255,0.12)" stroke={stroke} strokeWidth="2" />
          <path d="M18 38h60" stroke={stroke} strokeWidth="2" />
          <path className="myncel-icon-orbit" d="M34 58l9 9 20-24" fill="none" stroke={glow} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="myncel-icon-pulse" cx="70" cy="24" r="8" fill="#00d4ff" />
        </svg>
      </div>
    );
  }

  if (type === 'workorders') {
    return (
      <div className="myncel-icon-stage">
        <svg viewBox="0 0 96 96" className="h-full w-full">
          <rect x="24" y="16" width="48" height="64" rx="12" fill="rgba(255,255,255,0.12)" stroke={stroke} strokeWidth="2" />
          <rect x="36" y="10" width="24" height="14" rx="6" fill="#00d4ff" />
          <path className="myncel-icon-dash" d="M36 42h24M36 54h18M36 66h26" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path className="myncel-icon-check" d="M28 52l6 6 12-16" fill="none" stroke="#7ee787" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (type === 'registry') {
    return (
      <div className="myncel-icon-stage">
        <svg viewBox="0 0 96 96" className="h-full w-full">
          <rect x="16" y="28" width="64" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke={stroke} strokeWidth="2" />
          <path d="M28 28v-8h40v8M28 66v10h40V66" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle className="myncel-icon-spin-origin" cx="48" cy="47" r="13" fill="none" stroke="#00d4ff" strokeWidth="5" strokeDasharray="10 6" />
          <circle cx="48" cy="47" r="4" fill="#fff" />
        </svg>
      </div>
    );
  }

  if (type === 'alerts') {
    return (
      <div className="myncel-icon-stage">
        <svg viewBox="0 0 96 96" className="h-full w-full">
          <path d="M31 62h34l-5-8V42a12 12 0 10-24 0v12l-5 8z" fill="rgba(255,255,255,0.12)" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M42 68a7 7 0 0012 0" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle className="myncel-icon-ping" cx="70" cy="27" r="7" fill="#ffd166" />
          <path className="myncel-icon-wave" d="M72 42c8 5 8 17 0 22" fill="none" stroke="#00d4ff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === 'analytics') {
    return (
      <div className="myncel-icon-stage">
        <svg viewBox="0 0 96 96" className="h-full w-full">
          <path d="M20 74h58" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          {[28, 42, 56, 70].map((x, index) => (
            <rect
              key={x}
              className="myncel-icon-bar"
              x={x}
              y={34 - index * 4}
              width="9"
              height={40 + index * 4}
              rx="4"
              fill={index % 2 ? '#00d4ff' : '#7c72ff'}
              style={{ animationDelay: `${index * 0.25}s` }}
            />
          ))}
          <path className="myncel-icon-line" d="M24 54c10-14 18-4 28-16s16-4 25-18" fill="none" stroke="#7ee787" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="myncel-icon-stage">
      <svg viewBox="0 0 96 96" className="h-full w-full">
        <circle cx="34" cy="35" r="11" fill="rgba(255,255,255,0.14)" stroke={stroke} strokeWidth="2" />
        <circle cx="62" cy="35" r="11" fill="rgba(255,255,255,0.14)" stroke={stroke} strokeWidth="2" />
        <path d="M20 72c3-15 25-15 28 0M48 72c3-15 25-15 28 0" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        <path className="myncel-icon-lock" d="M42 54h22v18H42zM47 54v-6a6 6 0 0112 0v6" fill="rgba(0,212,255,0.22)" stroke="#00d4ff" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function IndustryIllustration({ type, accent }: { type: string; accent: string }) {
  if (type === 'cnc') {
    return (
      <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
        <svg viewBox="0 0 80 80">
          <rect x="16" y="24" width="48" height="32" rx="8" fill="rgba(255,255,255,0.22)" />
          <path className="myncel-icon-dash" d="M25 34h30M25 45h18" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path className="myncel-icon-cutter" d="M54 16v18l-7 8" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (type === 'metal') {
    return (
      <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
        <svg viewBox="0 0 80 80">
          <path d="M18 55h44L52 25H28L18 55z" fill="rgba(255,255,255,0.22)" />
          <path className="myncel-icon-spark" d="M57 20l6-7M61 30l9-2M48 17l-2-9" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M28 55l24-30" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === 'plastics') {
    return (
      <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
        <svg viewBox="0 0 80 80">
          <rect x="18" y="18" width="44" height="44" rx="14" fill="rgba(255,255,255,0.2)" />
          <circle className="myncel-icon-bubble" cx="33" cy="38" r="8" fill="white" opacity="0.85" />
          <circle className="myncel-icon-bubble" cx="50" cy="45" r="6" fill="white" opacity="0.65" style={{ animationDelay: '0.45s' }} />
          <path d="M25 26h30" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === 'auto') {
    return (
      <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
        <svg viewBox="0 0 80 80">
          <path d="M20 47l7-15h26l7 15v12H20V47z" fill="rgba(255,255,255,0.22)" stroke="white" strokeWidth="3" strokeLinejoin="round" />
          <circle className="myncel-icon-spin-origin" cx="30" cy="59" r="6" fill="none" stroke="white" strokeWidth="3" strokeDasharray="5 4" />
          <circle className="myncel-icon-spin-origin" cx="54" cy="59" r="6" fill="none" stroke="white" strokeWidth="3" strokeDasharray="5 4" />
        </svg>
      </div>
    );
  }

  if (type === 'food') {
    return (
      <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
        <svg viewBox="0 0 80 80">
          <path d="M24 22h32v38a8 8 0 01-8 8H32a8 8 0 01-8-8V22z" fill="rgba(255,255,255,0.22)" stroke="white" strokeWidth="3" />
          <path className="myncel-icon-wave" d="M29 38c6-5 12 5 18 0s8-2 11 0" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 18h20" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === 'wood') {
    return (
      <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
        <svg viewBox="0 0 80 80">
          <rect x="18" y="24" width="44" height="34" rx="8" fill="rgba(255,255,255,0.22)" />
          <path className="myncel-icon-line" d="M24 36c8-8 16 8 24 0s10-4 14 0M24 48c7-6 14 6 22 0s10-3 16 0" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === 'packaging') {
    return (
      <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
        <svg viewBox="0 0 80 80">
          <path d="M22 31l18-10 18 10v24L40 65 22 55V31z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="3" strokeLinejoin="round" />
          <path className="myncel-icon-dash" d="M22 31l18 10 18-10M40 41v24" stroke="white" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`myncel-industry-icon bg-gradient-to-br ${accent}`}>
      <svg viewBox="0 0 80 80">
        <circle cx="29" cy="32" r="9" fill="rgba(255,255,255,0.24)" stroke="white" strokeWidth="3" />
        <circle cx="51" cy="32" r="9" fill="rgba(255,255,255,0.24)" stroke="white" strokeWidth="3" />
        <path className="myncel-icon-pulse-line" d="M18 59c4-15 22-15 26 0M38 59c4-15 22-15 26 0" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function HomePageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [annualBilling, setAnnualBilling] = useState(false);
  // Compliance: when rendered inside the Capacitor mobile app shell
  // (com.myncel.app), hide every USD price and the entire pricing
  // section to comply with Google Play's "Subscriptions: currency
  // differences with prominent display price" policy.
  // See: docs/google-play-pricing-compliance.md
  const isMobileApp = useIsCapacitorWebview();
  // Distinguish iOS vs Android so we can show the right "Mobile ready"
  // copy. Apple App Review (Guideline 2.3.10) requires that the iOS
  // binary not mention Android; the inverse is courteous for Google
  // Play but not strictly required.
  const platform = useCapacitorPlatform();
  const mobileReadyValue =
    platform === 'ios'
      ? 'iOS native'
      : platform === 'android'
        ? 'Android native'
        : 'iOS + Android';
  const mobileReadyDetail =
    platform === 'ios'
      ? 'Native iOS app and a mobile-friendly web experience'
      : platform === 'android'
        ? 'Native Android app and a mobile-friendly web experience'
        : 'Native apps and a mobile-friendly web experience';
  // Swap the "Starter plan: $49/mo" hero metric for a price-free
  // alternative when in the mobile app.
  const heroMetrics = isMobileApp
    ? [
        { label: 'Trial access', value: '30 days', detail: 'Full product access before you choose a plan' },
        { label: 'Setup time', value: '15 min', detail: 'Add assets, schedules, and team members fast' },
        { label: 'Work visibility', value: 'Real time', detail: 'Live work orders, alerts, and maintenance status' },
        { label: 'Mobile ready', value: mobileReadyValue, detail: mobileReadyDetail },
      ]
    : platformMetrics;

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#0a2540]">
      <Navbar />

      <section className="relative overflow-hidden pt-16 sm:pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="gradient-blob animate-blob w-[560px] h-[560px] bg-gradient-to-br from-[#7a73ff] via-[#80e9ff] to-[#ffd166] -top-40 -right-32 opacity-60" />
          <div className="gradient-blob animate-blob-delay w-[420px] h-[420px] bg-gradient-to-br from-[#ff7ab6] to-[#635bff] top-24 right-52 opacity-40" />
          <div className="absolute -top-24 left-0 h-[720px] w-full bg-[linear-gradient(115deg,rgba(246,249,252,0)_0%,rgba(246,249,252,0)_46%,rgba(99,91,255,0.08)_46%,rgba(99,91,255,0.08)_62%,rgba(0,212,255,0.08)_62%,rgba(0,212,255,0.08)_100%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dde3ff] bg-white/80 px-4 py-2 text-sm font-semibold text-[#635bff] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#00d4ff]" />
              CMMS software for small and midsize manufacturers
            </div>

            <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-[#0a2540] sm:text-6xl lg:text-7xl">
              CMMS software that keeps your factory{' '}
              <span className="gradient-text">moving.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#425466] sm:text-xl">
              Myncel brings equipment maintenance software, preventive maintenance software, work order management software, alerts, and predictive maintenance insights into one elegant CMMS platform for teams that cannot afford surprise downtime.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-stripe-primary justify-center px-6 py-3 text-base">
                Start free for 30 days →
              </Link>
              <Link href="/demo" className="btn-stripe-secondary justify-center px-6 py-3 text-base">
                Book a demo
              </Link>
            </div>

            <p className="mt-5 text-sm text-[#8898aa]">
              {isMobileApp
                ? 'No credit card required · Setup in minutes · 30-day free trial'
                : 'No credit card required · Setup in minutes · Plans start at $49/month'}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {heroMetrics.map((metric, index) => (
                <div key={metric.label} className="myncel-float rounded-2xl border border-[#e6ebf1] bg-white/80 p-4 shadow-sm backdrop-blur" style={{ animationDelay: `${index * 0.35}s` }}>
                  <div className="text-2xl font-bold text-[#0a2540]">{metric.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#635bff]">{metric.label}</div>
                  <div className="mt-2 text-xs leading-5 text-[#697386]">{metric.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-16 hidden w-44 rotate-[-8deg] lg:block">
              <div className="myncel-float rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-[#e6ebf1]">
                <div className="text-xs font-semibold text-[#8898aa]">Overdue risk</div>
                <div className="mt-2 text-3xl font-bold text-[#ff6b6b]">-42%</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ffe3e3]">
                  <div className="myncel-progress h-2 w-2/3 rounded-full bg-[#ff6b6b]" />
                </div>
              </div>
            </div>

            <div className="mockup-window relative mx-auto max-w-2xl shadow-2xl">
              <div className="myncel-scan pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl" />
              <div className="mockup-titlebar">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto rounded-md border border-[#e6ebf1] bg-white px-4 py-1 font-mono text-xs text-[#8898aa]">
                  app.myncel.com/dashboard
                </div>
              </div>

              <div className="bg-[#f6f9fc] p-4 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                  <aside className="hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e6ebf1] lg:block">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#635bff] text-sm font-bold text-white">M</div>
                      <div className="font-semibold">Myncel</div>
                    </div>
                    {['Dashboard', 'Equipment', 'Schedules', 'Work Orders', 'Analytics'].map((item, index) => (
                      <div key={item} className={`mb-1 rounded-lg px-3 py-2 text-sm ${index === 0 ? 'bg-[#f0f4ff] font-semibold text-[#635bff]' : 'text-[#697386]'}`}>
                        {item}
                      </div>
                    ))}
                  </aside>

                  <main className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Due today', '18', '7 assigned'],
                        ['Healthy assets', '96%', '100 machines'],
                        ['Open work', '43', '12 high priority'],
                      ].map(([label, value, detail], index) => (
                        <div key={label} className="myncel-slide-card rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e6ebf1]" style={{ animationDelay: `${index * 1.3}s` }}>
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8898aa]">{label}</div>
                          <div className="mt-2 text-3xl font-bold text-[#0a2540]">{value}</div>
                          <div className="mt-1 text-xs text-[#697386]">{detail}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e6ebf1]">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-[#0a2540]">Production line status</div>
                          <div className="text-xs text-[#8898aa]">Live preventive maintenance timeline</div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">On track</span>
                      </div>
                      <div className="space-y-4">
                        {[
                          ['CNC Mill #4', 'Spindle inspection', 'Due in 2h', 'w-4/5', 'bg-[#635bff]'],
                          ['Packaging Line B', 'Belt tension check', 'Due tomorrow', 'w-3/5', 'bg-[#00d4ff]'],
                          ['Hydraulic Press #2', 'Oil sample review', 'Completed', 'w-full', 'bg-emerald-500'],
                        ].map(([machine, task, due, width, color]) => (
                          <div key={machine}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium text-[#0a2540]">{machine}</span>
                              <span className="text-[#697386]">{due}</span>
                            </div>
                            <div className="mb-1 text-xs text-[#8898aa]">{task}</div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#edf2f7]">
                              <div className={`myncel-progress h-2 rounded-full ${width} ${color}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#0a2540] p-5 text-white shadow-sm">
                        <div className="text-sm font-semibold text-white/70">Downtime avoided</div>
                        <div className="mt-2 text-3xl font-bold">$18.4k</div>
                        <div className="mt-3 flex h-16 items-end gap-1.5">
                          {[35, 52, 44, 70, 58, 84, 76, 92].map((height, index) => (
                            <span
                              key={index}
                              className="myncel-progress flex-1 rounded-t bg-gradient-to-t from-[#635bff] to-[#00d4ff]"
                              style={{ height: `${height}%`, animationDelay: `${index * 0.18}s` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e6ebf1]">
                        <div className="text-sm font-semibold text-[#0a2540]">Next alert</div>
                        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                          Compressor #1 vibration reading needs review before second shift.
                        </div>
                        <div className="mt-4 text-xs font-semibold text-[#635bff]">Send to: Maintenance manager</div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-12 hidden w-52 rotate-[7deg] lg:block">
              <div className="myncel-float rounded-2xl bg-[#0a2540] p-4 text-white shadow-2xl" style={{ animationDelay: '1.2s' }}>
                <div className="text-xs font-semibold text-white/60">Work order closed</div>
                <div className="mt-2 text-sm font-semibold">Hydraulic Press #2</div>
                <div className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs">Photo + labor log attached</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[#e6ebf1] bg-white py-7">
        {/* Edge fade overlays — white so they blend against the white background */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-white to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[#aab7c4]">
            Built for practical maintenance teams running real production floors
          </p>
        </div>

        <div className="mt-6 overflow-hidden">
          <div className="myncel-marquee">
            {[...motionRailBrands, ...motionRailBrands].map((brand, index) => (
              <div
                key={`${brand.name}-${index}`}
                className="myncel-brand-wordmark"
                style={{ '--brand-accent': brand.accent } as React.CSSProperties}
                aria-label={`${brand.name} — ${brand.detail}`}
              >
                {brand.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="relative bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="section-label">Unified maintenance platform</div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0a2540] sm:text-5xl">
              Everything your CMMS software needs, designed like modern infrastructure.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#425466]">
              Stripe made payments feel programmable and clear. Myncel brings that same product clarity to maintenance operations: structured data, fast workflows, preventive maintenance schedules, work order management, and one clean interface for every asset and task.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {productPillars.map((pillar) => (
              <div key={pillar.title} className="group rounded-[2rem] border border-[#e6ebf1] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className={`mb-6 h-2 w-24 rounded-full bg-gradient-to-r ${pillar.color}`} />
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#635bff]">{pillar.eyebrow}</div>
                <h3 className="mt-4 text-2xl font-bold text-[#0a2540]">{pillar.title}</h3>
                <p className="mt-4 leading-7 text-[#425466]">{pillar.description}</p>
                <div className="mt-6 space-y-3">
                  {pillar.points.map((point) => (
                    <div key={point} className="flex items-center gap-3 text-sm font-medium text-[#0a2540]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative overflow-hidden bg-[#0a2540] py-20 text-white sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,91,255,0.45),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(0,212,255,0.28),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="section-label !text-[#00d4ff]">Built for uptime</div>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                From reactive firefighting to preventive maintenance software that runs the day.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Myncel gives owners, managers, and technicians a shared source of truth so machines get serviced on time and decisions are backed by predictive maintenance data instead of guesswork.
              </p>
              <Link href="/pricing" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-[#0a2540] shadow-lg transition hover:-translate-y-0.5">
                View plans
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featureGrid.map((feature) => (
                <div key={feature.title} className="group rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.1]">
                  <FeatureIllustration type={feature.icon} />
                  <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f6f9fc] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="section-label">How it works</div>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0a2540] sm:text-5xl">
                Launch a better maintenance process in three moves.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#425466]">
                Myncel is intentionally lightweight to start and powerful as your operation grows. Begin with the basics, then add analytics, integrations, sensors, and advanced controls when you need them.
              </p>
            </div>

            <div className="space-y-5">
              {workflow.map((item) => (
                <div key={item.step} className="relative rounded-[2rem] border border-[#e6ebf1] bg-white p-7 shadow-sm">
                  <div className="absolute -left-3 top-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#635bff] font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <div className="pl-8">
                    <h3 className="text-2xl font-bold text-[#0a2540]">{item.title}</h3>
                    <p className="mt-3 leading-7 text-[#425466]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[#e6ebf1]">
            <div className="grid lg:grid-cols-3">
              <div className="bg-gradient-to-br from-[#635bff] to-[#00d4ff] p-8 text-white lg:col-span-1">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Manager command center</div>
                <h3 className="mt-4 text-3xl font-bold">Know what needs work before the line stops with predictive maintenance insights.</h3>
                <p className="mt-4 leading-7 text-white/75">
                  See open work, aging tasks, asset risk, and downtime trends in the same place your team executes the work.
                </p>
              </div>
              <div className="grid gap-4 bg-[#0a2540] p-6 text-white sm:grid-cols-3 lg:col-span-2">
                {[
                  ['Open PMs', '127', '+18 this week'],
                  ['Avg. close time', '4.6h', '32% faster'],
                  ['Asset uptime', '98.1%', '+6.4% QoQ'],
                ].map(([label, value, trend]) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-5">
                    <div className="text-sm text-white/60">{label}</div>
                    <div className="mt-4 text-4xl font-bold">{value}</div>
                    <div className="mt-2 text-sm text-[#7ee787]">{trend}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="industries" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="section-label">Made for manufacturers</div>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0a2540] sm:text-5xl">
                Practical CMMS workflows for teams that make, package, cut, form, and assemble.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#425466]">
                Myncel is not bloated enterprise maintenance software. It is built for busy operations that need CMMS software with cleaner execution, fewer missed PMs, and a faster path from problem to completed work.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {industryCards.map((industry) => (
                <div key={industry.title} className="group rounded-3xl border border-[#e6ebf1] bg-[#f6f9fc] p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                  <IndustryIllustration type={industry.icon} accent={industry.accent} />
                  <h3 className="mt-5 text-xl font-bold text-[#0a2540]">{industry.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#425466]">
                    Organize assets, recurring maintenance, work execution, and reporting without hiring consultants.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isMobileApp ? (
        // Compliance: replace the full pricing section with a price-free
        // panel when viewed inside the Capacitor mobile app.
        <section id="pricing" className="relative overflow-hidden bg-[#f6f9fc] py-20 sm:py-28">
          <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#635bff]/10 blur-3xl" />
          <div className="absolute -left-40 bottom-20 h-96 w-96 rounded-full bg-[#00d4ff]/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="section-label">Plans &amp; pricing</div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0a2540] sm:text-5xl">
              Subscriptions are managed on the web.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#425466]">
              For your security and to keep billing simple across regions,
              Myncel plans and subscriptions are managed at{' '}
              <span className="font-semibold text-[#0a2540]">myncel.com</span>.
              Open the website in your browser to view plans, start a free
              trial, or change your subscription. Your existing subscription
              continues to work in this app.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <OpenInBrowserButton
                url="https://www.myncel.com/pricing?from=app"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#635bff] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#5246e5]"
              >
                Open myncel.com in browser
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </OpenInBrowserButton>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-[#0a2540] px-6 py-3 text-base font-semibold text-[#0a2540] transition hover:bg-[#0a2540] hover:text-white"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </section>
      ) : (
      <section id="pricing" className="relative overflow-hidden bg-[#f6f9fc] py-20 sm:py-28">
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#635bff]/10 blur-3xl" />
        <div className="absolute -left-40 bottom-20 h-96 w-96 rounded-full bg-[#00d4ff]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="section-label">Clear pricing</div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0a2540] sm:text-5xl">
              Start free for 30 days, then choose the plan that matches your operation.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#425466]">
              Simple pricing for maintenance teams, with annual billing options for teams ready to save.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#e6ebf1] bg-white px-4 py-2 shadow-sm">
              <span className={`text-sm font-semibold ${!annualBilling ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}>Monthly</span>
              <button
                type="button"
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`relative h-6 w-11 rounded-full transition-colors ${annualBilling ? 'bg-[#635bff]' : 'bg-[#d9e2ec]'}`}
                aria-pressed={annualBilling}
                aria-label="Toggle annual billing"
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${annualBilling ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className={`text-sm font-semibold ${annualBilling ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}>
                Yearly
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">Save 17%</span>
              </span>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => {
              const displayPrice = annualBilling ? plan.yearlyPrice : plan.monthlyPrice;

              return (
              <div key={plan.name} className={`relative rounded-[2rem] p-7 shadow-sm ${plan.highlight ? 'pricing-featured text-white' : 'border border-[#e6ebf1] bg-white text-[#0a2540]'}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-sm font-bold text-[#635bff] shadow-md">
                    Most popular
                  </div>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className={`mt-3 leading-7 ${plan.highlight ? 'text-white/75' : 'text-[#425466]'}`}>{plan.description}</p>
                <div className="mt-7 flex items-end gap-1">
                  <span className="text-5xl font-bold">{displayPrice}</span>
                  <span className={`pb-2 text-lg ${plan.highlight ? 'text-white/70' : 'text-[#697386]'}`}>/mo</span>
                </div>
                <p className={`mt-2 text-sm ${plan.highlight ? 'text-white/65' : 'text-[#697386]'}`}>
                  {annualBilling ? 'Billed yearly' : 'Billed monthly'}
                </p>
                <Link href="/signup" className={`mt-7 flex justify-center rounded-full px-5 py-3 font-semibold transition ${plan.highlight ? 'bg-white text-[#635bff] hover:-translate-y-0.5' : 'bg-[#0a2540] text-white hover:-translate-y-0.5 hover:bg-[#17324d]'}`}>
                  Start free trial
                </Link>
                <div className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex gap-3 text-sm">
                      <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${plan.highlight ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>✓</span>
                      <span className={plan.highlight ? 'text-white/90' : 'text-[#425466]'}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-[2rem] border border-[#e6ebf1] bg-white p-7 shadow-sm lg:flex lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-[#0a2540]">Enterprise</h3>
              <p className="mt-2 max-w-3xl text-[#425466]">
                Custom pricing for unlimited machines, unlimited users, unlimited work orders, SLA guarantees, dedicated account management, onboarding, and custom integrations.
              </p>
            </div>
            <Link href="/contact" className="mt-6 inline-flex rounded-full border border-[#0a2540] px-6 py-3 font-semibold text-[#0a2540] transition hover:-translate-y-0.5 hover:bg-[#0a2540] hover:text-white lg:mt-0">
              Contact sales
            </Link>
          </div>
        </div>
      </section>
      )}

      <section id="faq" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="section-label">Questions</div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0a2540] sm:text-5xl">
              Straight answers before you start.
            </h2>
          </div>

          <div className="mt-12 divide-y divide-[#e6ebf1] rounded-[2rem] border border-[#e6ebf1] bg-white shadow-sm">
            {faqs.map((faq, index) => (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-6 p-6 text-left"
                >
                  <span className="text-lg font-bold text-[#0a2540]">{faq.q}</span>
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f6f9fc] text-[#635bff] transition ${openFaq === index ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 leading-7 text-[#425466]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Switching from another CMMS — internal links to /compare hub for SEO discoverability */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0a2540] sm:text-4xl">
              Switching from another CMMS?
            </h2>
            <p className="mt-4 text-lg text-[#425466]">
              See how Myncel stacks up against the most-searched alternatives. Same features, simpler pricing, no per-technician add-ons.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/compare/myncel-vs-upkeep"
              className="group flex items-center justify-between rounded-xl border border-[#e6ebf1] bg-white px-6 py-5 transition hover:border-[#635bff] hover:shadow-md"
            >
              <div>
                <div className="text-base font-semibold text-[#0a2540]">Myncel vs UpKeep</div>
                <div className="mt-1 text-sm text-[#425466]">Feature-by-feature comparison</div>
              </div>
              <span className="text-xl text-[#635bff] transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/compare/myncel-vs-limble"
              className="group flex items-center justify-between rounded-xl border border-[#e6ebf1] bg-white px-6 py-5 transition hover:border-[#635bff] hover:shadow-md"
            >
              <div>
                <div className="text-base font-semibold text-[#0a2540]">Myncel vs Limble</div>
                <div className="mt-1 text-sm text-[#425466]">Feature-by-feature comparison</div>
              </div>
              <span className="text-xl text-[#635bff] transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/compare/myncel-vs-fiix"
              className="group flex items-center justify-between rounded-xl border border-[#e6ebf1] bg-white px-6 py-5 transition hover:border-[#635bff] hover:shadow-md"
            >
              <div>
                <div className="text-base font-semibold text-[#0a2540]">Myncel vs Fiix</div>
                <div className="mt-1 text-sm text-[#425466]">Feature-by-feature comparison</div>
              </div>
              <span className="text-xl text-[#635bff] transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/compare/myncel-vs-maintainx"
              className="group flex items-center justify-between rounded-xl border border-[#e6ebf1] bg-white px-6 py-5 transition hover:border-[#635bff] hover:shadow-md"
            >
              <div>
                <div className="text-base font-semibold text-[#0a2540]">Myncel vs MaintainX</div>
                <div className="mt-1 text-sm text-[#425466]">Feature-by-feature comparison</div>
              </div>
              <span className="text-xl text-[#635bff] transition group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#635bff] hover:text-[#4f46e5]"
            >
              See all comparisons →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#635bff] py-16 text-white sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(0,212,255,0.35),transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Replace maintenance chaos with a system your team will actually use.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Start your 30-day free trial, add your first machines, and see how quickly Myncel can turn scattered maintenance work into a clean operating rhythm.
          </p>

          <div className="mx-auto mt-9 flex max-w-xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row sm:rounded-full">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your work email"
              className="min-w-0 flex-1 rounded-xl px-5 py-3 text-center text-[#0a2540] outline-none sm:rounded-full sm:text-left"
            />
            <Link
              href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="flex justify-center rounded-xl bg-[#0a2540] px-6 py-3 font-semibold text-white transition hover:bg-[#17324d] sm:rounded-full"
            >
              Start free →
            </Link>
          </div>

          <p className="mt-5 text-sm text-white/70">
            Free for 30 days · No credit card required · Upgrade only when you are ready
          </p>
        </div>
      </section>


      {/* JSON-LD: FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "How long does setup take?", "acceptedAnswer": { "@type": "Answer", "text": "Most teams are fully set up in under 15 minutes. You add your machines, assign schedules, and Myncel handles the rest — no IT department or consultant needed." } },
              { "@type": "Question", "name": "Do I need special hardware or sensors?", "acceptedAnswer": { "@type": "Answer", "text": "No hardware required. Myncel works with the information your team already tracks. Optionally connect IoT sensors later for automated readings, but it\'s 100% optional." } },
              { "@type": "Question", "name": "Is my data secure?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. All data is encrypted at rest and in transit. We\'re hosted on enterprise-grade infrastructure with SOC 2 compliance in progress." } },
              { "@type": "Question", "name": "Can multiple technicians use it at the same time?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. Every plan supports unlimited technician accounts. Managers see everything; technicians see their assigned work orders." } },
              { "@type": "Question", "name": "What happens if I have more than 50 machines?", "acceptedAnswer": { "@type": "Answer", "text": "The Professional plan supports unlimited machines. Contact us for an Enterprise quote with custom pricing and dedicated support." } },
              { "@type": "Question", "name": "Can I cancel anytime?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, no contracts, no cancellation fees. Cancel from your dashboard any time. We offer a 30-day money-back guarantee on all paid plans." } }
            ]
          })
        }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.myncel.com" },
              { "@type": "ListItem", "position": 2, "name": "Solutions", "item": "https://www.myncel.com/solutions" },
              { "@type": "ListItem", "position": 3, "name": "Blog", "item": "https://www.myncel.com/blog" },
              { "@type": "ListItem", "position": 4, "name": "Pricing", "item": "https://www.myncel.com/pricing" }
            ]
          })
        }}
      />
      <Footer />
    </div>
  );
}