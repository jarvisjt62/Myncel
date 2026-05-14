/**
 * Centralized notification helper.
 * Sends in-app notifications, emails, and SMS to users.
 */
import { db } from '@/lib/db';
import { sendWorkOrderAssignedEmail, sendAlertNotificationEmail } from '@/lib/email';
import { broadcastSms, workOrderSmsMessage, alertSmsMessage } from '@/lib/notifications/sms';

// ─── In-app notification ──────────────────────────────────────────────────────

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  priority = 'NORMAL',
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}) {
  try {
    return await db.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        link,
        priority,
      },
    });
  } catch (error) {
    console.error('[notify] Failed to create notification:', error);
    return null;
  }
}

// ─── Work Order Assignment ────────────────────────────────────────────────────

export async function notifyWorkOrderAssigned({
  workOrderId,
  assignedToId,
  assignedById,
}: {
  workOrderId: string;
  assignedToId: string;
  assignedById?: string | null;
}) {
  try {
    const [wo, assignee, assigner] = await Promise.all([
      db.workOrder.findUnique({
        where: { id: workOrderId },
        select: {
          woNumber: true,
          title: true,
          priority: true,
          dueAt: true,
          machine: { select: { name: true } },
          organization: { select: { name: true } },
        },
      }),
      db.user.findUnique({
        where: { id: assignedToId },
        select: { name: true, email: true },
      }),
      assignedById
        ? db.user.findUnique({ where: { id: assignedById }, select: { name: true } })
        : null,
    ]);

    if (!wo || !assignee) return;

    const assignerName = assigner?.name || 'Your manager';

    // In-app notification
    await createNotification({
      userId: assignedToId,
      type: 'WORK_ORDER_ASSIGNED',
      title: `Work Order Assigned: ${wo.woNumber}`,
      message: `${assignerName} assigned you "${wo.title}" on ${wo.machine?.name}. Priority: ${wo.priority}.`,
      link: '/dashboard',
      priority: wo.priority === 'CRITICAL' ? 'URGENT' : wo.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
    });

    // Email notification
    if (assignee.email) {
      await sendWorkOrderAssignedEmail(
        assignee.email,
        assignee.name || 'Technician',
        wo.title,
        wo.woNumber,
        wo.machine?.name || 'Unknown Machine',
        wo.priority,
        wo.dueAt,
        assignerName
      ).catch(console.error);
    }

    // SMS notification — send to the org's SMS settings phone number if enabled
    try {
      const assigneeUser = await db.user.findUnique({
        where: { id: assignedToId },
        select: { organizationId: true },
      });
      const orgId = assigneeUser?.organizationId;
      if (orgId) {
        const [settings, organization] = await Promise.all([
          db.notificationSetting.findFirst({ where: { organizationId: orgId } }),
          db.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
        ]);
        if (settings?.smsEnabled && settings?.smsWorkOrders && settings?.phoneNumber) {
          const appUrl = process.env.NEXTAUTH_URL || 'https://myncel.com';
          const smsText = workOrderSmsMessage({
            workOrderNumber: wo.woNumber,
            title: wo.title,
            machineName: wo.machine?.name || 'Unknown Machine',
            priority: wo.priority,
            orgName: organization?.name,
            dashboardUrl: `${appUrl}/dashboard`,
          });
          broadcastSms(orgId, smsText, settings.smsCriticalOnly).catch(err =>
            console.error('[notify] SMS dispatch error:', err)
          );
        }
      }
    } catch (err) {
      console.error('[notify] SMS notification check error:', err);
    }
  } catch (error) {
    console.error('[notify] Failed to notify work order assignment:', error);
  }
}

// ─── Alert Notification ───────────────────────────────────────────────────────

export async function notifyAlert({
  alertId,
  organizationId,
}: {
  alertId: string;
  organizationId: string;
}) {
  try {
    const alert = await db.alert.findUnique({
      where: { id: alertId },
      select: {
        title: true,
        message: true,
        severity: true,
        machine: { select: { name: true } },
      },
    });

    if (!alert) return;

    // Find all OWNER and ADMIN users in the org, plus any technician assigned to this machine
    const recipients = await db.user.findMany({
      where: {
        organizationId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      select: { id: true, name: true, email: true },
    });

    // Also notify TECHNICIAN if severity is CRITICAL or HIGH
    if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
      const technicians = await db.user.findMany({
        where: { organizationId, role: 'TECHNICIAN' },
        select: { id: true, name: true, email: true },
      });
      recipients.push(...technicians);
    }

    // Deduplicate by id
    const seen = new Set<string>();
    const uniqueRecipients = recipients.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    const machineName = alert.machine?.name || 'Unknown Machine';

    await Promise.all(
      uniqueRecipients.map(async (user) => {
        // In-app
        await createNotification({
          userId: user.id,
          type: 'WORK_ORDER_ASSIGNED', // reusing type; ideally extend NotificationType enum
          title: `${alert.severity} Alert: ${alert.title}`,
          message: `${machineName}: ${alert.message}`,
          link: '/dashboard',
          priority: alert.severity === 'CRITICAL' ? 'URGENT' : alert.severity === 'HIGH' ? 'HIGH' : 'NORMAL',
        });

        // Email for CRITICAL and HIGH
        if (user.email && (alert.severity === 'CRITICAL' || alert.severity === 'HIGH')) {
          await sendAlertNotificationEmail(
            user.email,
            user.name || 'Team Member',
            alert.title,
            alert.message,
            alert.severity,
            machineName
          ).catch(console.error);
        }
      })
    );

    // SMS notification for alerts
    try {
      const [settings, organization] = await Promise.all([
        db.notificationSetting.findFirst({ where: { organizationId } }),
        db.organization.findUnique({ where: { id: organizationId }, select: { name: true } }),
      ]);
      if (settings?.smsEnabled && settings?.smsAlerts && settings?.phoneNumber) {
        const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
        if (!settings.smsCriticalOnly || isCritical) {
          const appUrl = process.env.NEXTAUTH_URL || 'https://myncel.com';
          const smsText = alertSmsMessage({
            alertTitle: alert.title,
            machineName,
            severity: alert.severity,
            orgName: organization?.name,
            dashboardUrl: `${appUrl}/dashboard`,
          });
          broadcastSms(organizationId, smsText, settings.smsCriticalOnly).catch(err =>
            console.error('[notify] SMS alert dispatch error:', err)
          );
        }
      }
    } catch (err) {
      console.error('[notify] SMS alert notification check error:', err);
    }
  } catch (error) {
    console.error('[notify] Failed to notify alert:', error);
  }
}

// ─── Work Order Update ────────────────────────────────────────────────────────

export async function notifyWorkOrderUpdated({
  workOrderId,
  updatedById,
  newStatus,
}: {
  workOrderId: string;
  updatedById: string;
  newStatus: string;
}) {
  try {
    const wo = await db.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        woNumber: true,
        title: true,
        assignedToId: true,
        createdById: true,
      },
    });
    if (!wo) return;

    const updater = await db.user.findUnique({ where: { id: updatedById }, select: { name: true } });
    const statusLabel = newStatus.replace('_', ' ');

    // Notify the creator if it's not the same person updating
    const notifyIds = [wo.assignedToId, wo.createdById].filter(
      (id): id is string => !!id && id !== updatedById
    );

    await Promise.all(
      notifyIds.map((userId) =>
        createNotification({
          userId,
          type: 'WORK_ORDER_UPDATED',
          title: `Work Order ${wo.woNumber} Updated`,
          message: `${updater?.name || 'Someone'} updated "${wo.title}" — status changed to ${statusLabel}.`,
          link: '/dashboard',
          priority: 'NORMAL',
        })
      )
    );
  } catch (error) {
    console.error('[notify] Failed to notify work order update:', error);
  }
}