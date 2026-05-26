/**
 * POST /api/integrations/pagerduty/connect
 *   body: { routingKey: string, serviceName?: string }
 *
 * Saves the routingKey on the org-scoped Integration row so subsequent
 * alert triggers can fan out to PagerDuty.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { pagerDutyTrigger } from '@/lib/pagerduty';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await safeQuery(
      () => db.user.findUnique({ where: { id: session.user.id }, select: { organizationId: true } }),
      null
    );
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const routingKey = String(body.routingKey || '').trim();
    const serviceName = String(body.serviceName || 'Myncel Alerts').trim();

    if (!/^[a-fA-F0-9]{32}$/.test(routingKey)) {
      return NextResponse.json(
        { error: 'Invalid PagerDuty Integration Key. It should be a 32-character hexadecimal string from PagerDuty → Service → Integrations.' },
        { status: 400 }
      );
    }

    /* Validate by sending a real trigger + immediate resolve so the user
       sees a single "Test from Myncel" incident appear and clear in their
       PagerDuty timeline. If the routing_key is bad PagerDuty returns
       400 / invalid_event_action / etc. */
    const dedupKey = `myncel-connect-test-${user.organizationId}`;
    const triggerRes = await pagerDutyTrigger({
      routingKey,
      dedupKey,
      summary: `✅ Myncel connection test — ${serviceName}`,
      source: 'Myncel',
      severity: 'info',
      class: 'connection_test',
      customDetails: {
        organizationId: user.organizationId,
        connectedBy: session.user.email,
        purpose: 'This is a one-shot test triggered when the integration was first connected.',
      },
      clickThroughUrl: 'https://www.myncel.com/settings/integrations',
    });

    if (!triggerRes.ok || (triggerRes.data as any)?.status !== 'success') {
      return NextResponse.json(
        {
          error: 'PagerDuty rejected the routing key',
          detail: triggerRes.data,
          status: triggerRes.status,
        },
        { status: 400 }
      );
    }

    /* Immediately resolve the test so the on-call doesn't get woken up. */
    const { pagerDutyResolve } = await import('@/lib/pagerduty');
    await pagerDutyResolve({ routingKey, dedupKey });

    /* Persist. */
    const existing = await safeQuery(
      () =>
        db.integration.findFirst({
          where: { organizationId: user.organizationId, type: 'PAGERDUTY' as any },
        }),
      null
    );

    if (existing) {
      await db.integration.update({
        where: { id: existing.id },
        data: {
          status: 'CONNECTED',
          name: `PagerDuty — ${serviceName}`,
          config: { serviceName },
          apiKey: routingKey, // stored in apiKey column (encrypted-at-rest by Postgres)
          connectedAt: new Date(),
          disconnectedAt: null,
        },
      });
    } else {
      await db.integration.create({
        data: {
          organizationId: user.organizationId,
          type: 'PAGERDUTY' as any,
          name: `PagerDuty — ${serviceName}`,
          status: 'CONNECTED',
          config: { serviceName },
          apiKey: routingKey,
          connectedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'PagerDuty connected. A test incident was triggered + resolved on your service so you can see Myncel in your timeline.',
    });
  } catch (err: any) {
    console.error('[pagerduty/connect]', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
