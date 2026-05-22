import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * POST /api/chat/ai/feedback
 *
 * Records 👍/👎 feedback on an AI chat answer. Auth is OPTIONAL (we want
 * marketing-site visitors to be able to vote too). Best-effort log to
 * AuditLog so we can review which answers users found helpful.
 *
 * Body: { question, answer, rating: 'up'|'down', comment?, messageId? }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const userId = session?.user?.id || null;

    const body = await req.json().catch(() => ({}));
    const rating = body?.rating;
    if (rating !== 'up' && rating !== 'down') {
      return NextResponse.json({ error: 'rating must be up or down' }, { status: 400 });
    }

    const question = (body?.question || '').toString().slice(0, 500);
    const answer = (body?.answer || '').toString().slice(0, 2000);
    const comment = (body?.comment || '').toString().slice(0, 500);
    const messageId = (body?.messageId || '').toString().slice(0, 80);

    try {
      await db.auditLog.create({
        data: {
          userId,
          action: 'AI_CHAT_FEEDBACK',
          entity: 'ChatMessage',
          entityId: messageId || null,
          changes: {
            rating,
            question,
            answer,
            comment: comment || null,
            at: new Date().toISOString(),
          } as any,
        },
      });
    } catch {
      /* best-effort */
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[chat/ai/feedback] error:', err?.message || err);
    // Never break the UI
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
