import re

# ─── Fix 1: UserHMIClient.tsx — Add useTheme to MachineVisual ───────────────
path_hmi = 'app/dashboard/hmi/UserHMIClient.tsx'
content = open(path_hmi).read()

# Replace the MachineVisual function signature/opening to add useTheme + themed SVG colors
old_machine_visual = """function MachineVisual({ category, status, size = 'md' }: { category: string; status: string; size?: 'sm' | 'md' | 'lg' }) {
    const isB = status === 'BREAKDOWN';
    const isM = status === 'MAINTENANCE';
    const isOp = status === 'OPERATIONAL';
    const mc = isB ? '#ef4444' : isM ? '#f59e0b' : '#635bff';
    const gl = isB ? '#ef444450' : isM ? '#f59e0b50' : '#635bff40';
    const svgClass = size === 'lg' ? 'w-full h-40' : size === 'sm' ? 'w-full h-14' : 'w-full h-24';"""

new_machine_visual = """function MachineVisual({ category, status, size = 'md' }: { category: string; status: string; size?: 'sm' | 'md' | 'lg' }) {
    const { isDark } = useTheme();
    const isB = status === 'BREAKDOWN';
    const isM = status === 'MAINTENANCE';
    const isOp = status === 'OPERATIONAL';
    const mc = isB ? '#ef4444' : isM ? '#f59e0b' : '#635bff';
    const gl = isB ? '#ef444450' : isM ? '#f59e0b50' : '#635bff40';
    const svgClass = size === 'lg' ? 'w-full h-40' : size === 'sm' ? 'w-full h-14' : 'w-full h-24';
    // Theme-aware SVG fill colors
    const svgBase    = isDark ? '#1e2d4a' : '#dde8f5';
    const svgSurface = isDark ? '#162035' : '#c8daf0';
    const svgPanel   = isDark ? '#0d1426' : '#b0c8e8';
    const svgDark    = isDark ? '#1a2840' : '#ccdcee';
    const svgStroke  = isDark ? '#2d3f5e' : '#94b8d8';"""

if old_machine_visual in content:
    content = content.replace(old_machine_visual, new_machine_visual)
    print("✓ Added useTheme + SVG color vars to MachineVisual")
else:
    print("✗ Could not find MachineVisual opening - checking...")
    idx = content.find('function MachineVisual')
    print(repr(content[idx:idx+400]))

# Now replace hardcoded dark SVG fill colors with themed variables
# CNC Mill/Lathe SVG
replacements_hmi = [
    # CNC Mill/Lathe
    ('fill="#1e2d4a" stroke="#2d3f5e" strokeWidth="1"/>', 'fill={svgBase} stroke={svgStroke} strokeWidth="1"/>'),
    ('fill="#162035" stroke={mc} strokeWidth="0.8"/>', 'fill={svgSurface} stroke={mc} strokeWidth="0.8"/>'),
    ('fill="#1a2840" stroke="#2d3f5e" strokeWidth="0.8"/>', 'fill={svgDark} stroke={svgStroke} strokeWidth="0.8"/>'),
    ('fill="#1e2d4a" stroke={mc} strokeWidth="1.2"', 'fill={svgBase} stroke={mc} strokeWidth="1.2"'),
    ('fill="#0d1426" stroke="#2d3f5e" strokeWidth="0.8"/>', 'fill={svgPanel} stroke={svgStroke} strokeWidth="0.8"/>'),
    # Conveyor
    ('fill="#1a2840" stroke={mc} strokeWidth="1"/>', 'fill={svgDark} stroke={mc} strokeWidth="1"/>'),
    ('fill="#162035" stroke={mc} strokeWidth="0.8"/>', 'fill={svgSurface} stroke={mc} strokeWidth="0.8"/>'),
    ('fill="#0d1426" stroke={mc} strokeWidth="1"', 'fill={svgPanel} stroke={mc} strokeWidth="1"'),
    # Press/Hydraulic
    ('fill="#1e2d4a" stroke={mc} strokeWidth="1"/>', 'fill={svgBase} stroke={mc} strokeWidth="1"/>'),
    ('fill="#1a2840" stroke="#2d3f5e" strokeWidth="0.8"/>', 'fill={svgDark} stroke={svgStroke} strokeWidth="0.8"/>'),
    # Compressor
    ('fill="#162035" stroke={mc} strokeWidth="1.2"', 'fill={svgSurface} stroke={mc} strokeWidth="1.2"'),
    ('fill="#1a2840" stroke={mc} strokeWidth="1"/>', 'fill={svgDark} stroke={mc} strokeWidth="1"/>'),
    ('fill="#0d1426" stroke={mc} strokeWidth="1"/>', 'fill={svgPanel} stroke={mc} strokeWidth="1"/>'),
    # Generic fallback
    ('fill="#162035" stroke={mc} strokeWidth="1.2"', 'fill={svgSurface} stroke={mc} strokeWidth="1.2"'),
    ('fill="#0d1426" stroke="#2d3f5e" strokeWidth="0.5"/>', 'fill={svgPanel} stroke={svgStroke} strokeWidth="0.5"/>'),
]

count = 0
for old, new in replacements_hmi:
    if old in content:
        content = content.replace(old, new)
        count += 1
        print(f'✓ SVG: {old[:50]}')
    else:
        print(f'  skip (not found or already replaced): {old[:50]}')

# Also fix the remaining fill="#162035" instances in the Conveyor legs
content = content.replace(
    'fill="#162035" stroke="#2d3f5e" strokeWidth="0.8"/>',
    'fill={svgSurface} stroke={svgStroke} strokeWidth="0.8"/>'
)

open(path_hmi, 'w').write(content)
print(f'\nHMI: {count} replacements made')

# ─── Fix 2: DashboardClient.tsx — Fix KPI icon bg in dark mode ──────────────
path_dash = 'app/dashboard/DashboardClient.tsx'
content2 = open(path_dash).read()

dash_replacements = [
    # KPI icon bg colors - use theme-aware versions
    ("bg: 'bg-amber-50',", "bg: 'bg-amber-500/10',"),
    ("bg: 'bg-blue-50',", "bg: 'bg-blue-500/10',"),
    ("bg: 'bg-emerald-50',", "bg: 'bg-emerald-500/10',"),
    ("bg: 'bg-[#635bff]/10',", "bg: 'bg-[#635bff]/10',"),  # already fine, no change
]

count2 = 0
for old, new in dash_replacements:
    if old in content2 and old != new:
        content2 = content2.replace(old, new)
        count2 += 1
        print(f'✓ Dash: {old} -> {new}')

open(path_dash, 'w').write(content2)
print(f'\nDash: {count2} replacements made')