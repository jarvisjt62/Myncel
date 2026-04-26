import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Equipment Lifespan Guide — Myncel',
  description: 'Learn how to extend the lifespan of your manufacturing equipment with proper maintenance schedules and best practices.',
}

const equipmentData = [
  {
    category: 'CNC Machines',
    icon: '⚙️',
    avgLifespan: '15-25 years',
    keyFactors: ['Spindle maintenance', 'Coolant system care', 'Way lubrication', 'Ball screw inspection'],
    maintenanceTips: [
      'Daily: Check coolant levels and way lubrication',
      'Weekly: Clean chips from way covers and check hydraulic fluids',
      'Monthly: Inspect spindle runout and backlash',
      'Quarterly: Replace coolant and filters',
      'Annually: Professional calibration and ball screw inspection'
    ]
  },
  {
    category: 'Hydraulic Presses',
    icon: '🔧',
    avgLifespan: '20-30 years',
    keyFactors: ['Hydraulic fluid quality', 'Seal condition', 'Ram alignment', 'Pressure calibration'],
    maintenanceTips: [
      'Daily: Check fluid levels and inspect for leaks',
      'Weekly: Monitor operating pressure and temperature',
      'Monthly: Inspect seals and hoses for wear',
      'Quarterly: Change hydraulic fluid and filters',
      'Annually: Full pressure testing and cylinder inspection'
    ]
  },
  {
    category: 'Air Compressors',
    icon: '💨',
    avgLifespan: '10-15 years',
    keyFactors: ['Air filter condition', 'Oil quality', 'Drainage system', 'Pressure settings'],
    maintenanceTips: [
      'Daily: Drain moisture from tank, check oil level',
      'Weekly: Clean air intake filters',
      'Monthly: Inspect belts and pulleys',
      'Quarterly: Change oil and filter',
      'Annually: Professional inspection of valves and pressure vessels'
    ]
  },
  {
    category: 'Conveyor Systems',
    icon: '🔄',
    avgLifespan: '15-20 years',
    keyFactors: ['Belt tension', 'Bearing condition', 'Motor alignment', 'Tracking accuracy'],
    maintenanceTips: [
      'Daily: Visual inspection for wear and damage',
      'Weekly: Check belt tension and tracking',
      'Monthly: Lubricate bearings and inspect rollers',
      'Quarterly: Motor and drive inspection',
      'Annually: Replace worn belts and bearings'
    ]
  },
  {
    category: 'Industrial Motors',
    icon: '⚡',
    avgLifespan: '15-25 years',
    keyFactors: ['Bearing condition', 'Cooling system', 'Electrical connections', 'Load balance'],
    maintenanceTips: [
      'Daily: Monitor temperature and vibration',
      'Weekly: Check for unusual noise or vibration',
      'Monthly: Clean cooling fins and check connections',
      'Quarterly: Measure insulation resistance',
      'Annually: Professional motor analysis and bearing replacement'
    ]
  },
  {
    category: 'Injection Molding Machines',
    icon: '🏭',
    avgLifespan: '20-30 years',
    keyFactors: ['Barrel wear', 'Screw condition', 'Mold alignment', 'Hydraulic system'],
    maintenanceTips: [
      'Daily: Check barrel temperatures and hydraulic fluid',
      'Weekly: Inspect nozzle and check ring',
      'Monthly: Clean hopper and inspect screw tip',
      'Quarterly: Hydraulic system inspection',
      'Annually: Barrel and screw inspection, mold maintenance'
    ]
  }
]

const lifespanFactors = [
  { factor: 'Preventive Maintenance', impact: '+40%', description: 'Regular scheduled maintenance extends equipment life significantly' },
  { factor: 'Operating Environment', impact: '+25%', description: 'Clean, climate-controlled facilities reduce wear' },
  { factor: 'Operator Training', impact: '+20%', description: 'Properly trained operators reduce misuse and accidents' },
  { factor: 'Quality Spare Parts', impact: '+15%', description: 'Using OEM or quality aftermarket parts ensures compatibility' },
  { factor: 'Vibration Analysis', impact: '+30%', description: 'Early detection of bearing and alignment issues' },
  { factor: 'Oil Analysis', impact: '+25%', description: 'Monitoring fluid condition prevents internal damage' },
]

export default function EquipmentLifespanGuide() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1e3a5f] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/guides" className="text-[#635bff] hover:text-white transition-colors text-sm mb-4 inline-block">
            ← Back to Guides
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Equipment Lifespan Guide
          </h1>
          <p className="text-xl text-[#8898aa] mb-8 max-w-2xl">
            Extend the life of your manufacturing equipment with proper maintenance schedules, best practices, and predictive monitoring strategies.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-green-100 text-green-700 text-sm font-medium px-4 py-2 rounded-full">
              ✅ Free Resource
            </span>
            <span className="bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full">
              📊 Data-Driven
            </span>
            <span className="bg-purple-100 text-purple-700 text-sm font-medium px-4 py-2 rounded-full">
              🔄 Updated 2024
            </span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="bg-[#f6f9fc] py-12 border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[#635bff]">30%</div>
              <div className="text-sm text-gray-600 mt-1">Longer equipment life with PM</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[#635bff]">$50K+</div>
              <div className="text-sm text-gray-600 mt-1">Average savings per machine</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[#635bff]">70%</div>
              <div className="text-sm text-gray-600 mt-1">Failures preventable with PM</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[#635bff]">15+</div>
              <div className="text-sm text-gray-600 mt-1">Years average lifespan gain</div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Categories */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#0a2540] mb-4 text-center">
          Equipment Lifespan by Category
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Each equipment type has unique maintenance requirements that directly impact its operational lifespan.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {equipmentData.map((equipment) => (
            <div key={equipment.category} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{equipment.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-[#0a2540]">{equipment.category}</h3>
                  <span className="text-[#635bff] font-semibold">{equipment.avgLifespan}</span> average lifespan
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Lifespan Factors</h4>
                <div className="flex flex-wrap gap-2">
                  {equipment.keyFactors.map((factor) => (
                    <span key={factor} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Maintenance Schedule</h4>
                <ul className="space-y-2">
                  {equipment.maintenanceTips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifespan Impact Factors */}
      <div className="bg-[#0a2540] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Factors That Impact Equipment Lifespan
          </h2>
          <p className="text-[#8898aa] text-center mb-12 max-w-2xl mx-auto">
            Understanding these factors helps you prioritize maintenance investments and maximize equipment ROI.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lifespanFactors.map((item) => (
              <div key={item.factor} className="bg-[#1e3a5f] rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white">{item.factor}</h3>
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {item.impact}
                  </span>
                </div>
                <p className="text-sm text-[#8898aa]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#0a2540] mb-8 text-center">
          Extending Equipment Lifespan: Best Practices
        </h2>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-xl font-bold text-[#0a2540] mb-3">1. Implement a Preventive Maintenance Program</h3>
            <p className="text-gray-600 mb-4">
              Preventive maintenance is the single most effective way to extend equipment life. Schedule regular inspections, cleaning, lubrication, and part replacements before failures occur.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Create maintenance checklists for each equipment type</li>
              <li>• Schedule maintenance based on manufacturer recommendations and operating hours</li>
              <li>• Track all maintenance activities in a centralized system</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-xl font-bold text-[#0a2540] mb-3">2. Train Operators Properly</h3>
            <p className="text-gray-600 mb-4">
              Operator error accounts for up to 30% of premature equipment failures. Proper training reduces misuse and helps operators identify early warning signs.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Provide comprehensive onboarding for new operators</li>
              <li>• Document standard operating procedures (SOPs)</li>
              <li>• Encourage operators to report unusual behavior immediately</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-[#0a2540] mb-3">3. Monitor Equipment Conditions</h3>
            <p className="text-gray-600 mb-4">
              Condition monitoring allows you to detect problems early and address them before they cause major damage or unplanned downtime.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Use vibration analysis for rotating equipment</li>
              <li>• Perform regular oil analysis for hydraulic systems</li>
              <li>• Monitor temperature and pressure trends</li>
              <li>• Consider IoT sensors for real-time monitoring</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
            <h3 className="text-xl font-bold text-[#0a2540] mb-3">4. Maintain a Clean Environment</h3>
            <p className="text-gray-600 mb-4">
              Contamination from dust, moisture, and debris accelerates wear on bearings, seals, and moving parts.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Implement regular cleaning schedules for equipment and surrounding areas</li>
              <li>• Use air filtration in sensitive areas</li>
              <li>• Control humidity and temperature where possible</li>
              <li>• Install protective covers on equipment when not in use</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
            <h3 className="text-xl font-bold text-[#0a2540] mb-3">5. Use Quality Parts and Fluids</h3>
            <p className="text-gray-600 mb-4">
              Using inferior parts or fluids may save money upfront but often leads to premature failures and reduced equipment life.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Source parts from reputable suppliers or OEMs</li>
              <li>• Use fluids that meet manufacturer specifications</li>
              <li>• Keep critical spare parts in inventory</li>
              <li>• Document all part replacements for tracking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#635bff] to-[#4f46e5] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Extend Your Equipment Lifespan?
          </h2>
          <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
            Myncel helps you implement and track preventive maintenance programs that maximize equipment life and reduce unplanned downtime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-[#635bff] font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/demo"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}