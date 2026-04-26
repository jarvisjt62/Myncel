import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Blog — Maintenance Insights for Manufacturers',
  description: 'Practical guides, checklists, and expert advice on preventive maintenance, CMMS software, equipment uptime, and manufacturing best practices for small shop owners and plant managers.',
  alternates: { canonical: 'https://myncel.com/blog' },
  openGraph: {
    title: 'Myncel Blog — Maintenance Insights for Small Manufacturers',
    description: 'Free guides, checklists, and expert advice to help your maintenance team work smarter and prevent costly breakdowns.',
    url: 'https://myncel.com/blog',
  },
}

export default function Blog() {
  const featured = {
    title: 'The Hidden Cost of Reactive Maintenance: What Your Spreadsheet Isn\'t Telling You',
    excerpt: 'Most small manufacturers track maintenance in spreadsheets — or don\'t track it at all. Here\'s what that\'s really costing you, and how to fix it without a $50,000 CMMS implementation.',
    category: 'Maintenance Strategy',
    date: 'December 18, 2025',
    readTime: '8 min read',
    author: 'Marcus Johnson',
    authorRole: 'Head of Customer Success',
    slug: 'hidden-cost-reactive-maintenance',
    color: 'from-violet-500 to-indigo-600',
  };

  const posts = [
    {
      title: 'How to Build a Preventive Maintenance Program from Scratch',
      excerpt: 'A step-by-step guide for maintenance managers who are starting a formal PM program for the first time. No consultants required.',
      category: 'How-To Guides',
      date: 'December 12, 2025',
      readTime: '12 min read',
      author: 'Sarah Chen',
      color: 'bg-blue-500',
      slug: 'preventive-maintenance-program',
    },
    {
      title: '10 Maintenance KPIs Every Plant Manager Should Track',
      excerpt: 'MTBF, MTTR, OEE, schedule compliance — here\'s what each metric means and how to start tracking them without complex software.',
      category: 'Analytics & Metrics',
      date: 'December 5, 2025',
      readTime: '6 min read',
      author: 'David Park',
      color: 'bg-emerald-500',
      slug: 'maintenance-kpis-plant-manager',
    },
    {
      title: 'CNC Machine Maintenance Checklist: Complete Guide for 2026',
      excerpt: 'Everything your team needs to keep CNC machines running at peak performance — daily, weekly, monthly, and annual maintenance tasks.',
      category: 'Equipment Guides',
      date: 'November 28, 2025',
      readTime: '15 min read',
      author: 'Tom Reyes',
      color: 'bg-amber-500',
      slug: 'cnc-machine-maintenance-checklist',
    },
    {
      title: 'From Spreadsheet to CMMS: A Migration Story',
      excerpt: 'How one Michigan fabrication shop moved 5 years of Excel maintenance history into Myncel in a single afternoon — and what they learned.',
      category: 'Customer Stories',
      date: 'November 21, 2025',
      readTime: '5 min read',
      author: 'Marcus Johnson',
      color: 'bg-rose-500',
      slug: 'spreadsheet-to-cmms-migration',
    },
    {
      title: 'HACCP Maintenance Records: What You Need and How to Store Them',
      excerpt: 'Food manufacturers face unique compliance requirements. Here\'s exactly what maintenance records FDA and USDA auditors look for.',
      category: 'Compliance',
      date: 'November 14, 2025',
      readTime: '9 min read',
      author: 'Linda Torres',
      color: 'bg-teal-500',
      slug: 'haccp-maintenance-records',
    },
    {
      title: 'The Difference Between Preventive and Predictive Maintenance',
      excerpt: 'Preventive vs. predictive vs. reactive maintenance — what each approach costs, where each works best, and how to combine them.',
      category: 'Maintenance Strategy',
      date: 'November 7, 2025',
      readTime: '7 min read',
      author: 'Sarah Chen',
      color: 'bg-indigo-500',
      slug: 'preventive-vs-predictive-maintenance',
    },
    {
      title: 'How to Calculate the True ROI of Your CMMS',
      excerpt: 'Before and after metrics, avoided downtime costs, labor efficiency — a practical formula for calculating the exact return on your maintenance software investment.',
      category: 'Analytics & Metrics',
      date: 'October 31, 2025',
      readTime: '10 min read',
      author: 'David Park',
      color: 'bg-purple-500',
      slug: 'cmms-roi-calculation',
    },
    {
      title: 'Hydraulic System Maintenance: A Complete PM Checklist',
      excerpt: 'Hydraulic failures are expensive and dangerous. This complete maintenance guide covers daily inspections, fluid analysis, seal replacement, and more.',
      category: 'Equipment Guides',
      date: 'October 24, 2025',
      readTime: '11 min read',
      author: 'Tom Reyes',
      color: 'bg-orange-500',
      slug: 'hydraulic-system-maintenance',
    },
  ];

  const categories = ['All', 'Maintenance Strategy', 'How-To Guides', 'Equipment Guides', 'Analytics & Metrics', 'Customer Stories', 'Compliance'];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#f6f9fc] border-b border-[#e6ebf1] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <span className="section-label">Blog</span>
            <h1 className="text-4xl font-bold text-[#0a2540] mb-4">Maintenance insights for manufacturers</h1>
            <p className="text-lg text-[#425466]">Practical guides, industry research, and expert advice to help your maintenance team work smarter.</p>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="border-b border-[#e6ebf1] bg-white sticky top-[65px] z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((cat, i) => (
              <button key={cat} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${i === 0 ? 'bg-[#635bff] text-white' : 'text-[#425466] hover:bg-[#f6f9fc]'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured post */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className={`bg-gradient-to-r ${featured.color} rounded-2xl p-8 md:p-12 text-white relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10">
              <div className="w-96 h-96 rounded-full bg-white absolute -top-20 -right-20" />
            </div>
            <div className="relative max-w-2xl">
              <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">{featured.category}</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{featured.title}</h2>
              <p className="text-purple-100 leading-relaxed mb-6">{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-purple-200">{featured.author} · {featured.date} · {featured.readTime}</div>
                <Link href={`/blog/${featured.slug}`} className="bg-white text-[#635bff] font-semibold px-5 py-2 rounded-lg text-sm hover:bg-purple-50 transition-colors">
                  Read article →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Post grid */}
      <section className="pb-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <Link key={i} href={`/blog/${post.slug}`} className="group border border-[#e6ebf1] rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                {/* Color bar */}
                <div className={`h-1.5 ${post.color}`} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#635bff] bg-[#f0f4ff] px-2.5 py-1 rounded-full">{post.category}</span>
                    <span className="text-xs text-[#8898aa]">{post.readTime}</span>
                  </div>
                  <h3 className="font-bold text-[#0a2540] leading-tight mb-2 group-hover:text-[#635bff] transition-colors">{post.title}</h3>
                  <p className="text-sm text-[#425466] leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#f6f9fc]">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${post.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {post.author.charAt(0)}
                      </div>
                      <span className="text-xs text-[#8898aa]">{post.author}</span>
                    </div>
                    <span className="text-xs text-[#8898aa]">{post.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          <div className="text-center mt-10">
            <button className="border border-[#e6ebf1] text-[#425466] px-8 py-3 rounded-lg text-sm font-medium hover:bg-[#f6f9fc] hover:border-[#c9d7e3] transition-all">
              Load more articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-[#f6f9fc] border-t border-[#e6ebf1]">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-2">Get maintenance insights in your inbox</h2>
          <p className="text-[#425466] text-sm mb-6">Weekly articles, checklists, and tips for maintenance managers. No spam, unsubscribe anytime.</p>
          <div className="flex gap-3">
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
            <button className="bg-[#635bff] text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors whitespace-nowrap">Subscribe →</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}