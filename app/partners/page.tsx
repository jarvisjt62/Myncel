import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import PartnerApplicationForm from './PartnerApplicationForm';

export const metadata = {
  title: 'Partner & Reseller Program | Myncel Equipment Monitoring',
  description: 'Join the Myncel partner program. Earn recurring commissions by reselling Myncel to your clients. Ideal for facility management consultants, engineering firms, IoT integrators, and IT resellers.',
  alternates: { canonical: 'https://www.myncel.com/partners' },
  openGraph: {
    title: 'Become a Myncel Partner | Reseller & Referral Program',
    description: 'Earn recurring revenue by bringing Myncel to your clients. Join our partner program as a referral partner, reseller, or technology integrator.',
    url: 'https://www.myncel.com/partners',
    type: 'website',
  },
};

const tiers = [
  {
    name: 'Referral Partner',
    icon: '🤝',
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    commission: '15%',
    commissionLabel: 'recurring commission',
    description: 'Refer clients to Myncel and earn a recurring percentage of their subscription revenue for the lifetime of the account.',
    features: [
      'Unique referral tracking link',
      '15% recurring commission on all referred accounts',
      'Commission paid monthly via bank transfer or PayPal',
      'Access to Myncel partner portal and reporting',
      'Co-branded collateral and proposal templates',
      'Dedicated partner support email',
    ],
    ideal: 'Consultants, advisors, industry associations, and anyone with a network of facility or operations managers.',
    cta: 'Become a referral partner',
  },
  {
    name: 'Reseller Partner',
    icon: '💼',
    color: 'from-purple-50 to-purple-100',
    border: 'border-purple-300',
    badge: 'bg-purple-100 text-purple-700',
    commission: '25%',
    commissionLabel: 'recurring margin',
    description: 'Purchase Myncel subscriptions at a discounted rate and resell to your clients at your own price. You own the client relationship.',
    features: [
      'Discounted reseller pricing (up to 25% margin)',
      'White-label option available on Enterprise tier',
      'You set your own prices and payment terms',
      'Full client management dashboard',
      'Co-selling support from Myncel sales team',
      'Priority technical support for your clients',
      'Quarterly business reviews with partner manager',
      'Access to pre-sales technical assistance',
    ],
    ideal: 'IT resellers, facility management companies, engineering consultancies, and EPC contractors managing client facilities.',
    cta: 'Apply as a reseller',
    highlighted: true,
  },
  {
    name: 'Technology Partner',
    icon: '🔗',
    color: 'from-green-50 to-green-100',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    commission: 'Revenue share',
    commissionLabel: 'on joint accounts',
    description: 'Integrate your IoT devices, sensors, or software platform with Myncel and create joint solutions for mutual clients.',
    features: [
      'API and webhook access for deep integration',
      'Joint go-to-market on integrated solutions',
      'Revenue share on accounts using joint solution',
      'Co-marketing in Myncel marketplace (coming soon)',
      'Technical integration support and sandbox access',
      'Joint case studies and co-branded marketing',
      'Listed as certified technology partner',
    ],
    ideal: 'IoT sensor manufacturers, BMS (building management system) vendors, ERP providers, and SCADA/automation companies.',
    cta: 'Explore technology partnership',
  },
];

const benefits = [
  {
    icon: '💰',
    title: 'Recurring revenue',
    desc: 'Unlike one-time project fees, Myncel commissions and margins recur every month for the lifetime of the account. A client you onboard today generates revenue for years.',
  },
  {
    icon: '📈',
    title: 'Growing market',
    desc: 'Equipment monitoring and maintenance management is growing rapidly across Africa, the Middle East, and emerging markets. You are building a position in a market that is still early.',
  },
  {
    icon: '🎯',
    title: 'Strong product-market fit',
    desc: 'Myncel solves a real, pressing problem for facilities teams. Selling a product that genuinely improves your clients\' operations makes every conversation easier and conversion rates higher.',
  },
  {
    icon: '🛠️',
    title: 'Full sales support',
    desc: 'We provide demo support, technical pre-sales assistance, proposal templates, and co-selling resources so you can close deals without needing to become a Myncel expert yourself.',
  },
  {
    icon: '🌍',
    title: 'Global reach, local expertise',
    desc: 'Myncel operates globally but is built with deep understanding of West African and emerging market realities. Partners in Nigeria, Ghana, and across the region find a product that resonates with local clients.',
  },
  {
    icon: '📊',
    title: 'Full visibility',
    desc: 'The partner portal gives you real-time visibility over referrals, commissions, client usage, and account health — everything you need to manage your Myncel business.',
  },
];

const idealPartners = [
  { emoji: '🏗️', title: 'Facility Management Companies', desc: 'FM companies managing assets on behalf of clients — adding Myncel to your service offering enhances your value and creates recurring software revenue.' },
  { emoji: '⚙️', title: 'Engineering & Maintenance Firms', desc: 'Mechanical and electrical engineering firms providing maintenance services. Myncel helps you deliver and evidence better outcomes for your clients.' },
  { emoji: '📡', title: 'IoT & Systems Integrators', desc: 'Companies installing sensors, SCADA systems, BMS, and automation equipment — Myncel provides the maintenance management layer for your installed base.' },
  { emoji: '💻', title: 'IT Resellers & MSPs', desc: 'Technology resellers with relationships in the industrial, commercial, and healthcare sectors looking to add SaaS products to their portfolio.' },
  { emoji: '🎓', title: 'Industry Consultants', desc: 'Operations, safety, and compliance consultants who advise facility managers and operations directors — Myncel is a natural addition to your recommendations.' },
  { emoji: '🏢', title: 'EPC & Construction Contractors', desc: 'Engineering, procurement, and construction contractors who install and hand over facilities — Myncel helps clients manage the assets you install long-term.' },
];

const faqs = [
  {
    q: 'How does the referral tracking work?',
    a: 'Each referral partner receives a unique tracking link. When a prospect signs up via your link or you submit a deal registration, the referral is attributed to your account. Commissions are calculated automatically and paid monthly.',
  },
  {
    q: 'Can I be both a reseller and a technology partner?',
    a: 'Yes. Many partners participate in multiple tiers, particularly systems integrators who both resell subscriptions and integrate their hardware with Myncel. Talk to our partner team about the right structure for your business.',
  },
  {
    q: 'Is there a fee to join the partner program?',
    a: 'No. Joining the Myncel partner program is free. There are no annual fees, minimum revenue commitments, or certification costs for the referral or reseller tiers.',
  },
  {
    q: 'How long are commissions paid for referred accounts?',
    a: 'Referral commissions are paid for the lifetime of the referred account — as long as the client maintains an active Myncel subscription, you continue to earn your commission.',
  },
  {
    q: 'What training and onboarding is provided to new partners?',
    a: 'All new partners receive a partner onboarding session, access to the partner portal, and a library of sales collateral, demo materials, and training resources. Reseller partners also receive a dedicated partner manager.',
  },
  {
    q: 'Is white-labelling available?',
    a: 'White-labelling is available for reseller partners on Enterprise tier accounts. Your clients see your branding, not Myncel\'s. Contact us to discuss white-label terms.',
  },
];

export default function Partners() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a2540] via-[#1a3560] to-[#0d1f3c] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full mb-8">
            🤝 Myncel Partner Program
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Grow your business by<br />
            <span className="text-[#635bff]">bringing Myncel to your clients</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Earn recurring commissions as a referral partner, build a managed services practice as a reseller, or integrate your technology as a platform partner. Three ways to grow with Myncel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#apply"
              className="inline-block bg-[#635bff] text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-[#5a52e8] transition-colors"
            >
              Apply to the program →
            </Link>
            <Link
              href="/contact"
              className="inline-block bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Talk to the partner team
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-[#f6f9fc] border-y border-[#e6ebf1] py-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '40+', label: 'Active partners globally' },
              { stat: '15–25%', label: 'Recurring partner margin' },
              { stat: '12+', label: 'Countries with partner coverage' },
              { stat: '$0', label: 'Cost to join the program' },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-[#0a2540]">{item.stat}</div>
                <div className="text-sm text-[#425466]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why partner with us */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">Why partner with Myncel?</h2>
          <p className="text-[#425466] text-lg max-w-2xl mx-auto">Partners choose Myncel because it solves a real problem for real clients — and generates genuine recurring revenue.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{b.icon}</div>
              <h3 className="font-bold text-[#0a2540] mb-2">{b.title}</h3>
              <p className="text-[#425466] text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partner tiers */}
      <div className="bg-[#f6f9fc] border-y border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">Choose your partnership model</h2>
            <p className="text-[#425466] text-lg max-w-2xl mx-auto">Three tiers designed for different types of partners — from individual consultants to established technology companies.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border-2 ${tier.border} p-8 flex flex-col ${tier.highlighted ? 'shadow-xl ring-2 ring-[#635bff] ring-offset-2' : ''}`}
              >
                {tier.highlighted && (
                  <div className="bg-[#635bff] text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4">Most Popular</div>
                )}
                <div className="text-4xl mb-3">{tier.icon}</div>
                <h3 className="text-xl font-bold text-[#0a2540] mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-[#635bff]">{tier.commission}</span>
                  <span className="text-[#425466] text-sm">{tier.commissionLabel}</span>
                </div>
                <p className="text-[#425466] text-sm leading-relaxed mb-6">{tier.description}</p>
                <ul className="space-y-3 mb-6 flex-grow">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[#425466]">
                      <span className="text-[#635bff] mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={`text-xs font-medium px-3 py-2 rounded-lg ${tier.badge} mb-6`}>
                  <span className="font-bold">Ideal for: </span>{tier.ideal}
                </div>
                <Link
                  href="#apply"
                  className={`text-center font-semibold px-6 py-3 rounded-xl transition-colors ${
                    tier.highlighted
                      ? 'bg-[#635bff] text-white hover:bg-[#5a52e8]'
                      : 'bg-[#f6f9fc] text-[#0a2540] border border-[#e6ebf1] hover:bg-[#eef2f7]'
                  }`}
                >
                  {tier.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ideal partners */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">Who is the program for?</h2>
          <p className="text-[#425466] text-lg max-w-2xl mx-auto">The Myncel partner program is designed for businesses and professionals who work with facility managers, operations directors, and maintenance teams.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {idealPartners.map((p, i) => (
            <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl p-6 hover:shadow-md transition-shadow">
              <span className="text-3xl mb-4 block">{p.emoji}</span>
              <h3 className="font-bold text-[#0a2540] mb-2">{p.title}</h3>
              <p className="text-[#425466] text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-[#f6f9fc] border-y border-[#e6ebf1] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl text-[#635bff] font-serif mb-6">"</div>
          <blockquote className="text-xl text-[#0a2540] font-medium leading-relaxed mb-8">
            Adding Myncel to our FM service offering was a natural fit. Our clients already trusted us to manage their facilities — Myncel gave us a platform to demonstrate and evidence the quality of our maintenance work. The recurring commission on 8 client accounts now represents a meaningful monthly revenue stream.
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#635bff] flex items-center justify-center text-white font-bold">FP</div>
            <div className="text-left">
              <div className="font-medium text-[#0a2540]">Facility Management Director</div>
              <div className="text-[#425466] text-sm">Reseller Partner, Nigeria</div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply section */}
      <div id="apply" className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">Apply to the partner program</h2>
          <p className="text-[#425466] text-lg">Tell us about your business and the type of partnership you are interested in. Our partner team will respond within 2 business days.</p>
        </div>

        <PartnerApplicationForm />
      </div>

      {/* FAQ */}
      <div className="bg-[#f6f9fc] border-t border-[#e6ebf1]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0a2540] mb-4">Partner program FAQ</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl p-6">
                <h3 className="font-bold text-[#0a2540] mb-3">{faq.q}</h3>
                <p className="text-[#425466] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-[#425466] mb-4">Still have questions about the partner program?</p>
            <Link href="/contact" className="text-[#635bff] font-medium hover:underline">Contact our partner team →</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}