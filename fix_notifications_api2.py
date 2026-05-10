with open('app/api/notifications/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old1 = '''    if (markAllRead) {
      await db.notification.updateMany({
        where: {
          userId: session.user.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          readAt: new Date(),
        },
      });
    }'''

new1 = '''    if (markAllRead) {
      await db.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          readAt: new Date(),
          isRead: true,
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          readAt: new Date(),
          isRead: true,
        },
      });
    }'''

if old1 in content:
    content = content.replace(old1, new1, 1)
    print("Fixed API markAllRead + notificationIds")
else:
    print("NOT FOUND - showing context")
    idx = content.find('markAllRead')
    print(repr(content[max(0,idx-10):idx+500]))

# Fix unreadCount
old2 = '''    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });'''
new2 = '''    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });'''
if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Fixed unreadCount query")
else:
    print("unreadCount NOT FOUND")

with open('app/api/notifications/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")