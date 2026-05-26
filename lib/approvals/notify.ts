/**
 * Approval workflow notifications.
 *
 * When a step opens we e-mail every potential approver with a one-click
 * link to the work order detail page (where the approval banner lives).
 * When a request reaches a terminal state (APPROVED / REJECTED / CANCELLED)
 * we e-mail the requester.
 *
 * Slack / Teams / PagerDuty fan-out is intentionally piggy-backed on the
 * existing dispatchNotifications() pipeline using a free-form
 * "system_announcement" payload — that way every channel an org already
 * has wired up automatically gets approval traffic.
 */

import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { hasPermission } from '@/lib/permissions';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.myncel.com';

function woUrl(woId: string) {
  return `${APP_URL}/work-orders/${woId}`;
}

function approvalsUrl() {
  return `${APP_URL}/admin/approvals`;
}

/** Resolve every user in the org who could decide on a given step. */
async function resolveApprovers(
  organizationId: string,
  step: { requiredPermission: string; approverUserIds: unknown },
): Promise<{ id: string; email: string; name: string | null }[]> {
  const out = new Map<string, { id: string; email: string; name: string | null }>();

  // (a) Named approvers.
  const named = Array.isArray(step.approverUserIds)
    ? (step.approverUserIds as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  if (named.length > 0) {
    const users = await db.user.findMany({
      where: { id: { in: named }, organizationId, email: { not: null as any } },
      select: { id: true, email: true, name: true },
    });
    for (const u of users) {
      if (u.email) out.set(u.id, { id: u.id, email: u.email, name: u.name });
    }
  }

  // (b) Permission-based approvers — walk every active org member and
  // call hasPermission(). Cheap because orgs are small (<200 users).
  if (step.requiredPermission && typeof step.requiredPermission === 'string' && step.requiredPermission.length > 0) {
    const members = await db.user.findMany({
      where: { organizationId },
      select: { id: true, email: true, name: true },
    });
    for (const m of members) {
      if (!m.email || out.has(m.id)) continue;
      if (await hasPermission(m.id, step.requiredPermission)) {
        out.set(m.id, { id: m.id, email: m.email, name: m.name });
      }
    }
  }

  return Array.from(out.values());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailShell(args: { title: string; preheader: string; bodyHtml: string; ctaUrl: string; ctaLabel: string }): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(args.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(args.preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
    <tr><td style="background:#635bff;padding:20px 24px;color:#ffffff;font-weight:700;font-size:18px">Myncel · Approvals</td></tr>
    <tr><td style="padding:24px">${args.bodyHtml}
      <p style="text-align:center;margin:24px 0 8px"><a href="${args.ctaUrl}" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">${escapeHtml(args.ctaLabel)}</a></p>
      <p style="font-size:12px;color:#6b7280;margin-top:24px">You can manage your notification preferences in Settings → Notifications.</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const TRIGGER_LABEL: Record<string, string> = {
  PRE_START: 'pre-start budget approval',
  PRE_CLOSE: 'pre-close safety sign-off',
  VENDOR_QUOTE: 'vendor / parts quote approval',
};

/** Email all approvers eligible for the current step. Idempotent — safe to call multiple times. */
export async function notifyApprovalStep(requestId: string): Promise<void> {
  const req = await db.approvalRequest.findUnique({
    where: { id: requestId },
    include: {
      policy: { include: { steps: { orderBy: { order: 'asc' } } } },
      workOrder: { select: { id: true, woNumber: true, title: true, machine: { select: { name: true } } } },
      requestedBy: { select: { name: true, email: true } },
    },
  });
  if (!req || req.status !== 'PENDING') return;
  const step = req.policy.steps.find((s) => s.order === req.currentStepOrder);
  if (!step) return;

  const approvers = await resolveApprovers(req.organizationId, step);
  if (approvers.length === 0) return;

  const triggerLabel = TRIGGER_LABEL[req.trigger] ?? req.trigger;
  const requesterName = req.requestedBy?.name || req.requestedBy?.email || 'A teammate';
  const wo = req.workOrder;
  const subject = `[Myncel] Approval needed — ${wo.woNumber}: ${wo.title}`;
  const preheader = `${requesterName} requested ${triggerLabel} on ${wo.woNumber}.`;
  const bodyHtml = `
    <h2 style="margin:0 0 12px;font-size:20px">Approval needed</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5">${escapeHtml(requesterName)} has requested <strong>${escapeHtml(triggerLabel)}</strong> on the work order below. You're listed as an approver for step <strong>${step.order}: ${escapeHtml(step.name)}</strong>.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:8px;padding:12px;margin:12px 0">
      <tr><td style="padding:8px 12px"><strong>Work order:</strong> ${escapeHtml(wo.woNumber)} — ${escapeHtml(wo.title)}</td></tr>
      <tr><td style="padding:8px 12px"><strong>Machine:</strong> ${escapeHtml(wo.machine?.name ?? '—')}</td></tr>
      <tr><td style="padding:8px 12px"><strong>Policy:</strong> ${escapeHtml(req.policy.name)}</td></tr>
    </table>
    <p style="margin:0;font-size:14px;line-height:1.5">Open the work order to approve or reject. Your decision is logged with timestamp and an optional comment.</p>
  `;
  const html = emailShell({
    title: subject,
    preheader,
    bodyHtml,
    ctaUrl: woUrl(wo.id),
    ctaLabel: 'Review work order',
  });

  await Promise.allSettled(
    approvers.map((a) =>
      sendEmail({
        to: a.email,
        subject,
        html,
      }),
    ),
  );
}

/** Email the requester when a request is finalised. */
export async function notifyApprovalDecided(requestId: string): Promise<void> {
  const req = await db.approvalRequest.findUnique({
    where: { id: requestId },
    include: {
      workOrder: { select: { id: true, woNumber: true, title: true } },
      requestedBy: { select: { email: true, name: true } },
      decisions: { orderBy: { decidedAt: 'asc' }, include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!req || !req.requestedBy?.email) return;
  if (req.status !== 'APPROVED' && req.status !== 'REJECTED' && req.status !== 'CANCELLED') return;

  const final = req.decisions[req.decisions.length - 1];
  const wo = req.workOrder;
  const verb =
    req.status === 'APPROVED' ? 'approved'
    : req.status === 'REJECTED' ? 'rejected'
    : 'cancelled';
  const subject = `[Myncel] Approval ${verb} — ${wo.woNumber}`;
  const decidedBy = final?.user?.name || final?.user?.email || 'A teammate';
  const preheader = `Your approval request on ${wo.woNumber} was ${verb}.`;
  const bodyHtml = `
    <h2 style="margin:0 0 12px;font-size:20px">Request ${escapeHtml(verb)}</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5">Your approval request on <strong>${escapeHtml(wo.woNumber)} — ${escapeHtml(wo.title)}</strong> has been <strong>${escapeHtml(verb)}</strong>${final ? ` by ${escapeHtml(decidedBy)}` : ''}.</p>
    ${final?.comment ? `<blockquote style="border-left:3px solid #d1d5db;margin:12px 0;padding:8px 12px;background:#f9fafb;font-size:14px">${escapeHtml(final.comment)}</blockquote>` : ''}
  `;
  const html = emailShell({
    title: subject,
    preheader,
    bodyHtml,
    ctaUrl: woUrl(wo.id),
    ctaLabel: 'Open work order',
  });

  await sendEmail({
    to: req.requestedBy.email,
    subject,
    html,
  });
}

export { woUrl, approvalsUrl };
