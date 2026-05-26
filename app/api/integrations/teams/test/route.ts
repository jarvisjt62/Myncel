/**
 * POST /api/integrations/teams/test
 *
 * Send a manual test card to the connected Teams channel.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { sendTeamsAlert } from '@/lib/teams';

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await safeQuery(
      () => db.user.findUnique({ where: { id: session.user.id }, select: { organizationId: true } }),
      null
    );
    if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const integration = await safeQuery(
      () => db.integration.findFirst({ where: { organizationId: user.organizationId, type: 'MS_TEAMS' as any } }),
      null
    );
    if (!integration?.webhookUrl || integration.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Microsoft Teams is not connected. Connect it first.' }, { status: 400 });
    }

    const res = await sendTeamsAlert({
      webhookUrl: integration.webhookUrl,
      title: 'Myncel test alert',
      badge: 'Manual test',
      severity: 'info',
      message: `${session.user.email} clicked "Test" on the Myncel Integrations page. This is just a connectivity check — no real alert.`,
      facts: [
        { name: 'When', value: new Date().toLocaleString() },
        { name: 'Triggered by', value: session.user.email || 'unknown' },
      ],
      actions: [
        { title: 'Open dashboard', url: 'https://www.myncel.com/dashboard' },
      ],
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Test card was rejected', detail: res.error }, { status: 502 });
    }
    return NextResponse.json({ success: true, message: 'Test card posted to Teams.' });
  } catch (err: any) {
    console.error('[teams/test]', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
