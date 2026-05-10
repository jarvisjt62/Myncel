'use client'

import { useState } from 'react'
import Link from 'next/link'

// Equipment data with all maintenance tasks
const equipmentData = [
  {
    title: '⚙️ CNC Mills & Machining Centers',
    tasks: {
      Daily: ['Check coolant level and concentration', 'Inspect way covers for chips/debris', 'Check spindle for unusual noise', 'Verify hydraulic fluid levels', 'Clean chip conveyor'],
      Weekly: ['Clean chip buildup from way covers', 'Check way lubrication system', 'Inspect tool changer operation', 'Verify axis backlash compensation', 'Check air pressure and filters'],
      Monthly: ['Replace coolant and clean tank', 'Check spindle runout', 'Inspect ball screws for wear', 'Clean electrical cabinet filters', 'Test safety interlocks'],
      Annually: ['Full spindle inspection', 'Ball screw inspection/replacement', 'Geometric accuracy check', 'Electrical system inspection', 'Hydraulic system service']
    }
  },
  {
    title: '🔧 CNC Lathes & Turning Centers',
    tasks: {
      Daily: ['Check turret alignment', 'Inspect spindle for noise/vibration', 'Check tailstock alignment', 'Verify coolant flow', 'Clean chip buildup'],
      Weekly: ['Check chuck jaw pressure', 'Inspect way lubrication', 'Test tool setter accuracy', 'Clean turret stations', 'Check hydraulic pressure'],
      Monthly: ['Spindle bearing check', 'Chuck inspection and lubrication', 'Ball screw inspection', 'Tailstock quill inspection', 'Electrical cabinet cleaning'],
      Annually: ['Full spindle rebuild inspection', 'Headstock alignment check', 'Turret rebuild if needed', 'Geometric verification', 'Control system backup']
    }
  },
  {
    title: '🔥 Hydraulic Presses',
    tasks: {
      Daily: ['Check hydraulic fluid level', 'Inspect for leaks', 'Listen for unusual pump noise', 'Check pressure gauges', 'Test safety devices'],
      Weekly: ['Check fluid temperature', 'Inspect hoses for wear', 'Test pressure relief valve', 'Clean breathers', 'Check ram alignment'],
      Monthly: ['Sample hydraulic fluid', 'Check seal condition', 'Inspect cylinder rods', 'Test tonnage/pressure', 'Lubricate guides'],
      Annually: ['Complete fluid change', 'Filter replacement', 'Cylinder seal replacement', 'Pump inspection', 'Control valve rebuild']
    }
  },
  {
    title: '💨 Air Compressors',
    tasks: {
      Daily: ['Drain moisture from receiver tank', 'Check oil level (if oil-lubricated)', 'Listen for unusual noise', 'Check discharge pressure', 'Inspect for air leaks'],
      Weekly: ['Clean intake filters', 'Check belt tension (if belt-driven)', 'Test safety valve', 'Inspect motor bearings', 'Clean aftercooler'],
      Monthly: ['Change oil (first 500 hrs, then periodic)', 'Replace oil filter', 'Clean/replace air filter', 'Check for vibration issues', 'Inspect electrical connections'],
      Annually: ['Professional inspection', 'Valve inspection/rebuild', 'Motor service', 'Pressure vessel inspection', 'Control system check']
    }
  },
  {
    title: '🔄 Conveyors & Material Handling',
    tasks: {
      Daily: ['Visual inspection of belt/chain', 'Listen for unusual noise', 'Check for material buildup', 'Verify emergency stops', 'Inspect guards and covers'],
      Weekly: ['Check belt tension', 'Inspect belt tracking', 'Lubricate bearings', 'Check chain tension (if applicable)', 'Inspect drive unit'],
      Monthly: ['Full bearing inspection', 'Check pulley alignment', 'Inspect belt splice', 'Test safety sensors', 'Check gearbox oil level'],
      Annually: ['Replace worn belts', 'Bearing replacement', 'Gearbox service', 'Motor inspection', 'Safety system certification']
    }
  },
  {
    title: '⚡ Electrical Panels & Motors',
    tasks: {
      Daily: ['Check for unusual heat/smell', 'Verify indicator lights', 'Listen for motor noise', 'Check for vibration', 'Verify ventilation'],
      Weekly: ['Check motor temperature', 'Inspect cable connections', 'Clean motor exterior', 'Check contactor operation', 'Verify overload settings'],
      Monthly: ['Megger test motors', 'Tighten electrical connections', 'Clean panel interior', 'Test VFD parameters', 'Check fuse condition'],
      Annually: ['Thermographic inspection', 'Motor bearing replacement', 'Control system backup', 'Protective device testing', 'Power quality analysis']
    }
  },
  {
    title: '❄️ Cooling & HVAC Systems',
    tasks: {
      Daily: ['Check temperature readings', 'Inspect for leaks', 'Listen for unusual noise', 'Check airflow', 'Verify control operation'],
      Weekly: ['Clean/replace filters', 'Check condensate drain', 'Inspect belt condition', 'Check refrigerant pressure', 'Clean condenser coils'],
      Monthly: ['Lubricate bearings', 'Check pulley alignment', 'Test economizer', 'Inspect ductwork', 'Calibrate sensors'],
      Annually: ['Full system inspection', 'Refrigerant charge check', 'Coil cleaning (professional)', 'Motor service', 'Control calibration']
    }
  },
  {
    title: '🔥 Welding Equipment',
    tasks: {
      Daily: ['Inspect cables for damage', 'Check ground clamp', 'Clean contact tips', 'Check wire feed (MIG)', 'Verify gas flow'],
      Weekly: ['Clean liner (MIG)', 'Check drive rolls', 'Inspect torch components', 'Clean air filters', 'Check coolant level (TIG)'],
      Monthly: ['Replace contact tips', 'Check electrical connections', 'Inspect gas regulators', 'Clean wire spool hub', 'Test output amperage'],
      Annually: ['Full calibration', 'Cable replacement', 'Internal cleaning', 'Coolant system service', 'PCB inspection']
    }
  }
]

// Notes fields
const notesFields = [
  { id: 'equipment', label: 'Equipment covered by this checklist:' },
  { id: 'lastInspection', label: 'Last inspection date:' },
  { id: 'nextInspection', label: 'Next scheduled inspection:' },
  { id: 'technician', label: 'Technician name:' },
  { id: 'notes', label: 'Additional notes:' }
]

export default function InteractiveChecklist() {
  // State for checkboxes - keyed by equipment index, frequency, and task index
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  
  // State for notes
  const [notes, setNotes] = useState<Record<string, string>>({
    equipment: '',
    lastInspection: '',
    nextInspection: '',
    technician: '',
    notes: ''
  })

  // Toggle checkbox
  const toggleCheck = (equipmentIdx: number, frequency: string, taskIdx: number) => {
    const key = `${equipmentIdx}-${frequency}-${taskIdx}`
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Update note
  const updateNote = (id: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [id]: value
    }))
  }

  // Reset all
  const resetAll = () => {
    setCheckedItems({})
    setNotes({
      equipment: '',
      lastInspection: '',
      nextInspection: '',
      technician: '',
      notes: ''
    })
  }

  return (
    <div className="min-h-screen bg-white print:p-0">
      {/* Print Header */}
      <div className="bg-[#0a2540] text-white py-8 px-6 print:bg-white print:text-black print:border-b-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold print:text-black">Preventive Maintenance Checklist</h1>
              <p className="text-purple-200 print:text-gray-600">For Small Manufacturers</p>
            </div>
            <div className="text-right print:text-black">
              <p className="font-bold">Myncel</p>
              <p className="text-sm text-purple-200 print:text-gray-600">myncel.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 print:py-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 print:bg-gray-100 print:border-gray-300">
          <h2 className="font-bold text-blue-800 print:text-black mb-2">How to Use This Checklist</h2>
          <p className="text-sm text-blue-700 print:text-black">Click on each checkbox to mark tasks as completed. Fill in the notes section below. Your progress will be saved until you reset or clear your browser data.</p>
        </div>

        {/* Equipment Sections */}
        {equipmentData.map((equipment, eqIdx) => (
          <div key={eqIdx} className="mb-8 print:break-inside-avoid">
            <h2 className="text-xl font-bold text-[#0a2540] border-b-2 border-[#635bff] pb-2 mb-4 print:border-black">{equipment.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(equipment.tasks).map(([frequency, tasks]) => (
                <div key={frequency}>
                  <h3 className="font-semibold text-gray-700 mb-2">{frequency}</h3>
                  <ul className="space-y-2 text-sm">
                    {tasks.map((task, taskIdx) => {
                      const checkKey = `${eqIdx}-${frequency}-${taskIdx}`
                      const isChecked = checkedItems[checkKey] || false
                      return (
                        <li 
                          key={taskIdx} 
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleCheck(eqIdx, frequency, taskIdx)}
                        >
                          <span 
                            className={`w-4 h-4 border rounded flex items-center justify-center text-xs transition-colors ${
                              isChecked 
                                ? 'bg-[#635bff] border-[#635bff] text-white print:bg-white print:border-black print:text-black' 
                                : 'border-gray-400 print:border-black'
                            }`}
                          >
                            {isChecked && '✓'}
                          </span>
                          <span className={isChecked ? 'line-through text-gray-400' : ''}>{task}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Notes Section */}
        <div className="mt-8 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-[#0a2540] border-b-2 border-[#635bff] pb-2 mb-4 print:border-black">📝 Notes</h2>
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="grid grid-cols-1 gap-4 text-sm">
              {notesFields.map((field) => (
                <div key={field.id} className="border-b border-dashed border-gray-300 py-2 last:border-b-0 print:py-4">
                  <label className="block text-gray-500 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={notes[field.id]}
                    onChange={(e) => updateNote(field.id, e.target.value)}
                    className="w-full border-none outline-none bg-transparent text-[#0a2540] print:border-b print:border-black"
                    placeholder={`Enter ${field.label.toLowerCase().replace(':', '')}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 print:mt-4">
          <p>Provided by Myncel — Predictive Maintenance for Small Manufacturers</p>
          <p className="print:hidden">Want to automate your preventive maintenance? Visit <Link href="/signup" className="text-[#635bff]">myncel.com</Link></p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center print:hidden space-x-4">
          <button 
            onClick={() => window.print()} 
            className="bg-[#635bff] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors"
          >
            🖨️ Print / Save as PDF
          </button>
          <button 
            onClick={resetAll} 
            className="bg-gray-200 text-gray-700 font-bold px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🔄 Reset Checklist
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center print:hidden">Click to print or save as PDF. Checklist state is saved locally.</p>
      </div>
    </div>
  )
}