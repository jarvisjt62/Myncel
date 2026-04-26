import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'About — Built by a Factory Manager, for Factory Managers',
  description: 'Myncel was born from an $80,000 breakdown that should never have happened. Learn our story, mission, and why we\'re obsessed with making preventive maintenance accessible to every small manufacturer.',
  alternates: { canonical: 'https://myncel.com/about' },
  openGraph: {
    title: 'About Myncel — Our Story & Mission',
    description: 'We\'re on a mission to make preventive maintenance accessible to every manufacturer — not just the Fortune 500.',
    url: 'https://myncel.com/about',
  },
}

export default function About() {
  const team = [
    { name: 'Alex Rivera', role: 'CEO & Co-founder', bio: 'Former maintenance manager at a 200-person auto parts plant. Built Myncel after losing $80K to a single preventable breakdown.', initials: 'AR', color: 'bg-violet-600' },
    { name: 'Priya Sharma', role: 'CTO & Co-founder', bio: '10 years in industrial IoT at Siemens. Left to build software that factory floors actually want to use.', initials: 'PS', color: 'bg-blue-600' },
    { name: 'Marcus Johnson', role: 'Head of Customer Success', bio: 'Spent 8 years as a CMMS consultant. Has personally implemented maintenance systems at 60+ manufacturers.', initials: 'MJ', color: 'bg-emerald-600' },
    { name: 'Sarah Chen', role: 'Head of Product', bio: 'Former product lead at Procore and UpKeep. Obsessed with making complex workflows feel simple.', initials: 'SC', color: 'bg-rose-600' },
    { name: 'David Park', role: 'Head of Engineering', bio: 'Previously Staff Engineer at Palantir. Leads the team building the infrastructure behind Myncel\'s reliability.', initials: 'DP', color: 'bg-amber-600' },
    { name: 'Linda Torres', role: 'Head of Sales', bio: 'Former VP of Sales at Limble CMMS. Knows manufacturing inside and out and loves helping shops find the right fit.', initials: 'LT', color: 'bg-indigo-600' },
  ];

  const timeline = [
    { year: '2023', title: 'The Problem', desc: 'Alex loses $80,000 to a hydraulic press failure that could have been prevented. He starts researching CMMS software and finds nothing suitable for small shops.' },
    { year: '2023', title: 'The Idea', desc: 'Alex teams up with Priya to build a maintenance tool that\'s as easy to use as a consumer app but powerful enough for real factory floors.' },
    { year: '2024', title: 'First Users', desc: 'Myncel launches in private beta with 12 manufacturers. All 12 renew after the trial. Word spreads fast on LinkedIn.' },
    { year: '2024', title: 'Growing Fast', desc: '100 manufacturers using Myncel. First $100K ARR. Team grows to 8 people. Series Seed of $2.5M raised from Palo Alto angels.' },
    { year: '2025', title: 'Nationwide', desc: '200+ manufacturers across 38 states. $1.2M ARR. Launch of mobile app, parts inventory, and API integrations.' },
    { year: '2026', title: 'What\'s Next', desc: 'Expanding into Canada and UK. Building predictive maintenance models with machine learning. Series A coming soon.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0a2540] py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-purple-600 to-indigo-600 top-[-200px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[400px] h-[400px] bg-gradient-to-br from-blue-600 to-cyan-500 bottom-[-100px] left-[-50px] opacity-15" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-xs font-bold text-[#635bff] uppercase tracking-wider bg-[#1e3a5f] px-4 py-1.5 rounded-full mb-6">Our Story</span>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Built by a factory manager.<br />
              <span className="text-[#635bff]">For factory managers.</span>
            </h1>
            <p className="text-xl text-[#8898aa] leading-relaxed">
              Myncel was born out of a $80,000 breakdown that should never have happened. We're on a mission to make preventive maintenance accessible to every manufacturer — not just the Fortune 500.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-label">Mission</span>
              <h2 className="text-4xl font-bold text-[#0a2540] mb-6">The missing middle of manufacturing software</h2>
              <p className="text-[#425466] leading-relaxed mb-4">
                Enterprise CMMS tools like SAP PM and IBM Maximo cost $50,000–$500,000 to implement. They're designed for 500-person corporate IT departments, not a maintenance supervisor at a 30-person fab shop.
              </p>
              <p className="text-[#425466] leading-relaxed mb-4">
                On the other end, spreadsheets and sticky notes can't scale. They don't send alerts, they don't track history, and they fall apart the moment someone calls in sick.
              </p>
              <p className="text-[#425466] leading-relaxed mb-6">
                Myncel fills that gap. Powerful enough to run a complex multi-facility operation. Simple enough that your least tech-savvy technician can start using it on day one — without training.
              </p>
              <Link href="/signup" className="btn-stripe-primary">Start free trial →</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🏭', val: '200+', label: 'Manufacturers', sub: 'across 38 states' },
                { icon: '⚙️', val: '4,800+', label: 'Machines', sub: 'actively monitored' },
                { icon: '💰', val: '$2.4M+', label: 'Downtime Prevented', sub: 'and counting' },
                { icon: '👥', val: '12', label: 'Team Members', sub: 'based in Palo Alto' },
              ].map((s) => (
                <div key={s.label} className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-5">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold text-[#635bff]">{s.val}</div>
                  <div className="text-sm font-semibold text-[#0a2540]">{s.label}</div>
                  <div className="text-xs text-[#8898aa]">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">History</span>
            <h2 className="text-4xl font-bold text-[#0a2540]">How we got here</h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#e6ebf1]" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <div key={i} className="relative flex gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#635bff] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 z-10 border-4 border-white shadow">
                    {item.year}
                  </div>
                  <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 flex-1 shadow-sm">
                    <h3 className="font-bold text-[#0a2540] mb-1">{item.title}</h3>
                    <p className="text-sm text-[#425466] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Team</span>
            <h2 className="text-4xl font-bold text-[#0a2540]">The people behind Myncel</h2>
            <p className="text-[#425466] mt-3 max-w-xl mx-auto">We've all worked in or around manufacturing. We built the tool we always wished we had.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="border border-[#e6ebf1] rounded-2xl p-6 hover:shadow-md transition-all">
                <div className={`w-14 h-14 rounded-2xl ${member.color} flex items-center justify-center text-white text-lg font-bold mb-4`}>
                  {member.initials}
                </div>
                <h3 className="font-bold text-[#0a2540] mb-0.5">{member.name}</h3>
                <p className="text-sm text-[#635bff] font-medium mb-3">{member.role}</p>
                <p className="text-sm text-[#425466] leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Values</span>
            <h2 className="text-4xl font-bold text-[#0a2540]">What we believe</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🔨', title: 'Built for the floor, not the boardroom', desc: 'Every feature is designed for the person who works in the shop, not the VP who signs the check. If a technician can\'t use it with greasy hands on a phone, it\'s not good enough.' },
              { icon: '💡', title: 'Simple is harder than complex', desc: 'Enterprise software is "powerful" because it\'s complicated. We work harder so our customers don\'t have to. Every screen, every alert, every report is designed for zero confusion.' },
              { icon: '📈', title: 'ROI in the first week', desc: 'Myncel should pay for itself before your first billing cycle. If you\'re not seeing clear value — fewer breakdowns, saved time, caught risks — something is wrong and we\'ll fix it.' },
            ].map((v, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl p-7">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-3">{v.title}</h3>
                <p className="text-sm text-[#425466] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring CTA */}
      <section className="py-16 bg-[#0a2540]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">We're hiring</h2>
            <p className="text-[#8898aa] text-sm">Join a small team with a big mission. We're remote-first with an office in Palo Alto.</p>
          </div>
          <Link href="/careers" className="flex-shrink-0 bg-[#635bff] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors">
            View open roles →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}