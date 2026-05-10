import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

const guides = [
  {
    title: 'Preventive Maintenance Checklist',
    description: 'A comprehensive checklist covering CNC machines, hydraulic presses, air compressors, conveyors, and more. Print-ready PDF format with editable Excel version included.',
    href: '/guides/pm-checklist',
    icon: '📋',
    tag: 'Free Download',
    equipment: ['CNC Mills', 'Hydraulic Presses', 'Air Compressors', 'Conveyors'],
  },
  {
    title: 'Equipment Lifespan Guide',
    description: 'Learn how to extend the lifespan of your manufacturing equipment with proper maintenance schedules and best practices.',
    href: '/guides/equipment-lifespan',
    icon: '🔧',
    tag: 'Free Guide',
    equipment: ['All Equipment Types'],
  },
  {
    title: 'Predictive Maintenance ROI Calculator',
    description: 'Calculate the return on investment for implementing predictive maintenance in your facility.',
    href: '/guides/roi-calculator',
    icon: '📊',
    tag: 'Interactive Tool',
    equipment: ['All Industries'],
  },
]

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1e3a5f] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Maintenance Guides & Resources
          </h1>
          <p className="text-xl text-[#8898aa] mb-8 max-w-2xl mx-auto">
            Free downloadable resources, checklists, and guides to help you implement better maintenance practices in your facility.
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide) => (
            <Link
              key={guide.title}
              href={guide.href}
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-[#635bff] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{guide.icon}</span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  guide.tag === 'Free Download' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {guide.tag}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0a2540] mb-2">{guide.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{guide.description}</p>
              <div className="flex flex-wrap gap-2">
                {guide.equipment.map((eq) => (
                  <span key={eq} className="text-xs bg-[#f0f4f8] text-[#4a5568] px-2 py-1 rounded">
                    {eq}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-[#635bff] to-[#4f46e5] rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Want more maintenance resources?
          </h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Sign up for Myncel to access our complete library of maintenance guides, 
            templates, and best practices.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-[#635bff] font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}