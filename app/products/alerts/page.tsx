import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Alerts & Notifications — Proactive Maintenance Alerts',
  description: 'Get notified by email or SMS the moment a task comes due, goes overdue, or a machine shows warning signs. Configure who gets notified, when, and how.',
  alternates: { canonical: 'https://myncel.com/products/alerts' },
};

export default function AlertsNotifications() {
  const features = [
    {
      icon: '📧',
      title: 'Email Alerts',
      desc: 'Instant email notifications when tasks come due, go overdue, or machines show warning signs. Include all relevant details right in the message.',
    },
    {
      icon: '📱',
      title: 'SMS Notifications',
      desc: 'Text message alerts for urgent matters. Reach technicians who don\'t check email regularly or are away from computers.',
    },
    {
      icon: '⬆️',
      title: 'Overdue Escalations',
      desc: 'When a task stays overdue too long, automatically escalate to supervisors. Ensure nothing falls through the cracks.',
    },
    {
      icon: '⚙️',
      title: 'Custom Alert Rules',
      desc: 'Define what triggers an alert, who receives it, and how quickly. Different rules for different machines, priorities, or situations.',
    },
    {
      icon: '👥',
      title: 'Team-Based Routing',
      desc: 'Route alerts to the right people based on machine assignment, location, or skill set. Technicians get their tasks, managers get overviews.',
    },
    {
      icon: '📊',
      title: 'Daily Digest Reports',
      desc: 'Optional daily summary emails showing what\'s due, what\'s overdue, and what was completed. Keep everyone in the loop without alert fatigue.',
    },
  ];

  const alertTypes = [
    { type: 'Task Due', desc: 'Maintenance task is scheduled for today', priority: 'Normal' },
    { type: 'Task Overdue', desc: 'Scheduled maintenance has not been completed', priority: 'High' },
    { type: 'Machine Warning', desc: 'Sensor reading outside normal parameters', priority: 'High' },
    { type: 'Breakdown', desc: 'Machine reported as non-operational', priority: 'Emergency' },
    { type: 'Low Inventory', desc: 'Parts below minimum stock level', priority: 'Normal' },
    { type: 'Warranty Expiring', desc: 'Machine warranty ending soon', priority: 'Normal' },
  ];

  const stats = [
    { value: '99.9%', label: 'Alert delivery rate' },
    { value: '<30s', label: 'Average alert time' },
    { value: '85%', label: 'Faster response' },
    { value: '24/7', label: 'Monitoring' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-amber-300 to-orange-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Alerts & Notifications</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Alerts & Notifications
              <span className="block text-amber-600">Stay ahead of problems before they happen.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Get notified by email or SMS the moment a task comes due, goes overdue, or a machine shows warning signs. Your team always knows what needs attention.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-amber-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-amber-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alert Types */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Alert Types</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Know about everything that matters</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#e6ebf1]">
                  <th className="text-left py-3 pr-6 text-[#8898aa] font-semibold">Alert Type</th>
                  <th className="text-left py-3 px-4 text-[#8898aa] font-semibold">Description</th>
                  <th className="text-center py-3 px-4 text-[#8898aa] font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {alertTypes.map((alert, i) => (
                  <tr key={i} className="border-b border-[#f6f9fc]">
                    <td className="py-4 pr-6 font-medium text-[#0a2540]">{alert.type}</td>
                    <td className="py-4 px-4 text-[#425466]">{alert.desc}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.priority === 'Emergency' ? 'bg-red-100 text-red-700' :
                        alert.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{alert.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Complete notification control</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#e6ebf1] hover:shadow-lg transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-amber-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to stay informed?</h2>
          <p className="text-amber-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-amber-600 font-bold px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}