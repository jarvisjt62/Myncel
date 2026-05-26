import Link from 'next/link';
import { VEHICLE_WORK_ORDER_TEMPLATES } from '@/lib/templates/vehicle';

export const metadata = {
  title: 'Vehicle, Vessel & UAV Templates — Myncel Docs',
  description: 'Reference work-order templates for fleet vehicles (DVIR pre-trip, post-trip, heavy truck PM), commercial vessels (USCG-style pre-departure and return), and drones (FAA Part 107 pre-flight and post-flight).',
};

export default function VehicleTemplatesDocsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/docs" className="text-sm font-semibold text-[#635bff] hover:underline">← Docs</Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">Vehicle, vessel & UAV templates</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <span className="inline-block rounded-full bg-[#635bff]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#635bff]">Templates</span>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold text-[var(--text-primary)]">Vehicle, vessel, and UAV work-order templates</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">Eight reference checklists you can copy into a Myncel work order or PM schedule when you operate vehicles, vessels, or drones. Each template lists every item we recommend on the run, the regulatory reference behind it, and a realistic time estimate.</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]"><strong>How to use:</strong> Create a Work Order in Myncel for the vehicle or vessel, set its description to the template title, and paste the checklist items as the WO checklist. For repeating inspections, create a PM Schedule (BY_DAYS for daily DVIR, BY_HOURS for engine-hour-based, BY_TRIPS via the public REST API for per-charter checks).</p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {(['vehicle', 'vessel', 'uav'] as const).map(d => {
            const count = VEHICLE_WORK_ORDER_TEMPLATES.filter(t => t.domain === d).length;
            const label = d === 'vehicle' ? 'Vehicle templates' : d === 'vessel' ? 'Vessel templates' : 'UAV / drone templates';
            const emoji = d === 'vehicle' ? '🚛' : d === 'vessel' ? '⛵' : '🛸';
            return (
              <a key={d} href={`#${d}`} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#635bff]">
                <div className="text-2xl">{emoji}</div>
                <h2 className="mt-2 text-lg font-bold text-[var(--text-primary)]">{label}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{count} reference checklist{count === 1 ? '' : 's'}</p>
              </a>
            );
          })}
        </div>

        {(['vehicle', 'vessel', 'uav'] as const).map(domain => (
          <section key={domain} id={domain} className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              {domain === 'vehicle' ? 'Vehicle templates' : domain === 'vessel' ? 'Vessel templates' : 'UAV / drone templates'}
            </h2>
            {VEHICLE_WORK_ORDER_TEMPLATES.filter(t => t.domain === domain).map(t => (
              <article key={t.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{t.title}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#635bff]">{t.reference} · ~{t.estimatedMinutes} min</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{t.description}</p>
                <h4 className="mt-4 text-sm font-bold text-[var(--text-primary)]">Checklist ({t.checklist.length} items)</h4>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
                  {t.checklist.map((item, i) => (<li key={i}>{item}</li>))}
                </ul>
              </article>
            ))}
          </section>
        ))}

        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong>Disclaimer:</strong> these templates are starting points based on common public guidance (FMCSA, USCG, FAA Part 107). Your jurisdiction, route, vessel class, classification society, insurer, and operating manual may add items or override defaults. Always verify against the regulations applicable to your operation.
        </section>
      </main>
    </div>
  );
}
