import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// Documentation data structure - same as in [slug]/page.tsx
const docCategories = {
  'getting-started': {
    title: 'Getting Started',
    icon: '🚀',
    description: 'Get up and running with Myncel in minutes. These guides cover the essentials of setting up your account, adding equipment, and creating your first maintenance schedules.',
    color: 'violet',
    articles: {
      'quick-start': { title: 'Quick Start Guide (15 minutes)', time: '5 min', popular: true },
      'first-machine': { title: 'Adding your first machine', time: '3 min', popular: true },
      'first-schedule': { title: 'Setting up your first schedule', time: '4 min' },
      'inviting-team': { title: 'Inviting your team', time: '2 min' },
      'dashboard-overview': { title: 'Understanding the dashboard', time: '5 min' },
    },
  },
  'equipment': {
    title: 'Equipment Management',
    icon: '⚙️',
    description: 'Learn how to manage your equipment inventory, track service history, and organize your facility.',
    color: 'blue',
    articles: {
      'adding-editing': { title: 'Adding and editing equipment', time: '4 min' },
      'photos-manuals': { title: 'Uploading equipment photos & manuals', time: '3 min' },
      'service-history': { title: 'Tracking service history', time: '5 min' },
      'facility-mapping': { title: 'Equipment location & facility mapping', time: '6 min' },
      'warranty-alerts': { title: 'Setting warranty expiry alerts', time: '3 min' },
    },
  },
  'schedules': {
    title: 'Schedules & Tasks',
    icon: '📅',
    description: 'Create and manage maintenance schedules to automate your preventive maintenance program.',
    color: 'emerald',
    articles: {
      'creating-schedule': { title: 'Creating a maintenance schedule', time: '5 min', popular: true },
      'calendar-vs-hour': { title: 'Calendar vs. hour-based schedules', time: '4 min' },
      'multiple-machines': { title: 'Scheduling for multiple machines', time: '6 min' },
      'seasonal-scheduling': { title: 'Seasonal and shutdown scheduling', time: '5 min' },
      'schedule-templates': { title: 'Using schedule templates', time: '4 min' },
    },
  },
  'work-orders': {
    title: 'Work Orders',
    icon: '📝',
    description: 'Manage work orders from creation to completion, including mobile access and documentation.',
    color: 'amber',
    articles: {
      'creating-assigning': { title: 'Creating and assigning work orders', time: '4 min', popular: true },
      'completing-mobile': { title: 'Completing a work order (mobile)', time: '3 min', popular: true },
      'adding-photos': { title: 'Adding photos to work orders', time: '2 min' },
      'priority-levels': { title: 'Work order priority levels', time: '3 min' },
      'work-order-history': { title: 'Viewing work order history', time: '4 min' },
    },
  },
  'alerts': {
    title: 'Alerts & Notifications',
    icon: '🔔',
    description: 'Configure email, SMS, and in-app notifications to stay informed about maintenance activities.',
    color: 'rose',
    articles: {
      'email-alerts': { title: 'Setting up email alerts', time: '3 min' },
      'sms-notifications': { title: 'Setting up SMS notifications', time: '4 min' },
      'escalations': { title: 'Configuring overdue escalations', time: '5 min' },
      'team-routing': { title: 'Team notification routing', time: '4 min' },
      'digest-emails': { title: 'Daily and weekly digest emails', time: '3 min' },
    },
  },
  'analytics': {
    title: 'Analytics & Reports',
    icon: '📊',
    description: 'Track key metrics, generate reports, and share insights with your team and stakeholders.',
    color: 'indigo',
    articles: {
      'dashboard-metrics': { title: 'Understanding your dashboard metrics', time: '6 min' },
      'exporting-reports': { title: 'Exporting reports to PDF & CSV', time: '3 min' },
      'tracking-uptime': { title: 'Tracking equipment uptime', time: '5 min' },
      'calculating-costs': { title: 'Calculating maintenance costs', time: '7 min' },
      'sharing-reports': { title: 'Sharing reports with management', time: '3 min' },
    },
  },
  'inventory': {
    title: 'Parts Inventory',
    icon: '🔧',
    description: 'Manage spare parts inventory, track usage, and automate reordering.',
    color: 'teal',
    articles: {
      'adding-parts': { title: 'Adding parts to your inventory', time: '4 min' },
      'min-stock-levels': { title: 'Setting minimum stock levels', time: '3 min' },
      'linking-parts': { title: 'Linking parts to equipment', time: '4 min' },
      'auto-deduction': { title: 'Parts auto-deduction on work orders', time: '5 min' },
      'suppliers': { title: 'Managing suppliers', time: '4 min' },
    },
  },
  'api': {
    title: 'API & Integrations',
    icon: '⚡',
    description: 'Integrate Myncel with your existing systems using our API and third-party connectors.',
    color: 'slate',
    articles: {
      'api-overview': { title: 'API overview & authentication', time: '8 min' },
      'slack-integration': { title: 'Connecting Slack notifications', time: '5 min' },
      'zapier-integration': { title: 'Zapier integration guide', time: '6 min' },
      'quickbooks-export': { title: 'Exporting to QuickBooks', time: '5 min' },
      'webhooks': { title: 'Webhook setup & events', time: '8 min' },
    },
  },
}

type Article = {
  title: string
  time: string
  popular?: boolean
}

type Category = {
  title: string
  icon: string
  description: string
  color: string
  articles: Record<string, Article>
}

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
}

// Generate static paths
export async function generateStaticParams() {
  return Object.keys(docCategories).map((slug) => ({ category: slug }))
}

// Category Page Component
export default function DocCategoryPage({ params }: { params: { category: string } }) {
  const category = docCategories[params.category as keyof typeof docCategories]
  
  if (!category) {
    notFound()
  }

  const colors = colorClasses[category.color]
  const articles = Object.entries(category.articles)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="bg-[#0a2540] py-12">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/docs" className="text-[#8898aa] hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li className="text-[#4a5568]">/</li>
              <li className="text-white font-medium">{category.title}</li>
            </ol>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{category.icon}</span>
            <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text}`}>
              {articles.length} articles
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{category.title}</h1>
          <p className="text-[#8898aa] max-w-2xl">{category.description}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Articles List */}
        <div className="space-y-3">
          {articles.map(([slug, article]) => (
            <Link
              key={slug}
              href={`/docs/${params.category}/${slug}`}
              className="block bg-white border border-[#e6ebf1] rounded-xl p-5 hover:border-[#635bff] hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-[#0a2540] group-hover:text-[#635bff] transition-colors">
                      {article.title}
                    </h3>
                    {'popular' in article && article.popular && (
                      <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8898aa]">{article.time} read</p>
                </div>
                <svg className="w-5 h-5 text-[#c0ccda] group-hover:text-[#635bff] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Back to Docs */}
        <div className="mt-12 pt-8 border-t border-[#e6ebf1]">
          <Link href="/docs" className="text-[#635bff] hover:underline flex items-center gap-1">
            ← Back to all documentation
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}