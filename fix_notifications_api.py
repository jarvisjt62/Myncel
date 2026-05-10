# Fix notifications API to update both readAt and isRead
with open('app/api/notifications/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix markAllRead - update both readAt and isRead
old1 = '''      if (markAllRead) {
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

new1 = '''      if (markAllRead) {
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
    print("Fixed API to update both readAt and isRead")
else:
    print("API patch NOT FOUND")
    idx = content.find('markAllRead')
    print(repr(content[max(0,idx-20):idx+400]))

# Also fix the where clause for unreadOnly to use isRead
old2 = '      ...(unreadOnly && { readAt: null }),'
new2 = '      ...(unreadOnly && { isRead: false }),'
if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Fixed unreadOnly filter")

# Fix unreadCount query
old3 = '''      const unreadCount = await db.notification.count({
        where: {
          userId: session.user.id,
          readAt: null,
        },
      });'''
new3 = '''      const unreadCount = await db.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      });'''
if old3 in content:
    content = content.replace(old3, new3, 1)
    print("Fixed unreadCount query")

with open('app/api/notifications/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")