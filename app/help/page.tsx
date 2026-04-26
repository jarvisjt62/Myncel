import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Help Center — Myncel Support & Documentation',
  description: 'Find answers to common questions, browse tutorials, and get support for Myncel predictive maintenance software.',
  alternates: { canonical: 'https://myncel.com/help' },
};

export default function HelpCenterPage() {
  const faqs = [
    {
      question: 'How do I add a new machine?',
      answer: 'Go to the Equipment tab in your dashboard and click "Add Machine". Fill in the machine details including name, type, location, and any relevant sensors or meters. Save to start tracking.',
    },
    {
      question: 'How do I create a work order?',
      answer: 'Navigate to Work Orders tab and click "New Work Order". Select the machine, add details about the issue or task, assign to a technician, set priority and due date, then save.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! Use the Export button on any tab to download your data as CSV or JSON format. You can export equipment lists, work order history, maintenance logs, and analytics reports.',
    },
    {
      question: 'How do notifications work?',
      answer: 'Click the bell icon in the top right to see notifications. You\'ll receive alerts for maintenance due dates, work order assignments, equipment alerts, and more. Configure notification preferences in Settings.',
    },
    {
      question: 'How do I set up preventive maintenance schedules?',
      answer: 'Go to Scheduling > Preventive Maintenance. Create a new PM schedule by selecting the equipment, choosing interval type (calendar days, operating hours, or meter readings), and defining the tasks to perform.',
    },
    {
      question: 'Can I use Myncel on my phone?',
      answer: 'Yes! Myncel is fully responsive and works on any device. Technicians can view and update work orders, log maintenance, and receive alerts from their mobile phones without installing an app.',
    },
    {
      question: 'How do I add team members?',
      answer: 'Go to Settings > Team Management. Click "Invite Team Member" and enter their email address. They\'ll receive an invitation to join your organization with the role you assign.',
    },
    {
      question: 'What integrations are available?',
      answer: 'Myncel integrates with popular ERP systems, IoT sensors, and business tools. Contact our team for specific integration requirements or check the Integrations section in Settings.',
    },
  ];

  const categories = [
    { icon: '🎯', title: 'Getting Started', desc: 'Set up your account and add your first equipment', link: '/docs' },
    { icon: '⚙️', title: 'Equipment Management', desc: 'Add, edit, and organize your machines', link: '/help#equipment' },
    { icon: '📋', title: 'Work Orders', desc: 'Create, assign, and track maintenance tasks', link: '/help#workorders' },
    { icon: '📅', title: 'Scheduling', desc: 'Set up preventive maintenance plans', link: '/help#scheduling' },
    { icon: '📊', title: 'Reports & Analytics', desc: 'Understand your maintenance metrics', link: '/help#reports' },
    { icon: '🔔', title: 'Alerts & Notifications', desc: 'Configure how you receive updates', link: '/help#alerts' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f6f9fc] to-white py-16 border-b border-[#e6ebf1]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <nav className="text-sm text-[#8898aa] mb-4">
            <Link href="/" className="hover:text-[#635bff]">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#0a2540]">Help Center</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0a2540] mb-4">
            How can we help?
          </h1>
          <p className="text-lg text-[#425466] max-w-2xl mx-auto mb-8">
            Find answers to common questions, browse tutorials, and get the most out of Myncel.
          </p>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full px-5 py-4 border border-[#e6ebf1] rounded-xl text-[#0a2540] placeholder-[#8898aa] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all pr-12"
              />
              <svg className="w-5 h-5 text-[#8898aa] absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <a 
                key={i} 
                href={cat.link}
                className="bg-white border border-[#e6ebf1] rounded-xl p-6 hover:shadow-lg hover:border-[#635bff]/30 transition-all group"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-1 group-hover:text-[#635bff] transition-colors">{cat.title}</h3>
                <p className="text-sm text-[#425466]">{cat.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-[#f6f9fc]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e6ebf1] p-6">
                <h3 className="font-semibold text-[#0a2540] mb-2">{faq.question}</h3>
                <p className="text-[#425466] text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#635bff]/5 rounded-2xl border border-[#635bff]/20 p-8 text-center">
            <h2 className="text-xl font-bold text-[#0a2540] mb-2">Still need help?</h2>
            <p className="text-[#425466] mb-6">Our support team is available to assist you with any questions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/support" className="bg-[#635bff] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4f46e5] transition-colors">
                Open Support Ticket
              </Link>
              <Link href="/contact" className="border border-[#e6ebf1] text-[#0a2540] px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}