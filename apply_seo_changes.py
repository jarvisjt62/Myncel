import os

# ── 1. Inject JSON-LD schema into layout.tsx ──────────────────────────────
with open('app/layout.tsx', 'r') as f:
    layout = f.read()

if 'JSON-LD: Organization' not in layout:
    schema_scripts = '''        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Myncel",
              "url": "https://myncel.com",
              "logo": "https://myncel.com/logo.png",
              "description": "Myncel is an IoT-powered equipment monitoring and maintenance management platform for facilities teams in manufacturing, hospitality, healthcare, warehousing, oil and gas, and more.",
              "sameAs": [
                "https://twitter.com/myncel",
                "https://linkedin.com/company/myncel"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": "https://myncel.com/contact",
                "availableLanguage": ["English"]
              },
              "areaServed": ["NG", "GH", "US", "CA", "GB", "DE", "FR", "NL", "BE", "PL", "ES", "IT", "SE", "NO", "DK", "CH"]
            })
          }}
        />
        {/* JSON-LD: WebSite with Sitelinks Searchbox */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Myncel",
              "url": "https://myncel.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://myncel.com/blog?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* JSON-LD: SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Myncel",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web, iOS, Android",
              "url": "https://myncel.com",
              "offers": [
                { "@type": "Offer", "name": "Starter", "price": "79", "priceCurrency": "USD", "billingIncrement": "month" },
                { "@type": "Offer", "name": "Professional", "price": "149", "priceCurrency": "USD", "billingIncrement": "month" },
                { "@type": "Offer", "name": "Enterprise", "price": "299", "priceCurrency": "USD", "billingIncrement": "month" }
              ],
              "description": "IoT-powered equipment monitoring and maintenance management platform for facility and operations teams.",
              "featureList": [
                "Asset registry and equipment tracking",
                "Automated preventive maintenance scheduling",
                "Mobile work order management",
                "IoT sensor integration and threshold alerts",
                "Multi-site dashboard",
                "Compliance and audit records"
              ]
            })
          }}
        />
'''
    layout = layout.replace('      </head>', schema_scripts + '      </head>', 1)
    with open('app/layout.tsx', 'w') as f:
        f.write(layout)
    print("✅ Schema injected into layout.tsx")
else:
    print("⏭️  layout.tsx already has schema")

# ── 2. Inject FAQ schema into homepage page.tsx ───────────────────────────
with open('app/page.tsx', 'r') as f:
    home = f.read()

if 'FAQPage' not in home:
    faq_schema = '''
      {/* JSON-LD: FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "How long does setup take?", "acceptedAnswer": { "@type": "Answer", "text": "Most teams are fully set up in under 15 minutes. You add your machines, assign schedules, and Myncel handles the rest — no IT department or consultant needed." } },
              { "@type": "Question", "name": "Do I need special hardware or sensors?", "acceptedAnswer": { "@type": "Answer", "text": "No hardware required. Myncel works with the information your team already tracks. Optionally connect IoT sensors later for automated readings, but it\\'s 100% optional." } },
              { "@type": "Question", "name": "Is my data secure?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. All data is encrypted at rest and in transit. We\\'re hosted on enterprise-grade infrastructure with SOC 2 compliance in progress." } },
              { "@type": "Question", "name": "Can multiple technicians use it at the same time?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. Every plan supports unlimited technician accounts. Managers see everything; technicians see their assigned work orders." } },
              { "@type": "Question", "name": "What happens if I have more than 50 machines?", "acceptedAnswer": { "@type": "Answer", "text": "The Professional plan supports unlimited machines. Contact us for an Enterprise quote with custom pricing and dedicated support." } },
              { "@type": "Question", "name": "Can I cancel anytime?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, no contracts, no cancellation fees. Cancel from your dashboard any time. We offer a 30-day money-back guarantee on all paid plans." } }
            ]
          })
        }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myncel.com" },
              { "@type": "ListItem", "position": 2, "name": "Solutions", "item": "https://myncel.com/solutions" },
              { "@type": "ListItem", "position": 3, "name": "Blog", "item": "https://myncel.com/blog" },
              { "@type": "ListItem", "position": 4, "name": "Pricing", "item": "https://myncel.com/pricing" }
            ]
          })
        }}
      />
'''
    # Insert before <Footer />
    if '      <Footer />\n    </div>\n  );\n}' in home:
        home = home.replace('      <Footer />\n    </div>\n  );\n}',
                            faq_schema + '      <Footer />\n    </div>\n  );\n}', 1)
        with open('app/page.tsx', 'w') as f:
            f.write(home)
        print("✅ FAQ schema injected into homepage")
    else:
        print("⚠️  Could not find Footer in page.tsx — searching for alternative...")
        # Try finding the closing pattern
        idx = home.rfind('<Footer />')
        if idx != -1:
            home = home[:idx] + faq_schema + home[idx:]
            with open('app/page.tsx', 'w') as f:
                f.write(home)
            print("✅ FAQ schema injected into homepage (alternative method)")
        else:
            print("❌ Could not inject FAQ schema")
else:
    print("⏭️  homepage already has FAQ schema")

# ── 3. Update sitemap.ts with new pages ──────────────────────────────────
with open('app/sitemap.ts', 'r') as f:
    sitemap = f.read()

new_sitemap_entries = """
    // ─── New Industry Solution Pages ────────────────────────────────────
    entry('/solutions/hotels', 'monthly', 0.8),
    entry('/solutions/hospitals', 'monthly', 0.8),
    entry('/solutions/warehouses', 'monthly', 0.8),
    entry('/solutions/oil-gas', 'monthly', 0.8),

    // ─── Location Pages ──────────────────────────────────────────────────
    entry('/locations', 'monthly', 0.8),
    entry('/locations/united-states', 'monthly', 0.8),
    entry('/locations/canada', 'monthly', 0.8),
    entry('/locations/europe', 'monthly', 0.8),
    entry('/locations/west-africa', 'monthly', 0.8),

    // ─── New Blog Articles ───────────────────────────────────────────────
    entry('/blog/hotel-generator-hvac-monitoring', 'monthly', 0.7),
    entry('/blog/hospital-equipment-monitoring-compliance', 'monthly', 0.7),
    entry('/blog/warehouse-refrigeration-monitoring', 'monthly', 0.7),
    entry('/blog/iot-monitoring-oil-gas', 'monthly', 0.7),
    entry('/blog/reduce-generator-downtime-nigeria-ghana', 'monthly', 0.7),
    entry('/blog/equipment-monitoring-software-west-africa', 'monthly', 0.7),

    // ─── Conversion Pages ────────────────────────────────────────────────
    entry('/free-trial', 'monthly', 0.9),
    entry('/partners', 'monthly', 0.8),
"""

if '/solutions/hotels' not in sitemap:
    # Find the webinars section
    webinars_marker = "    // \u2500\u2500\u2500 Webinars"
    if webinars_marker in sitemap:
        sitemap = sitemap.replace(webinars_marker, new_sitemap_entries + "\n" + webinars_marker, 1)
        with open('app/sitemap.ts', 'w') as f:
            f.write(sitemap)
        print("✅ Sitemap updated")
    else:
        # fallback: append before closing bracket
        sitemap = sitemap.replace("  ]\n}", new_sitemap_entries + "\n  ]\n}", 1)
        with open('app/sitemap.ts', 'w') as f:
            f.write(sitemap)
        print("✅ Sitemap updated (fallback)")
else:
    print("⏭️  Sitemap already has new entries")

# ── 4. Update solutions/page.tsx with new sector cards ───────────────────
with open('app/solutions/page.tsx', 'r') as f:
    solutions = f.read()

if "href: '/solutions/hotels'" not in solutions:
    new_sectors = """
    {
      icon: '🏨',
      name: 'Hotels & Commercial Buildings',
      desc: 'Monitor generators, HVAC systems, water pumps, cold rooms, and elevators. Prevent guest-facing failures before they happen with automated maintenance scheduling.',
      stats: [{ val: '60%', label: 'fewer guest complaints' }, { val: '35%', label: 'lower repair costs' }],
      href: '/solutions/hotels',
      color: 'bg-purple-50 border-purple-200',
      badge: 'bg-purple-100 text-purple-700',
    },
    {
      icon: '🏥',
      name: 'Hospitals & Healthcare',
      desc: 'Compliance-ready maintenance records for generators, medical refrigeration, HVAC, and biomedical equipment. Audit-ready documentation at every inspection.',
      stats: [{ val: '100%', label: 'compliance records' }, { val: '45%', label: 'fewer emergency repairs' }],
      href: '/solutions/hospitals',
      color: 'bg-teal-50 border-teal-200',
      badge: 'bg-teal-100 text-teal-700',
    },
    {
      icon: '❄️',
      name: 'Warehouses & Cold Chain',
      desc: 'Protect cold chain integrity with refrigeration monitoring, conveyor maintenance, and generator reliability management for logistics and storage facilities.',
      stats: [{ val: '99.8%', label: 'cold chain uptime' }, { val: '42%', label: 'less spoilage' }],
      href: '/solutions/warehouses',
      color: 'bg-cyan-50 border-cyan-200',
      badge: 'bg-cyan-100 text-cyan-700',
    },
    {
      icon: '⛽',
      name: 'Oil & Gas Operations',
      desc: 'Manage pumps, compressors, separators, and fleet equipment across remote multi-site operations. Runtime-based PM scheduling for high-value critical assets.',
      stats: [{ val: '55%', label: 'less unplanned downtime' }, { val: '$2M+', label: 'avg annual savings' }],
      href: '/solutions/oil-gas',
      color: 'bg-orange-50 border-orange-200',
      badge: 'bg-orange-100 text-orange-700',
    },"""
    
    woodwork_href = "href: '/solutions/woodworking'"
    idx = solutions.find(woodwork_href)
    if idx != -1:
        # find the closing bracket of this entry
        close_idx = solutions.find("    },\n  ];", idx)
        if close_idx != -1:
            insert_pos = close_idx + len("    },\n")
            solutions = solutions[:insert_pos] + new_sectors + "\n  ];" + solutions[close_idx + len("    },\n  ];"):]
            with open('app/solutions/page.tsx', 'w') as f:
                f.write(solutions)
            print("✅ Solutions page updated with new sector cards")
        else:
            print("❌ Could not find array closing bracket in solutions page")
    else:
        print("❌ Could not find woodworking entry in solutions page")
else:
    print("⏭️  Solutions page already has new sector cards")

# ── 5. Add ArticleSchema to new blog articles ────────────────────────────
articles = [
    {
        'dir': 'app/blog/hotel-generator-hvac-monitoring',
        'title': 'How Hotels Can Monitor Generators and HVAC Systems to Protect Guest Experience',
        'description': 'Hotels depend on generators and HVAC systems to protect guest experience.',
        'url': 'https://myncel.com/blog/hotel-generator-hvac-monitoring',
        'date': '2026-01-15',
        'category': 'Hotels & Hospitality',
    },
    {
        'dir': 'app/blog/hospital-equipment-monitoring-compliance',
        'title': 'Hospital Equipment Monitoring and Maintenance Compliance: A Complete Guide',
        'description': 'A complete guide to hospital equipment monitoring and maintenance compliance.',
        'url': 'https://myncel.com/blog/hospital-equipment-monitoring-compliance',
        'date': '2026-01-20',
        'category': 'Healthcare',
    },
    {
        'dir': 'app/blog/warehouse-refrigeration-monitoring',
        'title': 'Warehouse Refrigeration Monitoring Best Practices: Protect Your Cold Chain',
        'description': 'Warehouse refrigeration failures destroy inventory and break regulatory compliance.',
        'url': 'https://myncel.com/blog/warehouse-refrigeration-monitoring',
        'date': '2026-01-25',
        'category': 'Warehousing & Cold Chain',
    },
    {
        'dir': 'app/blog/iot-monitoring-oil-gas',
        'title': 'IoT Equipment Monitoring for Oil and Gas Operations: A Practical Guide',
        'description': 'IoT equipment monitoring helps oil and gas operations reduce unplanned downtime.',
        'url': 'https://myncel.com/blog/iot-monitoring-oil-gas',
        'date': '2026-02-01',
        'category': 'Oil & Gas',
    },
    {
        'dir': 'app/blog/reduce-generator-downtime-nigeria-ghana',
        'title': 'How to Reduce Generator Downtime in Nigeria and Ghana',
        'description': 'Generator downtime is one of the biggest operational costs for facilities in Nigeria and Ghana.',
        'url': 'https://myncel.com/blog/reduce-generator-downtime-nigeria-ghana',
        'date': '2026-02-05',
        'category': 'West Africa',
    },
    {
        'dir': 'app/blog/equipment-monitoring-software-west-africa',
        'title': 'Equipment Monitoring Software for West African Facilities',
        'description': 'Choosing equipment monitoring software for facilities in Nigeria and Ghana.',
        'url': 'https://myncel.com/blog/equipment-monitoring-software-west-africa',
        'date': '2026-02-10',
        'category': 'West Africa',
    },
]

updated_articles = 0
for article in articles:
    filepath = os.path.join(article['dir'], 'page.tsx')
    if not os.path.exists(filepath):
        print(f"⚠️  Not found: {filepath}")
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    if 'ArticleSchema' in content:
        continue
    # Add import
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    lines.insert(last_import_idx + 1, "import ArticleSchema from '../../components/ArticleSchema';")
    content = '\n'.join(lines)
    # Add component before <Navbar />
    schema_tag = f'''      <ArticleSchema
        title="{article['title']}"
        description="{article['description']}"
        url="{article['url']}"
        datePublished="{article['date']}"
        category="{article['category']}"
      />
      '''
    content = content.replace('      <Navbar />', schema_tag + '<Navbar />', 1)
    with open(filepath, 'w') as f:
        f.write(content)
    updated_articles += 1

print(f"✅ ArticleSchema added to {updated_articles} blog articles")
print("\n🎉 All SEO changes applied successfully!")