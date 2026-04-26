'use client'

import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export default function ROICalculator() {
  const [formData, setFormData] = useState({
    machines: 10,
    avgMachineCost: 150000,
    annualDowntime: 120,
    downtimeCostPerHour: 2500,
    maintenanceTechs: 2,
    avgTechSalary: 65000,
    repairBudget: 180000,
    unplannedFailures: 24,
    avgRepairCost: 8500,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
  }

  // Calculate ROI metrics
  const currentUnplannedDowntime = formData.unplannedFailures * 8 // Average 8 hours per failure
  const currentDowntimeCost = currentUnplannedDowntime * formData.downtimeCostPerHour
  
  // With predictive maintenance (industry averages)
  const pmDowntimeReduction = 0.50 // 50% reduction in unplanned downtime
  const pmFailureReduction = 0.45 // 45% reduction in failures
  const pmRepairSavings = 0.25 // 25% reduction in repair costs
  
  const newDowntime = currentUnplannedDowntime * (1 - pmDowntimeReduction)
  const newDowntimeCost = newDowntime * formData.downtimeCostPerHour
  const downtimeSavings = currentDowntimeCost - newDowntimeCost
  
  const newFailures = formData.unplannedFailures * (1 - pmFailureReduction)
  const newRepairCost = newFailures * formData.avgRepairCost * (1 - pmRepairSavings)
  const repairSavings = (formData.unplannedFailures * formData.avgRepairCost) - newRepairCost
  
  const equipmentLifeExtension = 0.20 // 20% longer equipment life
  const deferredCapex = formData.machines * formData.avgMachineCost * equipmentLifeExtension / 10 // Annualized
  
  const totalAnnualSavings = downtimeSavings + repairSavings + deferredCapex
  
  // Myncel cost estimate (based on machines)
  const myncelMonthlyCost = formData.machines * 49 // $49 per machine per month average
  const myncelAnnualCost = myncelMonthlyCost * 12
  
  const annualROI = ((totalAnnualSavings - myncelAnnualCost) / myncelAnnualCost) * 100
  const paybackMonths = myncelAnnualCost / (totalAnnualSavings / 12)

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
            Predictive Maintenance ROI Calculator
          </h1>
          <p className="text-xl text-[#8898aa] mb-8 max-w-2xl">
            Calculate your potential return on investment from implementing a predictive maintenance program with Myncel.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Form */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Your Facility Information</h2>
              
              {/* Equipment Section */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-[#0a2540] mb-4">🏭 Equipment</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Critical Machines
                    </label>
                    <input
                      type="number"
                      name="machines"
                      value={formData.machines}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average Machine Cost ($)
                    </label>
                    <input
                      type="number"
                      name="avgMachineCost"
                      value={formData.avgMachineCost}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Downtime Section */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-[#0a2540] mb-4">⏱️ Downtime Costs</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unplanned Failures Per Year
                    </label>
                    <input
                      type="number"
                      name="unplannedFailures"
                      value={formData.unplannedFailures}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Per Hour of Downtime ($)
                    </label>
                    <input
                      type="number"
                      name="downtimeCostPerHour"
                      value={formData.downtimeCostPerHour}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Repair Costs Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#0a2540] mb-4">🔧 Repair Costs</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average Repair Cost Per Failure ($)
                    </label>
                    <input
                      type="number"
                      name="avgRepairCost"
                      value={formData.avgRepairCost}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Repair Budget ($)
                    </label>
                    <input
                      type="number"
                      name="repairBudget"
                      value={formData.repairBudget}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">Your ROI Results</h2>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-purple-200">Annual Savings</div>
                  <div className="text-2xl font-bold">${Math.round(totalAnnualSavings).toLocaleString()}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-purple-200">ROI</div>
                  <div className="text-2xl font-bold">{Math.round(annualROI)}%</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-purple-200">Payback Period</div>
                  <div className="text-2xl font-bold">{paybackMonths.toFixed(1)} months</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-purple-200">Downtime Reduction</div>
                  <div className="text-2xl font-bold">{Math.round(pmDowntimeReduction * 100)}%</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <h3 className="text-lg font-semibold mb-4">Savings Breakdown</h3>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-purple-200">Downtime Cost Savings</span>
                  <span className="font-semibold">${Math.round(downtimeSavings).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-purple-200">Repair Cost Savings</span>
                  <span className="font-semibold">${Math.round(repairSavings).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-purple-200">Extended Equipment Life</span>
                  <span className="font-semibold">${Math.round(deferredCapex).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 font-bold text-lg">
                  <span>Total Annual Savings</span>
                  <span>${Math.round(totalAnnualSavings).toLocaleString()}</span>
                </div>
              </div>

              {/* Investment */}
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <div className="text-sm text-purple-200 mb-1">Estimated Myncel Investment</div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">${myncelAnnualCost.toLocaleString()}</span>
                  <span className="text-purple-200 text-sm">/year</span>
                </div>
                <div className="text-xs text-purple-300 mt-1">Based on {formData.machines} machines at ~$49/machine/month</div>
              </div>

              <Link
                href="/signup"
                className="block w-full bg-white text-[#635bff] font-semibold text-center py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Industry Benchmarks */}
            <div className="mt-6 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#0a2540] mb-4">Industry Benchmarks</h3>
              <p className="text-sm text-gray-600 mb-4">
                These calculations are based on industry-standard metrics from studies by Deloitte, McKinsey, and the Society of Maintenance Professionals.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  35-45% reduction in unplanned failures
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  20-50% reduction in downtime
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  15-25% reduction in maintenance costs
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  20-40% increase in equipment lifespan
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 pt-16 border-t">
          <h2 className="text-3xl font-bold text-[#0a2540] mb-8 text-center">How Myncel Delivers These Savings</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-[#0a2540] mb-2">Preventive Scheduling</h3>
              <p className="text-gray-600">
                Automated maintenance schedules based on machine hours, calendar time, or custom triggers ensure timely maintenance before failures occur.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔔</span>
              </div>
              <h3 className="text-xl font-bold text-[#0a2540] mb-2">Smart Alerts</h3>
              <p className="text-gray-600">
                Get notified before equipment fails with condition-based alerts and never miss a critical maintenance task again.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-bold text-[#0a2540] mb-2">Mobile Access</h3>
              <p className="text-gray-600">
                Technicians can complete work orders, log parts, and document repairs from anywhere, reducing administrative time.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#0a2540] to-[#1e3a5f] rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-[#8898aa] mb-6 max-w-2xl mx-auto">
            Join hundreds of manufacturers who have reduced downtime and extended equipment life with Myncel.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="bg-[#635bff] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#5548e8] transition-colors"
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