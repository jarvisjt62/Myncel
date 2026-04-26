'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');

  const faqs = [
    {
      q: 'How long does setup take?',
      a: 'Most teams are fully set up in under 15 minutes. You add your machines, assign schedules, and Myncel handles the rest — no IT department or consultant needed.',
    },
    {
      q: 'Do I need special hardware or sensors?',
      a: 'No hardware required. Myncel works with the information your team already tracks. Optionally connect IoT sensors later for automated readings, but it\'s 100% optional.',
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. All data is encrypted at rest and in transit. We\'re hosted on enterprise-grade infrastructure with SOC 2 compliance in progress. Your maintenance data never leaves your private account.',
    },
    {
      q: 'Can multiple technicians use it at the same time?',
      a: 'Absolutely. Every plan supports unlimited technician accounts. Managers see everything; technicians see their assigned work orders. Roles and permissions are fully customizable.',
    },
    {
      q: 'What happens if I have more than 50 machines?',
      a: 'The Professional plan supports unlimited machines. If you have a very large operation, contact us for an Enterprise quote with custom pricing and dedicated support.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, no contracts, no cancellation fees. Cancel from your dashboard any time. We offer a 30-day money-back guarantee on all paid plans.',
    },
  ];

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
      ),
      title: 'Equipment Registry',
      desc: 'Add every machine in your facility. Track model, location, age, warranty, and full service history in one searchable place.',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Smart Scheduling',
      desc: 'Set recurring maintenance tasks by days, hours, or cycles. Myncel auto-calculates what\'s due, upcoming, and overdue.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      title: 'Instant Alerts',
      desc: 'Get notified by email or SMS the moment a task is due or a machine shows warning signs. Your team always stays ahead.',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: 'Digital Work Orders',
      desc: 'Create and assign work orders from any device. Technicians complete tasks and upload photos from the shop floor.',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Cost Analytics',
      desc: 'Track labor costs, parts spend, and downtime incidents. Monthly reports show exactly where money is being lost.',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2v-1a7 7 0 10-14 0v1a2 2 0 002 2zM12 9a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
      title: 'Mobile-First',
      desc: 'Technicians access their work orders, log completions, and attach photos from any smartphone — no app install needed.',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Add Your Machines',
      desc: 'Enter each piece of equipment — CNC machines, conveyor belts, hydraulic presses, HVAC, anything that needs maintenance. Takes about 2 minutes per machine.',
    },
    {
      num: '02',
      title: 'Set Your Schedules',
      desc: 'Define recurring maintenance tasks for each machine. Set intervals by days, operating hours, or production cycles. Myncel calculates every due date automatically.',
    },
    {
      num: '03',
      title: 'Let Myncel Watch',
      desc: 'Your team receives alerts when tasks come due. Technicians complete work orders from their phones. Managers see everything on one dashboard — in real time.',
    },
  ];

  const companies = [
    'Precision Parts Co.', 'Midwest Fab Works', 'Gulf Coast Mfg.',
    'Atlas Metal Products', 'Summit Plastics Inc.', 'Lakeside Industries',
    'Iron Valley Tools', 'Pacific Forming Co.',
  ];

  return (
    <div className="min-h-screen bg-white text-[#0a2540]">

      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Stripe-style gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob animate-blob w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-gradient-to-br from-purple-400 to-indigo-400 top-[-100px] sm:top-[-200px] right-[-50px] sm:right-[-100px]" />
          <div className="gradient-blob animate-blob-delay w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-gradient-to-br from-pink-300 to-rose-300 top-[50px] sm:top-[100px] right-[100px] sm:right-[200px]" />
          <div className="gradient-blob animate-blob w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] bg-gradient-to-br from-orange-300 to-amber-200 top-[25px] sm:top-[50px] right-[25px] sm:right-[50px]" />
          <div className="gradient-blob animate-blob-delay hidden sm:block w-[250px] h-[250px] bg-gradient-to-br from-cyan-300 to-blue-300 top-[300px] right-[400px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#f0f4ff] border border-[#dde3ff] rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-[#635bff] font-medium mb-6 sm:mb-8">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#635bff] animate-pulse" />
              Trusted by 200+ small manufacturers across the US
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0a2540] leading-tight mb-4 sm:mb-6">
              Your factory,{' '}
              <span className="gradient-text">always running.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-base sm:text-lg md:text-xl text-[#425466] leading-relaxed mb-6 sm:mb-10 max-w-xl">
              Myncel watches your equipment around the clock — scheduling maintenance, alerting your team before machines fail, and replacing expensive consultants with a tool that costs less than one hour of downtime.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
              <Link href="/signup" className="btn-stripe-primary text-sm sm:text-base px-5 sm:px-4 sm:px-6 py-2.5 sm:py-3 text-center justify-center">
                Start free trial →
              </Link>
              <a href="#how-it-works" className="btn-stripe-secondary text-sm sm:text-base px-5 sm:px-4 sm:px-6 py-2.5 sm:py-3 text-center justify-center">
                See how it works
              </a>
            </div>

            <p className="text-xs sm:text-sm text-[#8898aa]">
              Free for 3 months · Setup in 15 minutes · No credit card required
            </p>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-4 sm:px-6 pb-12 sm:pb-24">
          <div className="mockup-window max-w-4xl mx-auto">
            {/* Title bar */}
            <div className="mockup-titlebar">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-[#e6ebf1] rounded-md px-2 sm:px-4 py-1 text-xs text-[#8898aa] font-mono truncate max-w-[200px] sm:max-w-none">
                  app.myncel.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="flex flex-col md:flex-row bg-[#f6f9fc]">
              {/* Sidebar - hidden on mobile, shown on md+ */}
              <div className="hidden md:block w-56 bg-white border-r border-[#e6ebf1] p-4 flex-shrink-0">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded bg-[#635bff] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-sm text-[#0a2540]">Myncel</span>
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'Equipment', active: false },
                    { label: 'Schedules', active: false },
                    { label: 'Work Orders', active: false, badge: '3' },
                    { label: 'Analytics', active: false },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer ${item.active ? 'bg-[#f0f4ff] text-[#635bff] font-medium' : 'text-[#425466] hover:bg-[#f6f9fc]'}`}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-3 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#0a2540] text-sm">Dashboard Preview</h2>
                  <span className="text-xs text-[#8898aa] hidden sm:block">Demo view</span>
                </div>

                {/* Stats row - 2 columns on mobile, 4 on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {[
                    { label: 'Machines', val: '24', color: 'text-[#0a2540]' },
                    { label: 'Tasks This Week', val: '7', color: 'text-[#0a2540]' },
                    { label: 'Overdue', val: '1', color: 'text-red-600' },
                    { label: 'Uptime Score', val: '98%', color: 'text-emerald-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-[#e6ebf1] rounded-lg p-2 sm:p-3">
                      <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.val}</div>
                      <div className="text-xs text-[#8898aa] mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Equipment list */}
                <div className="bg-white border border-[#e6ebf1] rounded-lg overflow-hidden">
                  <div className="px-3 sm:px-4 py-3 border-b border-[#e6ebf1] text-xs font-semibold text-[#8898aa] uppercase tracking-wider">
                    Equipment Status
                  </div>
                  {[
                    { name: 'CNC Machine #1', status: 'On Schedule', dot: 'bg-emerald-400', next: 'Due in 12 days' },
                    { name: 'Conveyor Belt B', status: 'Due Soon', dot: 'bg-amber-400', next: 'Due in 1 day' },
                    { name: 'Hydraulic Press #2', status: 'Overdue', dot: 'bg-red-400', next: 'Overdue 3 days' },
                    { name: 'Air Compressor', status: 'On Schedule', dot: 'bg-emerald-400', next: 'Due in 8 days' },
                  ].map((eq) => (
                    <div key={eq.name} className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#f6f9fc] last:border-0 hover:bg-[#f9fafc]">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`w-2 h-2 rounded-full ${eq.dot} flex-shrink-0`} />
                        <span className="text-xs sm:text-sm font-medium text-[#0a2540] truncate">{eq.name}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <span className="text-xs text-[#8898aa] hidden sm:block">{eq.next}</span>
                        <span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                          eq.status === 'On Schedule' ? 'bg-emerald-50 text-emerald-700' :
                          eq.status === 'Due Soon' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{eq.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ── */}
      <section className="border-t border-b border-[#e6ebf1] bg-[#f6f9fc] py-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6 text-center">
          <p className="text-sm text-[#8898aa] font-medium uppercase tracking-wider">Used by maintenance teams at</p>
        </div>
        <div className="overflow-hidden">
          <div className="ticker-track">
            {[...companies, ...companies].map((c, i) => (
              <span key={i} className="text-[#8898aa] font-semibold text-sm whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity cursor-default">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-12 sm:py-16 md:py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-4 sm:px-6">
          <div className="max-w-xl mb-10 sm:mb-10 sm:mb-16">
            <span className="section-label">Sound familiar?</span>
            <h2 className="text-2xl sm:text-3xl md:text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Real words from maintenance managers we spoke to
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                quote: '"We lost $40,000 last month because a conveyor belt failed. Nobody had tracked maintenance in months — we just fix things when they break."',
                author: 'Plant Manager, Ohio',
                initials: 'PM',
                color: 'bg-violet-100 text-violet-700',
              },
              {
                quote: '"Our maintenance system is a shared Excel file from 2019. Half the team doesn\'t know it exists. We just react to every breakdown."',
                author: 'Maintenance Supervisor, Texas',
                initials: 'MS',
                color: 'bg-blue-100 text-blue-700',
              },
              {
                quote: '"SAP and IBM Maximo are way too expensive and complicated for a 3-machine shop. We need something that just works without a 6-month setup."',
                author: 'Operations Manager, Michigan',
                initials: 'OM',
                color: 'bg-emerald-100 text-emerald-700',
              },
            ].map((t, i) => (
              <div key={i} className="stripe-card p-5 sm:p-7">
                <div className="text-2xl sm:text-3xl text-[#e6ebf1] font-serif mb-3 sm:mb-4">"</div>
                <p className="text-[#425466] leading-relaxed mb-4 sm:mb-6 text-xs sm:text-sm">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${t.color}`}>
                    {t.initials}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#0a2540]">{t.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-12 sm:py-16 md:py-24 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-4 sm:px-6">
          <div className="max-w-xl mb-10 sm:mb-10 sm:mb-16">
            <span className="section-label">Features</span>
            <h2 className="text-2xl sm:text-3xl md:text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Everything in one place.{' '}
              <span className="gradient-text-blue">Myncel watches so you don't have to.</span>
            </h2>
            <p className="text-[#425466] mt-3 sm:mt-4 text-base sm:text-lg">
              Simple, powerful tools designed for factory floors — not corporate IT departments.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div key={i} className="feature-card p-5 sm:p-6 md:p-7">
                <div className={`w-10 sm:w-11 h-10 sm:h-11 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${f.bg} ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#0a2540] mb-1.5 sm:mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-[#425466] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-10 sm:py-12 md:py-16 bg-[#0a2540]">
        <div className="max-w-6xl mx-auto px-4 sm:px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { val: '$260K', label: 'Avg. annual cost of unplanned downtime', sub: 'for small manufacturers' },
              { val: '15 min', label: 'Average setup time', sub: 'no IT help needed' },
              { val: '30%', label: 'Reduction in unplanned breakdowns', sub: 'in first 6 months' },
              { val: '$79/mo', label: 'Starting price', sub: 'less than one hour of downtime' },
            ].map((s, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{s.val}</div>
                <div className="text-xs sm:text-sm text-[#8898aa] leading-tight">{s.label}</div>
                <div className="text-xs text-[#4a5568] mt-1 hidden sm:block">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-4 sm:px-6">
          <div className="max-w-xl mb-10 sm:mb-10 sm:mb-16">
            <span className="section-label">How it works</span>
            <h2 className="text-2xl sm:text-3xl md:text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Up and running in three steps
            </h2>
            <p className="text-[#425466] mt-3 sm:mt-4 text-base sm:text-lg">
              No consultants. No 6-month implementation. No training videos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#f0f4f8] mb-3 sm:mb-4 select-none">{s.num}</div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0a2540] mb-2 sm:mb-3">{s.title}</h3>
                <p className="text-[#425466] leading-relaxed text-xs sm:text-sm">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-[-20px] text-[#e6ebf1] text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-12 sm:py-16 md:py-24 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-10 sm:mb-16">
            <span className="section-label">Pricing</span>
            <h2 className="text-2xl sm:text-3xl md:text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-[#425466] mt-3 sm:mt-4 text-base sm:text-lg">
              Start free for 3 months. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto items-start">
            {[
              {
                name: 'Starter',
                price: '$79',
                sub: 'per month',
                desc: 'Perfect for shops with a handful of machines.',
                features: ['Up to 10 machines', 'Unlimited technicians', 'Email alerts', 'Work orders', 'Basic reports', '14-day history'],
                cta: 'Start free trial',
                featured: false,
              },
              {
                name: 'Growth',
                price: '$149',
                sub: 'per month',
                desc: 'The sweet spot for growing maintenance teams.',
                features: ['Up to 30 machines', 'Unlimited technicians', 'Email + SMS alerts', 'Work orders + photos', 'Advanced analytics', '1-year history', 'Parts inventory'],
                cta: 'Start free trial',
                featured: true,
              },
              {
                name: 'Professional',
                price: '$299',
                sub: 'per month',
                desc: 'For larger operations that need everything.',
                features: ['Unlimited machines', 'Unlimited technicians', 'All alert types', 'Full work order suite', 'Custom reports', 'Unlimited history', 'API access', 'Priority support'],
                cta: 'Start free trial',
                featured: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl p-5 sm:p-6 md:p-7 border ${plan.featured ? 'pricing-featured border-transparent' : 'bg-white border-[#e6ebf1]'}`}>
                {plan.featured && (
                  <div className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 sm:mb-4">
                    Most Popular
                  </div>
                )}
                <div className={`text-sm font-semibold mb-1 ${plan.featured ? 'text-purple-200' : 'text-[#635bff]'}`}>{plan.name}</div>
                <div className={`text-3xl sm:text-2xl sm:text-3xl md:text-4xl font-bold mb-1 ${plan.featured ? 'text-white' : 'text-[#0a2540]'}`}>{plan.price}</div>
                <div className={`text-xs sm:text-sm mb-2 sm:mb-3 ${plan.featured ? 'text-purple-200' : 'text-[#8898aa]'}`}>{plan.sub}</div>
                <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${plan.featured ? 'text-purple-100' : 'text-[#425466]'}`}>{plan.desc}</p>
                <Link
                  href="/signup"
                  className={`block text-center py-2 sm:py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all mb-4 sm:mb-6 ${
                    plan.featured
                      ? 'bg-white text-[#635bff] hover:bg-purple-50'
                      : 'bg-[#635bff] text-white hover:bg-[#4f46e5]'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-2 sm:space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm">
                      <svg className={`w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0 ${plan.featured ? 'text-purple-200' : 'text-[#635bff]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.featured ? 'text-purple-100' : 'text-[#425466]'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-xs sm:text-sm text-[#8898aa] mt-6 sm:mt-8">
            Need more than 50 machines?{' '}
            <a href="/contact" className="text-[#635bff] hover:underline font-medium">Contact us for Enterprise pricing →</a>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="section-label">FAQ</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a2540]">Questions? We've got answers.</h2>
          </div>

          <div className="divide-y divide-[#e6ebf1]">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  className="w-full flex items-center justify-between text-left gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-[#0a2540] text-base">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-[#8898aa] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-[#425466] text-sm leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-12 sm:py-16 md:py-24 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-6 sm:w-8 h-6 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Stop reacting. Start preventing.
          </h2>
          <p className="text-purple-200 text-sm sm:text-base md:text-lg mb-6 sm:mb-10 max-w-lg mx-auto px-2">
            Join 200+ maintenance teams who replaced spreadsheets and guesswork with Myncel. First 3 months free — no card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm text-[#0a2540] placeholder-[#8898aa] border border-purple-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
            />
            <Link
              href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="bg-white text-[#635bff] font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm hover:bg-purple-50 transition-colors whitespace-nowrap text-center"
            >
              Get started free →
            </Link>
          </div>

          <p className="text-purple-300 text-xs mt-4">
            Setup in 15 minutes · Cancel anytime · 30-day money-back guarantee
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}