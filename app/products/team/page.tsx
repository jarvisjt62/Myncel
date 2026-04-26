import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Team Management — Assign Roles & Track Performance',
  description: 'Manage your maintenance team with role-based access, task assignment, and performance tracking. Unlimited technicians on every plan.',
  alternates: { canonical: 'https://myncel.com/products/team' },
};

export default function Team() {
  const features = [
    { icon: '👤', title: 'Unlimited Users', desc: 'Every plan includes unlimited technician accounts. No per-user fees or licensing games.' },
    { icon: '🔐', title: 'Role-Based Access', desc: 'Control who sees what. Administrators, managers, and technicians with appropriate permissions.' },
    { icon: '📋', title: 'Task Assignment', desc: 'Assign work orders to specific team members. Balance workload and ensure accountability.' },
    { icon: '📊', title: 'Performance Tracking', desc: 'Track completion rates, average time per task, and first-time fix rates for each technician.' },
    { icon: '🔔', title: 'Smart Notifications', desc: 'Route alerts to the right people. Technicians get their tasks, supervisors get overviews.' },
    { icon: '📱', title: 'Mobile Access', desc: 'Every team member can access the system from their phone. No special software required.' },
  ];

  const roles = [
    { name: 'Administrator', perms: ['Full system access', 'User management', 'All facilities', 'Billing access'] },
    { name: 'Manager', perms: ['View all machines', 'Assign tasks', 'Run reports', 'Approve work orders'] },
    { name: 'Technician', perms: ['View assigned tasks', 'Complete work orders', 'Add notes & photos', 'Update status'] },
  ];

  const stats = [
    { value: 'Unlimited', label: 'Team members' },
    { value: '0$', label: 'Per-user cost' },
    { value: '3', label: 'Role types' },
    { value: 'Instant', label: 'Setup' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Team Management</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Team Management
              <span className="block text-purple-600">Your team, organized.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Manage your maintenance team with role-based access, task assignment, and performance tracking. Unlimited technicians on every plan—no per-user fees.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-purple-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-purple-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Manage your team effectively</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-purple-50 rounded-xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-sm text-[#425466]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Roles</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built-in role types</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
                <h3 className="font-bold text-[#0a2540] text-lg mb-4">{role.name}</h3>
                <ul className="space-y-2">
                  {role.perms.map((p, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#425466]">
                      <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-purple-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to organize your team?</h2>
          <p className="text-purple-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-purple-600 font-bold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}