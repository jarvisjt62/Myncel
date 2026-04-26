'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type MegaMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ProductsMenu = ({ isOpen, onClose }: MegaMenuProps) => (
  <div className={`absolute top-full left-0 w-screen max-w-5xl bg-white border border-[#e6ebf1] rounded-2xl shadow-2xl mt-2 transition-all duration-200 z-50 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
    style={{ left: '50%', transform: isOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)' }}>
    <div className="p-6 grid grid-cols-4 gap-6">
      {/* Column 1 */}
      <div>
        <div className="text-xs font-bold text-[#8898aa] uppercase tracking-wider mb-3">Monitor</div>
        <div className="space-y-3">
          {[
            { name: 'Equipment Monitoring', desc: 'Real-time machine health tracking', icon: '⚙️', href: '/products/monitoring' },
            { name: 'Sensor Integration', desc: 'Connect IoT sensors & meters', icon: '📡', href: '/products/sensors' },
            { name: 'Downtime Tracking', desc: 'Log and analyze all stoppages', icon: '⏱️', href: '/products/downtime' },
            { name: 'Condition Reports', desc: 'Auto-generated machine health PDFs', icon: '📋', href: '/products/reports' },
          ].map(item => (
            <Link key={item.name} href={item.href} onClick={onClose} className="flex items-start gap-2.5 group">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#635bff] group-hover:underline">{item.name}</div>
                <div className="text-xs text-[#8898aa]">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Column 2 */}
      <div>
        <div className="text-xs font-bold text-[#8898aa] uppercase tracking-wider mb-3">Maintain</div>
        <div className="space-y-3">
          {[
            { name: 'Smart Scheduling', desc: 'Auto-calculate maintenance due dates', icon: '📅', href: '/products/scheduling' },
            { name: 'Work Orders', desc: 'Digital work order management', icon: '📝', href: '/products/work-orders' },
            { name: 'Preventive PM', desc: 'Preventive maintenance programs', icon: '🛡️', href: '/products/preventive' },
            { name: 'Parts Inventory', desc: 'Track spare parts & reorder points', icon: '🔧', href: '/products/inventory' },
          ].map(item => (
            <Link key={item.name} href={item.href} onClick={onClose} className="flex items-start gap-2.5 group">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#635bff] group-hover:underline">{item.name}</div>
                <div className="text-xs text-[#8898aa]">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Column 3 */}
      <div>
        <div className="text-xs font-bold text-[#8898aa] uppercase tracking-wider mb-3">Analyze</div>
        <div className="space-y-3">
          {[
            { name: 'Analytics Dashboard', desc: 'KPIs, trends & cost breakdowns', icon: '📊', href: '/products/analytics' },
            { name: 'Downtime Reports', desc: 'Root cause & cost analysis', icon: '📉', href: '/products/downtime-reports' },
            { name: 'Team Performance', desc: 'Technician productivity metrics', icon: '👥', href: '/products/team' },
            { name: 'Alerts & Notifications', desc: 'Email, SMS & in-app alerts', icon: '🔔', href: '/products/alerts' },
          ].map(item => (
            <Link key={item.name} href={item.href} onClick={onClose} className="flex items-start gap-2.5 group">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#635bff] group-hover:underline">{item.name}</div>
                <div className="text-xs text-[#8898aa]">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Column 4 - Featured */}
      <div className="bg-gradient-to-br from-[#f0f4ff] to-[#f8f0ff] rounded-xl p-4">
        <div className="text-xs font-bold text-[#635bff] uppercase tracking-wider mb-3">New Feature</div>
        <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        </div>
        <h4 className="font-bold text-[#0a2540] mb-1">Mobile App</h4>
        <p className="text-xs text-[#425466] mb-3 leading-relaxed">Technicians complete work orders from any smartphone. No app install needed.</p>
        <Link href="/products/mobile" onClick={onClose} className="text-xs font-semibold text-[#635bff] hover:underline">
          Learn more →
        </Link>
      </div>
    </div>
  </div>
);

const SolutionsMenu = ({ isOpen, onClose }: MegaMenuProps) => (
  <div className={`absolute top-full bg-white border border-[#e6ebf1] rounded-2xl shadow-2xl mt-2 transition-all duration-200 z-50 w-[680px] ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
    style={{ left: '50%', transform: isOpen ? 'translateX(-30%) translateY(0)' : 'translateX(-30%) translateY(-8px)' }}>
    <div className="p-6 grid grid-cols-2 gap-6">
      <div>
        <div className="text-xs font-bold text-[#8898aa] uppercase tracking-wider mb-3">By Industry</div>
        <div className="space-y-3">
          {[
            { name: 'Metal Fabrication', desc: 'CNC, press brakes, welding equipment', icon: '🔩', href: '/solutions/metal-fabrication' },
            { name: 'Plastics & Injection Molding', desc: 'Molding machines, extruders, dryers', icon: '🏭', href: '/solutions/plastics' },
            { name: 'Food & Beverage', desc: 'HACCP compliance, food-safe PM', icon: '🍽️', href: '/solutions/food-beverage' },
            { name: 'Auto Parts Manufacturing', desc: 'Assembly lines, stamping, testing', icon: '🚗', href: '/solutions/auto-parts' },
            { name: 'Electronics Assembly', desc: 'SMT lines, wave soldering, AOI', icon: '💡', href: '/solutions/electronics' },
            { name: 'Woodworking & Furniture', desc: 'Saws, routers, finishing equipment', icon: '🪵', href: '/solutions/woodworking' },
          ].map(item => (
            <Link key={item.name} href={item.href} onClick={onClose} className="flex items-start gap-2.5 group">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#635bff] group-hover:underline">{item.name}</div>
                <div className="text-xs text-[#8898aa]">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-[#8898aa] uppercase tracking-wider mb-3">By Team Size</div>
        <div className="space-y-3 mb-5">
          {[
            { name: 'Small Shops (1–3 machines)', desc: 'Get started in 15 minutes', icon: '🏠', href: '/solutions/small' },
            { name: 'Growing Operations (4–20)', desc: 'Scale your PM program', icon: '📈', href: '/solutions/growing' },
            { name: 'Mid-size Plants (20–100)', desc: 'Multi-facility management', icon: '🏗️', href: '/solutions/midsize' },
          ].map(item => (
            <Link key={item.name} href={item.href} onClick={onClose} className="flex items-start gap-2.5 group">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#635bff] group-hover:underline">{item.name}</div>
                <div className="text-xs text-[#8898aa]">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-[#f6f9fc] rounded-xl p-4 border border-[#e6ebf1]">
          <p className="text-xs font-semibold text-[#0a2540] mb-1">Not sure where to start?</p>
          <p className="text-xs text-[#425466] mb-2">Take our 2-min quiz to find the right plan for your shop.</p>
          <Link href="/solutions" onClick={onClose} className="text-xs font-semibold text-[#635bff] hover:underline">Find my solution →</Link>
        </div>
      </div>
    </div>
  </div>
);

const ResourcesMenu = ({ isOpen, onClose }: MegaMenuProps) => (
  <div className={`absolute top-full bg-white border border-[#e6ebf1] rounded-2xl shadow-2xl mt-2 transition-all duration-200 z-50 w-[580px] ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
    style={{ right: '0', left: 'auto' }}>
    <div className="p-6 grid grid-cols-2 gap-6">
      <div>
        <div className="text-xs font-bold text-[#8898aa] uppercase tracking-wider mb-3">Learn</div>
        <div className="space-y-3">
          {[
            { name: 'Documentation', desc: 'Setup guides & API reference', icon: '📖', href: '/docs' },
            { name: 'Blog', desc: 'Maintenance tips & industry news', icon: '✍️', href: '/blog' },
            { name: 'Customer Stories', desc: 'See how others use Myncel', icon: '⭐', href: '/customers' },
            { name: 'Maintenance Guides', desc: 'Free PM templates & checklists', icon: '📋', href: '/guides' },
            { name: 'Webinars', desc: 'Live training & recorded sessions', icon: '🎥', href: '/webinars' },
          ].map(item => (
            <Link key={item.name} href={item.href} onClick={onClose} className="flex items-start gap-2.5 group">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#635bff] group-hover:underline">{item.name}</div>
                <div className="text-xs text-[#8898aa]">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-[#8898aa] uppercase tracking-wider mb-3">Support</div>
        <div className="space-y-3 mb-4">
          {[
            { name: 'Help Center', desc: 'FAQs and troubleshooting', icon: '💬', href: '/help' },
            { name: 'Contact Support', desc: 'Talk to our team', icon: '📞', href: '/contact' },
            { name: 'System Status', desc: '99.99% uptime guarantee', icon: '🟢', href: '/status' },
            { name: 'Changelog', desc: "What's new in Myncel", icon: '🚀', href: '/changelog' },
          ].map(item => (
            <Link key={item.name} href={item.href} onClick={onClose} className="flex items-start gap-2.5 group">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#635bff] group-hover:underline">{item.name}</div>
                <div className="text-xs text-[#8898aa]">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-xl p-4 text-white">
          <p className="text-xs font-bold mb-1">📘 Free Resource</p>
          <p className="text-xs text-purple-200 mb-2 leading-relaxed">Download our Ultimate PM Checklist — used by 200+ manufacturers.</p>
          <Link href="/guides" onClick={onClose} className="text-xs font-semibold text-white hover:text-purple-200">
            Download free →
          </Link>
        </div>
      </div>
    </div>
  </div>
);

type MobileMenuSectionProps = {
  title: string;
  items: { label: string; href: string }[];
  onClose: () => void;
};

const MobileMenuSection = ({ title, items, onClose }: MobileMenuSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-[#f0f4f8]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-[#0a2540] hover:bg-[#f6f9fc] rounded-lg transition-colors"
      >
        {title}
        <svg className={`w-4 h-4 text-[#8898aa] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="pl-4 pb-2 space-y-0.5">
          {items.map(item => (
            <Link 
              key={item.label} 
              href={item.href} 
              onClick={onClose}
              className="block px-3 py-2 rounded-lg text-sm text-[#425466] hover:text-[#635bff] hover:bg-[#f6f9fc] transition-colors"
              dangerouslySetInnerHTML={{ __html: item.label }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (menu: string) => setOpenMenu(openMenu === menu ? null : menu);

  return (
    <nav className="stripe-nav" ref={navRef}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-bold text-xl text-[#0a2540] flex-shrink-0">
          <img src="/logo.png" alt="Myncel" className="w-8 h-8 sm:w-10 sm:h-10" />
          <span>Myncel</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1 relative">
          {/* Products */}
          <div className="relative">
            <button
              onClick={() => toggle('products')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${openMenu === 'products' ? 'text-[#635bff] bg-[#f0f4ff]' : 'text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]'}`}
            >
              Products
              <svg className={`w-3.5 h-3.5 transition-transform ${openMenu === 'products' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <ProductsMenu isOpen={openMenu === 'products'} onClose={() => setOpenMenu(null)} />
          </div>

          {/* Solutions */}
          <div className="relative">
            <button
              onClick={() => toggle('solutions')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${openMenu === 'solutions' ? 'text-[#635bff] bg-[#f0f4ff]' : 'text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]'}`}
            >
              Solutions
              <svg className={`w-3.5 h-3.5 transition-transform ${openMenu === 'solutions' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <SolutionsMenu isOpen={openMenu === 'solutions'} onClose={() => setOpenMenu(null)} />
          </div>

          {/* Resources */}
          <div className="relative">
            <button
              onClick={() => toggle('resources')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${openMenu === 'resources' ? 'text-[#635bff] bg-[#f0f4ff]' : 'text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]'}`}
            >
              Resources
              <svg className={`w-3.5 h-3.5 transition-transform ${openMenu === 'resources' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <ResourcesMenu isOpen={openMenu === 'resources'} onClose={() => setOpenMenu(null)} />
          </div>

          <Link href="/pricing" className="px-3 py-2 rounded-lg text-sm font-medium text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc] transition-colors">
            Pricing
          </Link>
          <Link href="/customers" className="px-3 py-2 rounded-lg text-sm font-medium text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc] transition-colors">
            Customers
          </Link>
          <Link href="/about" className="px-3 py-2 rounded-lg text-sm font-medium text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc] transition-colors">
            Company
          </Link>
        </div>

        {/* Right CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/signin" className="text-sm font-medium text-[#425466] hover:text-[#0a2540] transition-colors px-3 py-2 rounded-lg hover:bg-[#f6f9fc]">
            Sign in
          </Link>
          <Link href="/contact" className="text-sm font-medium text-[#425466] border border-[#e6ebf1] px-4 py-2 rounded-lg hover:bg-[#f6f9fc] hover:border-[#c9d7e3] transition-all">
            Contact sales
          </Link>
          <Link href="/signup" className="btn-stripe-primary text-sm">
            Get started →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg text-[#425466] hover:bg-[#f6f9fc]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#e6ebf1] bg-white max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {/* Products Section */}
            <MobileMenuSection title="Products" items={[
              { label: 'Equipment Monitoring', href: '/products/monitoring' },
              { label: 'Smart Scheduling', href: '/products/scheduling' },
              { label: 'Work Orders', href: '/products/work-orders' },
              { label: 'Parts Inventory', href: '/products/inventory' },
              { label: 'Analytics', href: '/products/analytics' },
            ]} onClose={() => setMobileOpen(false)} />
            
            {/* Solutions Section */}
            <MobileMenuSection title="Solutions" items={[
              { label: 'Metal Fabrication', href: '/solutions/metal-fabrication' },
              { label: 'Plastics & Molding', href: '/solutions/plastics' },
              { label: 'Food & Beverage', href: '/solutions/food-beverage' },
              { label: 'Small Shops', href: '/solutions/small' },
              { label: 'Mid-size Plants', href: '/solutions/midsize' },
            ]} onClose={() => setMobileOpen(false)} />
            
            {/* Resources Section */}
            <MobileMenuSection title="Resources" items={[
              { label: 'Documentation', href: '/docs' },
              { label: 'Blog', href: '/blog' },
              { label: 'Customer Stories', href: '/customers' },
              { label: 'Guides', href: '/guides' },
            ]} onClose={() => setMobileOpen(false)} />
            
            {/* Quick Links */}
            <div className="border-t border-[#e6ebf1] pt-3 mt-3 space-y-1">
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]">Pricing</Link>
              <Link href="/about" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]">About</Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]">Contact</Link>
            </div>
            
            {/* CTA Buttons */}
            <div className="border-t border-[#e6ebf1] pt-4 mt-3 flex flex-col gap-2">
              <Link href="/signin" onClick={() => setMobileOpen(false)} className="w-full text-center py-3 border border-[#e6ebf1] rounded-lg text-sm font-medium text-[#425466] hover:bg-[#f6f9fc] transition-colors">Sign in</Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="w-full text-center py-3 bg-[#635bff] rounded-lg text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors">Get started →</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}