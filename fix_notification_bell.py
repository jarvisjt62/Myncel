with open('app/components/NotificationBell.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = '        body: JSON.stringify({ notificationId }),'
new = '        body: JSON.stringify({ notificationIds: [notificationId] }),'

if old in content:
    content = content.replace(old, new, 1)
    print("Fixed notificationId -> notificationIds")
else:
    print("NOT FOUND")
    idx = content.find('notificationId')
    print(repr(content[max(0,idx-50):idx+100]))

# Also fix isRead -> readAt check in the UI
old2 = "n.id === notificationId ? { ...n, isRead: true } : n"
new2 = "n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n"
if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Fixed isRead -> readAt")

with open('app/components/NotificationBell.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")