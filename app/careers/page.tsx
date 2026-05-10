import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

const jobs = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Sales Development Representative',
    department: 'Sales',
    location: 'Remote',
    type: 'Full-time',
  },
]

const benefits = [
  { icon: '🏥', title: 'Health Insurance', description: 'Comprehensive medical, dental, and vision coverage for you and your family.' },
  { icon: '🌴', title: 'Unlimited PTO', description: 'Take the time you need to recharge and maintain work-life balance.' },
  { icon: '💰', title: '401(k) Match', description: 'We match your retirement contributions to help you save for the future.' },
  { icon: '🏠', title: 'Remote-First', description: 'Work from anywhere in the world with flexible hours.' },
  { icon: '📈', title: 'Stock Options', description: 'Own a piece of the company with equity grants.' },
  { icon: '📚', title: 'Learning Budget', description: '$2,000 annual budget for courses, books, and conferences.' },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1e3a5f] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Join the Myncel Team
          </h1>
          <p className="text-xl text-[#8898aa] mb-8 max-w-2xl mx-auto">
            We're building the future of predictive maintenance for small manufacturers. 
            Come help us make factories more efficient and reduce downtime worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-100">
            {['🌍 Remote-First', '📈 Growing Team', '🏆 Series A Funded'].map(item => (
              <span key={item} className="bg-white bg-opacity-10 px-4 py-2 rounded-full">{item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#0a2540] mb-8">Open Positions</h2>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.title}
              className="border border-gray-200 rounded-xl p-6 hover:border-[#635bff] hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#0a2540]">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.department}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm bg-[#f0f4f8] text-[#4a5568] px-3 py-1 rounded-full">{job.location}</span>
                  <span className="text-sm bg-[#f0f4f8] text-[#4a5568] px-3 py-1 rounded-full">{job.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-[#f6f9fc] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#0a2540] mb-8 text-center">Why Join Myncel?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-xl p-6 shadow-sm">
                <span className="text-3xl mb-4 block">{benefit.icon}</span>
                <h3 className="text-lg font-semibold text-[#0a2540] mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#0a2540] mb-4">Don't see a role that fits?</h2>
        <p className="text-gray-600 mb-6">
          We're always looking for talented people. Send us your resume at{' '}
          <a href="mailto:careers@myncel.com" className="text-[#635bff] hover:underline">
            careers@myncel.com
          </a>
        </p>
      </div>

      <Footer />
    </div>
  )
}