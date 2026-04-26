"""Replace hardcoded dark colours in all admin content pages with CSS var() tokens."""
import os, re

# Files to process (all admin client/page files except layout and AdminLayoutClient)
files = [
    'app/admin/page.tsx',
    'app/admin/account/AdminAccountClient.tsx',
    'app/admin/account/page.tsx',
    'app/admin/alerts/AdminAlertsClient.tsx',
    'app/admin/alerts/page.tsx',
    'app/admin/chat/AdminChatClient.tsx',
    'app/admin/chat/page.tsx',
    'app/admin/machines/AdminMachinesClient.tsx',
    'app/admin/machines/page.tsx',
    'app/admin/organizations/page.tsx',
    'app/admin/settings/SettingsClient.tsx',
    'app/admin/settings/page.tsx',
    'app/admin/test-panel/page.tsx',
    'app/admin/users/page.tsx',
    'app/admin/work-orders/AdminWorkOrdersClient.tsx',
    'app/admin/work-orders/page.tsx',
]

# Ordered replacements — most specific first
REPLACEMENTS = [
    # ── surfaces ──────────────────────────────────────────────────────────
    ('bg-[#060e1f]',   'bg-[var(--bg-page)]'),
    ('bg-[#080d1a]',   'bg-[var(--bg-page)]'),
    ('bg-[#0a1628]',   'bg-[var(--bg-surface-2)]'),
    ('bg-[#0d1426]',   'bg-[var(--bg-surface)]'),
    ('bg-[#111d35]',   'bg-[var(--bg-surface)]'),
    ('bg-[#162035]',   'bg-[var(--bg-surface-2)]'),
    ('bg-[#1a2840]',   'bg-[var(--bg-surface-2)]'),
    ('bg-[#1e2d4a]',   'bg-[var(--bg-hover)]'),
    ('bg-[#1e2d4a]/50','bg-[var(--bg-hover)]/50'),
    ('bg-[#263a5a]',   'bg-[var(--bg-hover)]'),

    # ── borders ───────────────────────────────────────────────────────────
    ('border-[#1e2d4a]', 'border-[var(--border)]'),
    ('border-[#2d3f5e]', 'border-[var(--border-subtle)]'),
    ('border-l-[#1e2d4a]','border-l-[var(--border)]'),

    # ── text ──────────────────────────────────────────────────────────────
    # Be careful: only standalone text-white (not text-white/XX handled below)
    ('text-white font-',    'font-" style={{ color: \'var(--text-primary)\' }} className="'),
    ('text-white text-',    'text-" style={{ color: \'var(--text-primary)\' }} className="'),
    ('"text-white"',        '"" style={{ color: \'var(--text-primary)\' }}'),
    ("'text-white'",        "'' style={{ color: 'var(--text-primary)' }}"),
    (' text-white ',        ' text-[var(--text-primary)] '),
    (' text-white"',        ' text-[var(--text-primary)]"'),
    ('>text-white<',        '>text-[var(--text-primary)]<'),

    ('text-white/70',    'text-[var(--text-secondary)]'),
    ('text-white/60',    'text-[var(--text-secondary)]'),
    ('text-white/50',    'text-[var(--text-secondary)]'),
    ('text-white/40',    'text-[var(--text-muted)]'),
    ('text-white/30',    'text-[var(--text-muted)]'),
    ('text-white/20',    'text-[var(--text-ultralow)]'),

    ('text-[#8892a4]',   'text-[var(--text-secondary)]'),
    ('text-[#4a5568]',   'text-[var(--text-muted)]'),
    ('text-[#94a3b8]',   'text-[var(--text-muted)]'),

    # ── hover surfaces ────────────────────────────────────────────────────
    ('hover:bg-[#1e2d4a]',     'hover:bg-[var(--bg-hover)]'),
    ('hover:bg-[#1e2d4a]/50',  'hover:bg-[var(--bg-hover)]/50'),
    ('hover:bg-[#263a5a]',     'hover:bg-[var(--bg-hover)]'),
    ('hover:bg-[#2d3f5e]',     'hover:bg-[var(--bg-hover)]'),
    ('hover:text-white',        'hover:text-[var(--text-primary)]'),

    # ── misc ──────────────────────────────────────────────────────────────
    ('placeholder-[#4a5568]',  'placeholder-[var(--text-muted)]'),
    ('placeholder-[#8892a4]',  'placeholder-[var(--text-muted)]'),
]

total_changes = 0

for filepath in files:
    if not os.path.exists(filepath):
        print(f'  SKIP (not found): {filepath}')
        continue

    with open(filepath, 'r') as f:
        src = f.read()

    original = src
    file_changes = 0

    for old, new in REPLACEMENTS:
        n = src.count(old)
        if n:
            src = src.replace(old, new)
            file_changes += n

    if src != original:
        with open(filepath, 'w') as f:
            f.write(src)
        print(f'  ✓ {filepath} — {file_changes} changes')
        total_changes += file_changes
    else:
        print(f'  ~ {filepath} — no changes')

print(f'\nTotal: {total_changes} replacements across {len(files)} files')