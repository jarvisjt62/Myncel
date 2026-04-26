with open('app/components/NotificationBell.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = (
    "      if (response.ok) {\n"
    "        setNotifications((prev) =>\n"
    "          prev.map((n) => ({ ...n, isRead: true }))\n"
    "        );\n"
    "        setUnreadCount(0);\n"
    "      }"
)

new = (
    "      if (response.ok) {\n"
    "        setNotifications((prev) =>\n"
    "          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))\n"
    "        );\n"
    "        setUnreadCount(0);\n"
    "      }"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Fixed markAllAsRead in Bell")
else:
    print("NOT FOUND")
    idx = content.find('isRead: true')
    print(repr(content[max(0,idx-120):idx+120]))

with open('app/components/NotificationBell.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")