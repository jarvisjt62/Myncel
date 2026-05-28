import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToDashboardBar from '../components/BackToDashboardBar';
import SupportSection from '../components/SupportSection';

export const metadata = {
  title: 'Developer Documentation — Myncel API, IoT & Integrations',
  description:
    'Developer reference for Myncel CMMS. REST API, IoT protocols (MQTT, Modbus, OPC-UA), edge gateway, telematics, and AI predictive maintenance integration guides.',
  alternates: { canonical: 'https://www.myncel.com/docs' },
  openGraph: {
    title: 'Myncel Developer Documentation — API, IoT & Integrations',
    description:
      'Build on Myncel: REST API reference, IoT protocol guides, edge gateway setup, and telematics integration.',
    url: 'https://www.myncel.com/docs',
  },
};

// Developer / integrator topics only. End-user how-to content lives in /handbook
// (see next.config.js redirects — /docs/getting-started, /docs/equipment, etc.
// permanently redirect to the corresponding /handbook chapter).
const DEV_SECTIONS = [
  {
    icon: '⚡',
    title: 'REST API',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    href: '/docs/api',
    description:
      'Interactive OpenAPI reference with try-it-out for every endpoint. Authentication, rate limits, and SDK snippets.',
    bullets: [
      'API overview & authentication (Bearer tokens, OAuth)',
      'Endpoint reference (machines, work orders, parts, alerts)',
      'Webhook setup & event catalog',
      'Idempotency keys, pagination, error codes',
    ],
  },
  {
    icon: '🌐',
    title: 'Edge Gateway',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    href: '/docs/edge-gateway',
    description:
      'Self-hosted gateway for sites without direct internet access. Buffers readings locally, syncs when online.',
    bullets: [
      'Gateway downloads (Linux x64/ARM, Windows, Docker)',
      'Raspberry Pi, ESP32, and Node-RED deployment',
      'Local buffering, store-and-forward, OTA updates',
    ],
  },
  {
    icon: '📡',
    title: 'IoT Protocols',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    href: '/docs/protocols',
    description:
      'Connect any sensor or PLC. Worked examples for the protocols you actually meet on the plant floor.',
    bullets: [
      'MQTT (Mosquitto, HiveMQ, AWS IoT Core)',
      'Modbus TCP / Modbus RTU over TCP',
      'OPC UA',
      'Ethernet/IP (Allen-Bradley, Rockwell)',
      'REST / Webhook',
    ],
  },
  {
    icon: '🚚',
    title: 'Telematics & Vehicles',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    href: '/docs/telematics',
    description:
      'Pull fleet data from existing telematics providers, or read directly from vehicle / vessel / UAV buses.',
    bullets: [
      'Geotab, Samsara, Verizon Connect, Motive, Fleetio importers',
      'OBD-II (cars, light trucks, vans)',
      'SAE J1939 (heavy trucks, off-highway)',
      'NMEA 2000 (vessels, boats, yachts)',
      'MAVLink (drones, UAVs)',
    ],
  },
  {
    icon: '🚛',
    title: 'Vehicle Templates',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    href: '/docs/vehicle-templates',
    description:
      'Pre-built DVIR, vessel, and UAV work-order templates that map to FMCSA, USCG, and FAA inspection requirements.',
    bullets: [
      'DVIR (Driver Vehicle Inspection Report)',
      'USCG vessel pre-departure checks',
      'FAA UAS preflight checklists',
    ],
  },
  {
    icon: '🤖',
    title: 'AI & Predictive',
    color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
    href: '/docs/ai',
    description:
      'How the anomaly engine works, the three model tiers, and how to tune sensitivity per machine.',
    bullets: [
      'How the anomaly engine works',
      'Three AI models — Statistical / Hybrid / LLM-Assisted',
      'Sensitivity, severity & quiet hours',
      'Per-machine overrides & feedback loop',
    ],
  },
  {
    icon: '🔌',
    title: 'IoT Quick-Start Guides',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    href: '/docs/iot-guides',
    description:
      'Step-by-step recipes for the most-asked sensor and PLC scenarios — code samples included.',
    bullets: [
      'Vibration sensor → MQTT → Myncel',
      'Temperature probe → Modbus → Myncel',
      'PLC tag → OPC UA → Myncel',
      'Smart meter → Webhook → Myncel',
    ],
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)]">
      <Navbar />
      <BackToDashboardBar />

      {/* Hero */}
      <section className="bg-[#0a2540] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold text-[#635bff] uppercase tracking-wider bg-[#1e3a5f] px-4 py-1.5 rounded-full mb-4">
              Developer Documentation
            </span>
            <h1 className="text-4xl font-bold text-white mb-4">Build on Myncel</h1>
            <p className="text-[#8898aa] mb-6">
              REST API reference, IoT protocol guides, edge gateway setup, and AI integration. Everything a developer or integrator needs to wire Myncel into your existing stack.
            </p>
          </div>
        </div>
      </section>

      {/* User Handbook CTA — directs end-users away from dev docs */}
      <section className="py-8 bg-[#f6f9fc] border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 bg-white border border-[#e6ebf1] rounded-2xl p-5 sm:p-6">
            <div className="text-3xl flex-shrink-0">📖</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#635bff] uppercase tracking-wider mb-1">Looking for the user manual?</div>
              <h2 className="text-xl font-bold text-[#0a2540] mb-1">Myncel Handbook — the complete user guide</h2>
              <p className="text-sm text-[#425466]">
                How to add machines, run work orders, set PM schedules, invite teammates, manage parts, configure alerts, and more — written for end-users, not developers.
              </p>
            </div>
            <Link
              href="/handbook"
              className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#635bff] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#4f46e5] transition-colors whitespace-nowrap"
            >
              Open Handbook →
            </Link>
          </div>
        </div>
      </section>

      {/* Developer docs grid */}
      <section className="py-16 bg-[var(--bg-page)]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Developer reference</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8">For developers, integrators, and IT teams wiring Myncel into existing systems.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEV_SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group bg-white border border-[var(--border)] rounded-2xl p-5 hover:shadow-md hover:border-[#635bff] transition-all flex flex-col"
              >
                <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border mb-4 self-start ${section.color}`}>
                  <span>{section.icon}</span>
                  {section.title}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{section.description}</p>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                      <span className="text-[#635bff] mt-0.5">•</span>
                      <span className="leading-tight">{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto text-xs font-semibold text-[#635bff] group-hover:underline">
                  Open {section.title} →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SupportSection />

      <Footer />
    </div>
  );
}
