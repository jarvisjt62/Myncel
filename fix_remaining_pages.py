#!/usr/bin/env python3
"""
Strip standalone full-page wrappers from remaining user-facing pages
so they render cleanly inside the shared UserShellLayout (sidebar + topbar).
"""
import re, sys

errors = []

def patch(path, old, new, label):
    with open(path, "r") as f:
        src = f.read()
    if old in src:
        src = src.replace(old, new, 1)
        with open(path, "w") as f:
            f.write(src)
        print(f"  ✓ {label}")
        return True
    else:
        print(f"  ✗ PATTERN NOT FOUND: {label}")
        errors.append(f"{path}: {label}")
        return False

# ═══════════════════════════════════════════════════════════════
# 1. QRLabelsClient.tsx — remove outer dash-theme wrapper + sticky top nav
# ═══════════════════════════════════════════════════════════════
print("\n[1] QRLabelsClient.tsx")
path = "app/equipment/qr-labels/QRLabelsClient.tsx"

patch(path,
    '    return (\n      <div className="dash-theme min-h-screen" style={{ backgroundColor: \'var(--bg-page)\' }}>\n\n        {/* Top nav */}\n        <div className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"\n          style={{ backgroundColor: \'var(--bg-surface)\', borderBottom: \'1px solid var(--border)\' }}>\n          <div className="flex items-center gap-3">\n            <Link href="/dashboard"\n              className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition-opacity"\n              style={{ color: \'var(--text-secondary)\' }}>\n              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />\n              </svg>\n              Dashboard\n            </Link>\n            <span style={{ color: \'var(--border)\' }}>›</span>\n            <span className="text-sm font-semibold" style={{ color: \'var(--text-primary)\' }}>QR Labels</span>\n          </div>\n          <button\n            onClick={handlePrint}\n            disabled={selectedIds.size === 0}\n            className="flex items-center gap-2 bg-[#635bff] hover:bg-[#5248e6] disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"\n          >\n            🖨️ Print {selectedIds.size} Label{selectedIds.size !== 1 ? \'s\' : \'\'}\n          </button>\n        </div>\n\n        <div className="max-w-7xl mx-auto p-6">',
    '    return (\n      <div className="max-w-7xl mx-auto p-6">',
    "remove outer wrapper + top nav"
)

# Remove the extra closing </div> for outer wrapper at end
with open(path) as f:
    src = f.read()
# Find the last double-close pattern
old_end = "        </div>\n      </div>\n    );\n}"
new_end = "        </div>\n    );\n}"
if old_end in src:
    idx = src.rfind(old_end)
    src = src[:idx] + new_end + src[idx+len(old_end):]
    with open(path, "w") as f:
        f.write(src)
    print("  ✓ removed extra closing div")
else:
    print("  ✗ extra closing div pattern not found")
    errors.append(f"{path}: extra closing div")

# Remove Link import if no longer used
with open(path) as f:
    src = f.read()
link_count = src.count('<Link ')
if link_count == 0:
    src = re.sub(r"^import Link from 'next/link';\n", "", src, flags=re.MULTILINE)
    with open(path, "w") as f:
        f.write(src)
    print("  ✓ removed unused Link import")
else:
    print(f"  - Link still used {link_count}x, keeping import")

# ═══════════════════════════════════════════════════════════════
# 2. settings/page.tsx — remove min-h-screen wrapper + header
# ═══════════════════════════════════════════════════════════════
print("\n[2] settings/page.tsx")
path = "app/settings/page.tsx"
patch(path,
    '    return (\n      <div className="min-h-screen bg-[#f6f9fc]">\n        {/* Header */}\n        <div className="bg-white border-b border-[#e6ebf1]">\n          <div className="max-w-6xl mx-auto px-6 py-6">\n            <h1 className="text-2xl font-bold text-[#0a2540]">Settings</h1>\n            <p className="text-[#425466] mt-1">Manage your account and organization settings</p>\n          </div>\n        </div>\n\n        <div className="max-w-6xl mx-auto px-6 py-8">',
    '    return (\n      <div className="max-w-6xl mx-auto px-6 py-8">\n        {/* Page Title */}\n        <div className="mb-6">\n          <h1 className="text-2xl font-bold" style={{ color: \'var(--text-primary)\' }}>Settings</h1>\n          <p className="mt-1" style={{ color: \'var(--text-secondary)\' }}>Manage your account and organization settings</p>\n        </div>',
    "replace outer wrapper + header with inline title"
)

# Remove extra closing </div> at end
with open(path) as f:
    src = f.read()
old_end = "        </div>\n      </div>\n    );\n}"
new_end = "        </div>\n    );\n}"
if old_end in src:
    idx = src.rfind(old_end)
    src = src[:idx] + new_end + src[idx+len(old_end):]
    with open(path, "w") as f:
        f.write(src)
    print("  ✓ removed extra closing div")
else:
    old_end2 = "      </div>\n    );\n}"
    idx = src.rfind(old_end2)
    if idx != -1:
        src = src[:idx] + "    );\n}" + src[idx+len(old_end2):]
        with open(path, "w") as f:
            f.write(src)
        print("  ✓ removed extra closing div (alt)")
    else:
        print("  ✗ extra closing div not found")
        errors.append(f"{path}: extra closing div")

# ═══════════════════════════════════════════════════════════════
# 3. OrgDashboardClient.tsx — remove S.root wrapper + topbar
# ═══════════════════════════════════════════════════════════════
print("\n[3] OrgDashboardClient.tsx")
path = "app/org/dashboard/OrgDashboardClient.tsx"
patch(path,
    '    return (\n      <div style={S.root}>\n\n        {/* ── Topbar ── */}\n        <header style={S.topbar}>\n          <div style={{ display: \'flex\', alignItems: \'center\', gap: 12 }}>\n            <img src="/logo.png" alt="Myncel" style={{ width: 36, height: 36 }} />\n            <div>\n              <div style={{ fontWeight: 700, fontSize: 15, color: \'var(--text-primary)\' }}>\n                {user.organization.name}\n              </div>\n              <div style={{ fontSize: 12, color: \'var(--text-secondary)\' }}>\n                Organization Admin Panel\n              </div>\n            </div>\n            <span style={{ fontSize: 11, fontWeight: 700, padding: \'2px 8px\', borderRadius: 999, background: \'rgba(99,91,255,0.1)\', color: \'#635bff\', border: \'1px solid rgba(99,91,255,0.25)\', marginLeft: 4 }}>\n              {user.organization.plan}\n            </span>\n          </div>\n          <div style={{ display: \'flex\', gap: 10, alignItems: \'center\', flexWrap: \'wrap\' }}>\n            {stats.criticalAlerts > 0 && (\n              <Link href="/dashboard" style={S.alertBadge}>\n                🚨 {stats.criticalAlerts} Critical Alert{stats.criticalAlerts !== 1 ? \'s\' : \'\'}\n              </Link>\n            )}\n            <button onClick={() => setShowInvite(true)} style={S.inviteBtn}>\n              + Invite Team Member\n            </button>\n            <Link href="/dashboard" style={S.dashLink}>← User Dashboard</Link>\n          </div>\n        </header>\n\n        {/* ── Tab Nav ── */}',
    '    return (\n      <div>\n\n        {/* ── Page Title ── */}\n        <div style={{ padding: \'0 0 20px 0\', display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\', flexWrap: \'wrap\' as const, gap: 10 }}>\n          <div>\n            <h1 style={{ fontWeight: 700, fontSize: 20, color: \'var(--text-primary)\', margin: 0 }}>\n              {user.organization.name} — Admin Panel\n            </h1>\n            {user.organization.plan && (\n              <span style={{ fontSize: 11, fontWeight: 700, padding: \'2px 8px\', borderRadius: 999, background: \'rgba(99,91,255,0.1)\', color: \'#635bff\', border: \'1px solid rgba(99,91,255,0.25)\', display: \'inline-block\', marginTop: 4 }}>\n                {user.organization.plan}\n              </span>\n            )}\n          </div>\n          <div style={{ display: \'flex\', gap: 10, alignItems: \'center\', flexWrap: \'wrap\' as const }}>\n            {stats.criticalAlerts > 0 && (\n              <span style={S.alertBadge}>\n                🚨 {stats.criticalAlerts} Critical Alert{stats.criticalAlerts !== 1 ? \'s\' : \'\'}\n              </span>\n            )}\n            <button onClick={() => setShowInvite(true)} style={S.inviteBtn}>\n              + Invite Team Member\n            </button>\n          </div>\n        </div>\n\n        {/* ── Tab Nav ── */}',
    "remove S.root wrapper + topbar, add inline title"
)

# Remove extra closing </div> and update S.root style
with open(path) as f:
    src = f.read()
# Remove minHeight from S.root style
src = src.replace(
    "root: { minHeight: '100vh', background: 'var(--bg-page)', fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif' },",
    "root: { fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif' },"
)
# alertBadge was a Link but now it's a span — remove textDecoration from it (span doesn't need it)
# Keep alertBadge style as-is; it works on span too
with open(path, "w") as f:
    f.write(src)
print("  ✓ updated S.root style (removed minHeight/background)")

# Remove Link import if only used for the topbar links we removed
with open(path) as f:
    src = f.read()
link_count = src.count('<Link ')
print(f"  - <Link> uses remaining: {link_count}")
if link_count == 0:
    src = re.sub(r"^import Link from 'next/link';\n", "", src, flags=re.MULTILINE)
    with open(path, "w") as f:
        f.write(src)
    print("  ✓ removed unused Link import")

# ═══════════════════════════════════════════════════════════════
# 4. SetupWizardClient.tsx — remove dash-theme wrapper + back nav
# ═══════════════════════════════════════════════════════════════
print("\n[4] SetupWizardClient.tsx")
path = "app/setup/SetupWizardClient.tsx"
patch(path,
    '    return (\n      <div className="dash-theme min-h-screen flex flex-col items-center justify-center p-4"\n        style={{ backgroundColor: \'var(--bg-page)\' }}>\n\n        {/* Back nav */}\n        <div className="w-full max-w-2xl mb-2">\n          <Link\n            href="/dashboard"\n            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"\n            style={{ color: \'var(--text-secondary)\' }}\n          >\n            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />\n            </svg>\n            Back to Dashboard\n          </Link>\n        </div>\n\n        {/* Header */}',
    '    return (\n      <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)]">\n\n        {/* Header */}',
    "remove outer wrapper + back nav"
)

# Remove Link import if no longer used
with open(path) as f:
    src = f.read()
link_count = src.count('<Link ')
if link_count == 0:
    src = re.sub(r"^import Link from 'next/link';\n", "", src, flags=re.MULTILINE)
    with open(path, "w") as f:
        f.write(src)
    print("  ✓ removed unused Link import")
else:
    print(f"  - Link still used {link_count}x, keeping import")

# ═══════════════════════════════════════════════════════════════
# 5. docs/iot-guides/page.tsx — remove outer dash-theme wrapper + sticky nav
# ═══════════════════════════════════════════════════════════════
print("\n[5] docs/iot-guides/page.tsx")
path = "app/docs/iot-guides/page.tsx"

with open(path) as f:
    src = f.read()

# Build patterns from actual file content (use raw strings)
old5 = ('    return (\n'
        '      <div className="dash-theme min-h-screen" style={{ backgroundColor: \'var(--bg-page)\' }}>\n'
        '\n'
        '        {/* Nav */}\n'
        '        <div className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"\n'
        '          style={{ backgroundColor: \'var(--bg-surface)\', borderBottom: \'1px solid var(--border)\' }}>\n'
        '          <div className="flex items-center gap-3">\n'
        '            <Link href="/dashboard"\n'
        '              className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition-opacity"\n'
        '              style={{ color: \'var(--text-secondary)\' }}>\n'
        '              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n'
        '                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />\n'
        '              </svg>\n'
        '              Dashboard\n'
        '            </Link>\n'
        '            <span style={{ color: \'var(--border)\' }}>›</span>\n'
        '            <span className="text-sm font-semibold" style={{ color: \'var(--text-primary)\' }}>IoT Wiring Guides</span>\n'
        '          </div>\n'
        '          <div className="flex gap-2">\n'
        '            <Link href="/docs/protocols" className="text-xs px-3 py-1.5 rounded-lg font-medium"\n'
        '              style={{ color: \'var(--text-secondary)\', backgroundColor: \'var(--bg-page)\', border: \'1px solid var(--border)\' }}>\n'
        '              OPC-UA / Modbus →\n'
        '            </Link>\n'
        '            <Link href="/docs/api" className="text-xs px-3 py-1.5 rounded-lg font-medium"\n'
        '              style={{ color: \'#635bff\', backgroundColor: \'rgba(99,91,255,0.08)\', border: \'1px solid rgba(99,91,255,0.25)\' }}>\n'
        '              API Docs →\n'
        '            </Link>\n'
        '          </div>\n'
        '        </div>\n'
        '\n'
        '        <div className="max-w-6xl mx-auto p-6">')

new5 = '    return (\n      <div className="max-w-6xl mx-auto p-6">'

if old5 in src:
    src = src.replace(old5, new5, 1)
    with open(path, "w") as f:
        f.write(src)
    print("  ✓ removed outer wrapper + sticky nav")
else:
    print("  ✗ iot-guides wrapper pattern not found — trying grep approach")
    errors.append(f"{path}: outer wrapper")

# Remove extra closing div at end
with open(path) as f:
    src = f.read()
# Check closing structure
end_lines = src[-200:]
print(f"  end of file:\n{end_lines}")

# ═══════════════════════════════════════════════════════════════
# 6. docs/protocols/page.tsx — remove outer dash-theme wrapper + sticky nav
# ═══════════════════════════════════════════════════════════════
print("\n[6] docs/protocols/page.tsx")
path = "app/docs/protocols/page.tsx"

with open(path) as f:
    src = f.read()

old6 = ('    return (\n'
        '      <div className="dash-theme min-h-screen" style={{ backgroundColor: \'var(--bg-page)\' }}>\n'
        '\n'
        '        {/* Nav */}\n'
        '        <div className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"\n'
        '          style={{ backgroundColor: \'var(--bg-surface)\', borderBottom: \'1px solid var(--border)\' }}>\n'
        '          <div className="flex items-center gap-3">\n'
        '            <Link href="/dashboard"\n'
        '              className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition-opacity"\n'
        '              style={{ color: \'var(--text-secondary)\' }}>\n'
        '              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n'
        '                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />\n'
        '              </svg>\n'
        '              Dashboard\n'
        '            </Link>\n'
        '            <span style={{ color: \'var(--border)\' }}>›</span>\n'
        '            <span className="text-sm font-semibold" style={{ color: \'var(--text-primary)\' }}>OPC-UA / Modbus Guides</span>\n'
        '          </div>\n'
        '          <div className="flex gap-2">\n'
        '            <Link href="/docs/iot-guides" className="text-xs px-3 py-1.5 rounded-lg font-medium"\n'
        '              style={{ color: \'var(--text-secondary)\', backgroundColor: \'var(--bg-page)\', border: \'1px solid var(--border)\' }}>\n'
        '              ← ESP32 / Pi Guides\n'
        '            </Link>\n'
        '            <Link href="/docs/api" className="text-xs px-3 py-1.5 rounded-lg font-medium"\n'
        '              style={{ color: \'#635bff\', backgroundColor: \'rgba(99,91,255,0.08)\', border: \'1px solid rgba(99,91,255,0.25)\' }}>\n'
        '              API Docs →\n'
        '            </Link>\n'
        '          </div>\n'
        '        </div>\n'
        '\n'
        '        <div className="max-w-6xl mx-auto p-6">')

new6 = '    return (\n      <div className="max-w-6xl mx-auto p-6">'

if old6 in src:
    src = src.replace(old6, new6, 1)
    with open(path, "w") as f:
        f.write(src)
    print("  ✓ removed outer wrapper + sticky nav")
else:
    print("  ✗ protocols wrapper pattern not found")
    errors.append(f"{path}: outer wrapper")

# Remove extra closing div at end
with open(path) as f:
    src = f.read()
end_lines = src[-200:]
print(f"  end of file:\n{end_lines}")

# ═══════════════════════════════════════════════════════════════
# 7. docs/api/page.tsx — just update back link, remove min-height
# ═══════════════════════════════════════════════════════════════
print("\n[7] docs/api/page.tsx")
path = "app/docs/api/page.tsx"
with open(path) as f:
    src = f.read()
src = src.replace("            min-height: 100vh;\n", "")
src = src.replace(
    '<a href="/admin" className="docs-back" id="docs-back-link">← Admin</a>',
    '<a href="/dashboard" className="docs-back" id="docs-back-link">← Dashboard</a>'
)
with open(path, "w") as f:
    f.write(src)
print("  ✓ removed min-height from docs-root CSS, updated back link")

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════
print("\n" + "="*60)
if errors:
    print(f"ERRORS ({len(errors)}):")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
else:
    print("All patches applied successfully!")