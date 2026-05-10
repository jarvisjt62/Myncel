with open('app/dashboard/DashboardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = (
    "  { id: 'settings', label: 'Settings', icon: (\n"
    '      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n'
    '        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />\n'
    "      </svg>\n"
    "    )},\n"
    "  ];\n"
    "\n"
    "  const Sidebar = () => ("
)

new = (
    "  { id: 'settings', label: 'Settings', icon: (\n"
    '      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n'
    '        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />\n'
    "      </svg>\n"
    "    )},\n"
    "  ];\n"
    "\n"
    "  // HMI link - opens /dashboard/hmi full page\n"
    "  const hmiLinkHref = '/dashboard/hmi';\n"
    "\n"
    "  const Sidebar = () => ("
)

if old in content:
    content = content.replace(old, new, 1)
    print("HMI link variable added")
else:
    print("NOT FOUND")
    idx = content.find("id: 'settings'")
    print(repr(content[idx-4:idx+350]))

with open('app/dashboard/DashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")