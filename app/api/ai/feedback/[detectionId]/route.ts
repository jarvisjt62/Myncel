/**
 * POST /api/ai/feedback/[detectionId]
 *   Body: { feedback: 'CONFIRMED' | 'REJECTED' }
 *
 * Operator confirms or rejects an AI-flagged anomaly. Used to suppress
 * future false positives (REJECTED) and — in the future — train the model.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { recordFeedback } from '@/lib/ai/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { detectionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await safeQuery(
    () =>
      db.user.findUnique({
        where: { id: (session.user as any).id },
        select: { organizationId: true },
      }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const detection = await safeQuery(
    () =>
      db.anomalyDetection.findFirst({
        where: { id: params.detectionId, organizationId: user.organizationId! },
      }),
    null,
  );
  if (!detection) return NextResponse.json({ error: 'Detection not found' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (body.feedback !== 'CONFIRMED' && body.feedback !== 'REJECTED') {
    return NextResponse.json({ error: 'feedback must be CONFIRMED or REJECTED' }, { status: 400 });
  }

  const updated = await recordFeedback(params.detectionId, body.feedback);
  return NextResponse.json({ detection: updated });
}
