import re

path = 'app/admin/hmi/page.tsx'
content = open(path).read()
original = content

# Safe replacements - only className="..." attribute values
# These are specific enough to not cause issues

replacements = [
    # Title text-white
    ('className="text-xl font-bold text-white"', 'className="text-xl font-bold" style={{ color: \'var(--text-primary)\' }}'),
    # Subtitle hardcoded color
    ('className="text-[#8892a4] mt-0.5 text-xs"', 'className="text-[var(--text-secondary)] mt-0.5 text-xs"'),
    # Refresh button text-white
    ('className="px-3 py-1.5 text-xs font-semibold text-white border border-[var(--border)] bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-hover)]"',
     'className="px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-hover)]"'),
    # KPI "Total Equipment" color: 'text-white'
    ("{ label: 'Total Equipment', value: machines.length, color: 'text-white' },",
     "{ label: 'Total Equipment', value: machines.length, color: 'text-[var(--text-primary)]' },"),
    # KPI label text-[#8892a4]
    ('className="text-[#8892a4] text-[10px] mt-0.5 uppercase tracking-wide"',
     'className="text-[var(--text-secondary)] text-[10px] mt-0.5 uppercase tracking-wide"'),
    # No machines found text-[#8892a4]
    ('className="text-[#8892a4] text-sm"',
     'className="text-[var(--text-secondary)] text-sm"'),
    # Sim Controls header text-white
    ('className="text-xs font-bold text-white uppercase tracking-widest mb-3"',
     'className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-3"'),
    # Event Log header text-white
    ('className="text-xs font-bold text-white uppercase tracking-widest"',
     'className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest"'),
    # Event log clear button
    ('className="text-[10px] text-[#8892a4] hover:text-white"',
     'className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"'),
    # Event log empty state
    ('className="text-[#8892a4] text-xs italic"',
     'className="text-[var(--text-secondary)] text-xs italic"'),
    # Machine card footer border
    ('className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center"',
     'className="mt-2 pt-2 border-t border-[var(--card-border-b)] flex justify-between items-center"'),
    # Close button hover
    ('className="text-[var(--text-muted)] hover:text-white text-xl leading-none"',
     'className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none"'),
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
        print(f'✓ Replaced: {old[:60]}...')
    else:
        print(f'✗ NOT FOUND: {old[:60]}...')

open(path, 'w').write(content)
print(f'\nTotal: {count}/{len(replacements)} replacements made')