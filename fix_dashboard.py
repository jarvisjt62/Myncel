import re

with open('app/dashboard/DashboardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ─── Fix 1: Remove duplicate woFilter from ChangePasswordSection ───
# The ChangePasswordSection has saving/saveError/woFilter in sequence - remove just woFilter line
old1 = "  const [saving, setSaving] = useState(false);\n  const [saveError, setSaveError] = useState('');\n  const [woFilter, setWoFilter] = useState('ALL');\n  const [msg, setMsg]"
new1 = "  const [saving, setSaving] = useState(false);\n  const [saveError, setSaveError] = useState('');\n  const [msg, setMsg]"

if old1 in content:
    content = content.replace(old1, new1, 1)
    print("Fix 1 applied: removed duplicate woFilter from ChangePasswordSection")
else:
    print("Fix 1 NOT FOUND - checking exact chars...")
    idx = content.find("const [woFilter, setWoFilter] = useState('ALL');")
    print(f"  First woFilter at index: {idx}")
    print(f"  Context: {repr(content[max(0,idx-80):idx+60])}")

# ─── Fix 2: Add filter pills UI above the work orders table ───
# Current header section (exact match from file):
old2 = '''              <div className="flex items-center justify-between">
                  <p className="text-sm text-[#425466]">{workOrders.length} open work orders</p>
                  <button onClick={() => setShowWorkOrderModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">
                    + New Work Order
                  </button>
                </div>'''

new2 = '''              <div className="flex items-center justify-between">
                  <p className="text-sm text-[#425466]">
                    {workOrders.filter(wo => woFilter === 'ALL' || wo.status === woFilter).length} work order{workOrders.filter(wo => woFilter === 'ALL' || wo.status === woFilter).length !== 1 ? 's' : ''}
                    {woFilter !== 'ALL' && <span className="ml-1 text-[#635bff]">({woFilter.replace('_', ' ')})</span>}
                  </p>
                  <button onClick={() => setShowWorkOrderModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">
                    + New Work Order
                  </button>
                </div>
                {/* Status filter pills */}
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setWoFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                        woFilter === f
                          ? 'bg-[#635bff] text-white border-[#635bff]'
                          : 'bg-white text-[#425466] border-[#e6ebf1] hover:border-[#635bff] hover:text-[#635bff]'
                      }`}
                    >
                      {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>'''

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Fix 2 applied: added filter pills UI")
else:
    print("Fix 2 NOT FOUND - searching for partial match...")
    # Try to find the relevant section
    idx = content.find('open work orders</p>')
    if idx >= 0:
        print(f"  Found 'open work orders' at index {idx}")
        print(f"  Context (200 chars around): {repr(content[max(0,idx-200):idx+100])}")
    else:
        print("  'open work orders' not found either")

with open('app/dashboard/DashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")