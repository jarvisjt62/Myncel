/**
 * POST /api/integrations/pagerduty/test
 *
 * Manually triggers (and immediately resolves) a test incident on the
 * connected PagerDuty service. Used by the "Test" button on the
 * Integrations settings page.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { pagerDutyTrigger, pagerDutyResolve } from '@/lib/pagerduty';

export async function POST(_req: NextRequest) {
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

    const integration = await safeQuery(
      () => db.integration.findFirst({ where: { organizationId: user.organizationId, type: 'PAGERDUTY' as any } }),
      null
    );
    if (!integration?.apiKey || integration.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'PagerDuty is not connected. Connect it first.' }, { status: 400 });
    }

    const dedupKey = `myncel-manual-test-${integration.organizationId}-${Date.now()}`;
    const triggerRes = await pagerDutyTrigger({
      routingKey: integration.apiKey,
      dedupKey,
      summary: '🧪 Myncel test alert — please ignore',
      source: 'Myncel',
      severity: 'warning',
      class: 'manual_test',
      customDetails: {
        triggeredBy: session.user.email,
        triggeredAt: new Date().toISOString(),
        note: 'This was triggered by the "Test" button on the Myncel Integrations page. It auto-resolves in 5 seconds.',
      },
      clickThroughUrl: 'https://www.myncel.com/settings/integrations',
    });

    if (!triggerRes.ok || (triggerRes.data as any)?.status !== 'success') {
      return NextResponse.json(
        { error: 'PagerDuty rejected the test trigger', detail: triggerRes.data },
        { status: 502 }
      );
    }

    /* Auto-resolve after 5 seconds — the on-call gets a fast no-op flicker
       on their timeline, NOT a real page. */
    setTimeout(() => {
      pagerDutyResolve({ routingKey: integration.apiKey!, dedupKey }).catch(() => {});
    }, 5000);

    return NextResponse.json({
      success: true,
      message: 'Test incident triggered on PagerDuty. It will auto-resolve in 5 seconds.',
      dedupKey,
    });
  } catch (err: any) {
    console.error('[pagerduty/test]', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
