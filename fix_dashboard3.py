with open('app/dashboard/DashboardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old2 = (
    '              <div className="flex items-center justify-between">\n'
    '                <p className="text-sm text-[#425466]">{workOrders.length} open work orders</p>\n'
    '                <button onClick={() => setShowWorkOrderModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">\n'
    '                  + New Work Order\n'
    '                </button>\n'
    '              </div>'
)

if old2 in content:
    # Write the replacement to a temp file, then read it back
    replacement_lines = [
        '              <div className="flex items-center justify-between">\n',
        '                <p className="text-sm text-[#425466]">\n',
        "                  {workOrders.filter(wo => woFilter === 'ALL' || wo.status === woFilter).length} work order{workOrders.filter(wo => woFilter === 'ALL' || wo.status === woFilter).length !== 1 ? 's' : ''}\n",
        '                </p>\n',
        '                <button onClick={() => setShowWorkOrderModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">\n',
        '                  + New Work Order\n',
        '                </button>\n',
        '              </div>\n',
        '              {/* Status filter pills */}\n',
        '              <div className="flex flex-wrap gap-2">\n',
        "                {(['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(f => (\n",
        '                  <button\n',
        '                    key={f}\n',
        '                    onClick={() => setWoFilter(f)}\n',
        '                    className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${\n',
        '                      woFilter === f\n',
        "                        ? 'bg-[#635bff] text-white border-[#635bff]'\n",
        "                        : 'bg-white text-[#425466] border-[#e6ebf1] hover:border-[#635bff] hover:text-[#635bff]'\n",
        '                    }`}\n',
        '                  >\n',
        "                    {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}\n",
        '                  </button>\n',
        '                ))}\n',
        '              </div>',
    ]
    new2 = ''.join(replacement_lines)
    content = content.replace(old2, new2, 1)
    print("Fix 2 applied: added filter pills UI")
else:
    print("Fix 2 NOT FOUND")
    idx = content.find('open work orders</p>')
    if idx >= 0:
        print(f"Actual context: {repr(content[idx-250:idx+400])}")
    print(f"\nExpected (first 150): {repr(old2[:150])}")

with open('app/dashboard/DashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")