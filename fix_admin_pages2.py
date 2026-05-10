"""Fix the broken replacements and redo them correctly."""
import os, re

files = [
    'app/admin/page.tsx',
    'app/admin/alerts/AdminAlertsClient.tsx',
    'app/admin/machines/AdminMachinesClient.tsx',
    'app/admin/account/AdminAccountClient.tsx',
    'app/admin/chat/AdminChatClient.tsx',
    'app/admin/organizations/page.tsx',
    'app/admin/test-panel/page.tsx',
    'app/admin/users/page.tsx',
    'app/admin/work-orders/AdminWorkOrdersClient.tsx',
    'app/admin/settings/SettingsClient.tsx',
    'app/admin/chat/page.tsx',
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        src = f.read()
    original = src

    # ── Fix the broken patterns from previous run ────────────────────────────

    # 1. Fix broken object literal: color: '' style={{ color: 'var(--text-primary)' }}
    #    → color: 'text-[var(--text-primary)]'
    src = re.sub(
        r"color: '' style=\{\{ color: 'var\(--text-primary\)' \}\}",
        "color: 'text-[var(--text-primary)]'",
        src
    )

    # 2. Fix broken className patterns like:
    #    className="font-bold" style={{ color: 'var(--text-primary)' }} className=" text-lg"
    #    → className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}
    src = re.sub(
        r'className="([^"]*?)" style=\{\{ color: \'var\(--text-primary\)\' \}\} className=" ([^"]*?)"',
        r'className="\1 \2" style={{ color: \'var(--text-primary)\' }}',
        src
    )

    # 3. Fix broken: className="" style={{ color: 'var(--text-primary)' }}
    #    This came from '"text-white"' → '"" style={...'
    #    Find: className="" style={{ color: 'var(--text-primary)' }}
    #    and merge with surrounding context
    src = re.sub(
        r'className="" style=\{\{ color: \'var\(--text-primary\)\' \}\}',
        'style={{ color: \'var(--text-primary)\' }}',
        src
    )

    # 4. Fix broken: 'text-" style={{ color: 'var(--text-primary)' }} className="...'
    #    inside className strings — these came from 'text-white text-' replacement
    src = re.sub(
        r'text-" style=\{\{ color: \'var\(--text-primary\)\' \}\} className="(\S)',
        r'text-\1',
        src
    )
    # More general: text-" style=...  className="sm (etc)
    src = re.sub(
        r'text-" style=\{\{ color: \'var\(--text-primary\)\' \}\} className="([^"]*?)"',
        r'text-[var(--text-primary)] \1"',
        src
    )

    # 5. Fix: font-" style={{ color: 'var(--text-primary)' }} className="bold ...
    src = re.sub(
        r'font-" style=\{\{ color: \'var\(--text-primary\)\' \}\} className="([^"]*?)"',
        r'font-\1" style={{ color: \'var(--text-primary)\' }}',
        src
    )

    # ── Now do the CORRECT replacements (safe ones only) ─────────────────────

    SAFE_REPLACEMENTS = [
        # In className strings, replace text-white safely
        # Match only when it's a complete class token (space or quote boundary)
        # Use regex to be safe
    ]

    # Safe regex replacements for text-white in className strings
    # Only replace 'text-white' when followed by space, quote, or end-of-string
    src = re.sub(r'\btext-white\b(?!/)', 'text-[var(--text-primary)]', src)

    if src != original:
        with open(filepath, 'w') as f:
            f.write(src)
        print(f'  ✓ fixed: {filepath}')
    else:
        print(f'  ~ no changes: {filepath}')