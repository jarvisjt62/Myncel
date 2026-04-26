'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'
import InteractiveChecklist from './InteractiveChecklist'

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function PMChecklistContent() {
  const searchParams = useSearchParams()
  const isDownloadMode = searchParams.get('download') === 'true'
  
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    if (!siteKey) return
    if (window.grecaptcha) return
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get reCAPTCHA token
      let captchaToken = ''
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      if (siteKey && window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(siteKey, { action: 'pm_checklist' })
      }

      // Submit to API
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          source: 'pm-checklist',
          captchaToken,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Download mode - show printable checklist
    if (isDownloadMode) {
      return <InteractiveChecklist />
    }


  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
            🎁 Free Download — No spam, ever
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            The Ultimate Preventive Maintenance Checklist for Small Manufacturers
          </h1>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Used by 200+ manufacturing shops. Covers CNC machines, hydraulic presses, air compressors, conveyors, and more. Print-ready PDF format.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-100">
            {['✓ 8 equipment types covered', '✓ Daily, weekly, monthly & annual tasks', '✓ Print-ready PDF', '✓ Editable Excel version included'].map(item => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

          {/* Left: What's inside */}
          <div>
            <h2 className="text-2xl font-bold text-[#0a2540] mb-6">What's inside the checklist</h2>

            <div className="space-y-4 mb-8">
              {[
                { icon: '⚙️', title: 'CNC Mills & Machining Centers', tasks: '47 tasks · Daily through annual' },
                { icon: '🔩', title: 'CNC Lathes & Turning Centers', tasks: '38 tasks · Daily through annual' },
                { icon: '🔧', title: 'Hydraulic Presses & Systems', tasks: '31 tasks · Daily through quarterly' },
                { icon: '💨', title: 'Air Compressors & Pneumatics', tasks: '24 tasks · Daily through annual' },
                { icon: '📦', title: 'Conveyors & Material Handling', tasks: '22 tasks · Weekly through annual' },
                { icon: '⚡', title: 'Electrical Panels & Motors', tasks: '18 tasks · Monthly through annual' },
                { icon: '🌡️', title: 'Cooling & HVAC Systems', tasks: '16 tasks · Monthly through annual' },
                { icon: '🔬', title: 'Welding Equipment', tasks: '20 tasks · Daily through quarterly' },
              ].map(({ icon, title, tasks }) => (
                <div key={title} className="flex items-center gap-4 p-4 border border-[#e6ebf1] rounded-xl">
                  <div className="text-2xl w-10 flex-shrink-0 text-center">{icon}</div>
                  <div>
                    <div className="font-semibold text-[#0a2540] text-sm">{title}</div>
                    <div className="text-xs text-[#425466]">{tasks}</div>
                  </div>
                  <div className="ml-auto text-[#635bff]">✓</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6">
              <p className="text-[#425466] italic mb-4 text-sm leading-relaxed">
                "We printed these checklists for every machine in our shop and laminated them. Our PM compliance went from about 30% to 90% in the first month. Simple but incredibly effective."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#635bff] flex items-center justify-center text-white font-bold text-xs">TM</div>
                <div>
                  <div className="text-sm font-semibold text-[#0a2540]">Tom Martinez</div>
                  <div className="text-xs text-[#425466]">Plant Manager · Martinez Metal Works</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Download form */}
          <div className="sticky top-24">
            {!submitted ? (
              <div className="bg-white border border-[#e6ebf1] rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-[#0a2540] mb-2">Get your free copy</h3>
                <p className="text-[#425466] text-sm mb-6">Enter your name and email. We'll send the download link instantly.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0a2540] mb-1">Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="John Smith"
                      className="w-full border border-[#e6ebf1] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0a2540] mb-1">Work email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="john@yourshop.com"
                      className="w-full border border-[#e6ebf1] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0a2540] mb-1">Company name</label>
                    <input
                      type="text"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="Precision Parts Co."
                      className="w-full border border-[#e6ebf1] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#635bff] text-white font-bold py-3 rounded-lg hover:bg-[#4f46e5] transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send me the free checklist →'}
                  </button>
                </form>

                <p className="text-xs text-[#425466] text-center mt-4">
                  No spam. Unsubscribe anytime. We may follow up once about Myncel — that's it.
                </p>

                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#e6ebf1]">
                  {['🔒 SSL encrypted', '✓ No credit card', '📧 Instant delivery'].map(item => (
                    <span key={item} className="text-xs text-[#425466]">{item}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#e6ebf1] rounded-2xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-[#0a2540] mb-2">Check your inbox!</h3>
                <p className="text-[#425466] text-sm mb-6">
                  We sent the PM checklist to <strong>{email}</strong>. Check your inbox (and spam folder, just in case).
                </p>
                <div className="bg-[#f6f9fc] rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-semibold text-[#0a2540] mb-2">While you wait, why not:</p>
                  <ul className="space-y-2">
                    {[
                      { href: '/signup', label: 'Start your free 3-month trial of Myncel' },
                      { href: '/blog/preventive-maintenance-program', label: 'Read: How to build a PM program from scratch' },
                      { href: '/blog/cnc-machine-maintenance-checklist', label: 'Read: CNC maintenance checklist deep dive' },
                    ].map(({ href, label }) => (
                      <li key={href}>
                        <Link href={href} className="text-sm text-[#635bff] hover:underline">→ {label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/signup" className="inline-block bg-[#635bff] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors text-sm">
                  Start free trial →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* More resources */}
        <div className="mt-20 pt-12 border-t border-[#e6ebf1]">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-8 text-center">More free maintenance resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { href: '/blog/hidden-cost-reactive-maintenance', icon: '💸', title: 'The Hidden Cost of Reactive Maintenance', desc: 'Calculate what reactive maintenance is really costing your shop.' },
              { href: '/blog/preventive-maintenance-program', icon: '🏗️', title: 'Build a PM Program from Scratch', desc: 'Step-by-step guide to building a maintenance program that sticks.' },
              { href: '/blog/maintenance-kpis-plant-manager', icon: '📊', title: '10 Maintenance KPIs to Track', desc: 'The metrics that tell you if your maintenance program is working.' },
            ].map(({ href, icon, title, desc }) => (
              <Link key={href} href={href} className="block p-6 border border-[#e6ebf1] rounded-2xl hover:border-[#635bff] hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2 text-sm">{title}</h3>
                <p className="text-[#425466] text-xs">{desc}</p>
                <span className="text-[#635bff] text-xs font-semibold mt-3 inline-block">Read article →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function PMChecklist() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p>Loading...</p></div>}>
      <PMChecklistContent />
    </Suspense>
  )
}