import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * GET /api/admin/ai-chat-log
 *
 * Returns observability data for the AI support assistant:
 *   - counts (total turns today/7d/30d, llm vs fallback, thumbs up/down)
 *   - provider/model in use
 *   - recent Q&A turns (action='AI_CHAT')
 *   - recent feedback votes (action='AI_CHAT_FEEDBACK')
 *
 * Query params:
 *   - limit (default 100, max 500)
 *   - source (filter: llm | fallback_kb | fallback_generic | error)
 *   - q (search needle in question text)
 *
 * Auth: super-admin only (admin@myncel.com).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function startOf(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
  const sourceFilter = searchParams.get('source') || '';
  const qNeedle = (searchParams.get('q') || '').trim().toLowerCase();

  const today = startOf(0);
  const sevenDaysAgo = startOf(7);
  const thirtyDaysAgo = startOf(30);

  // Pull a wider window of chat rows so we can do JSON-side filtering on `source`
  // without needing a generated column. 1000 is safely cheap.
  const [
    chatRowsRaw,
    feedbackRowsRaw,
    countToday,
    count7d,
    count30d,
  ] = await Promise.all([
    safeQuery(
      db.auditLog.findMany({
        where: { action: 'AI_CHAT' },
        orderBy: { createdAt: 'desc' },
        take: Math.max(limit * 3, 300),
        include: { user: { select: { email: true, name: true } } },
      }),
      [] as any[]
    ),
    safeQuery(
      db.auditLog.findMany({
        where: { action: 'AI_CHAT_FEEDBACK' },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { user: { select: { email: true, name: true } } },
      }),
      [] as any[]
    ),
    safeQuery(db.auditLog.count({ where: { action: 'AI_CHAT', createdAt: { gte: today } } }), 0),
    safeQuery(db.auditLog.count({ where: { action: 'AI_CHAT', createdAt: { gte: sevenDaysAgo } } }), 0),
    safeQuery(db.auditLog.count({ where: { action: 'AI_CHAT', createdAt: { gte: thirtyDaysAgo } } }), 0),
  ]);

  // Map + filter on the JSON `changes` column
  let mappedChat = (chatRowsRaw as any[]).map((row) => {
    const c = (row.changes || {}) as any;
    return {
      id: row.id,
      createdAt: row.createdAt,
      userId: row.userId || null,
      userEmail: row.user?.email || null,
      userName: row.user?.name || null,
      question: c.q || '',
      answerLength: typeof c.aLen === 'number' ? c.aLen : null,
      source: c.source || 'unknown',
      provider: c.provider || null,
      model: c.model || null,
      error: c.error || null,
    };
  });

  if (sourceFilter) {
    mappedChat = mappedChat.filter((r) => r.source === sourceFilter);
  }
  if (qNeedle) {
    mappedChat = mappedChat.filter((r) => r.question.toLowerCase().includes(qNeedle));
  }
  mappedChat = mappedChat.slice(0, limit);

  const mappedFeedback = (feedbackRowsRaw as any[]).map((row) => {
    const c = (row.changes || {}) as any;
    return {
      id: row.id,
      createdAt: row.createdAt,
      userId: row.userId || null,
      userEmail: row.user?.email || null,
      rating: c.rating === 'up' ? 'up' : c.rating === 'down' ? 'down' : 'unknown',
      question: c.question || '',
      answer: c.answer || '',
      comment: c.comment || null,
    };
  });

  // Tallies across the cached chat window
  const allMapped = (chatRowsRaw as any[]).map((row) => (row.changes || {}) as any);
  const sourceTallies = {
    llm: 0,
    fallback_kb: 0,
    fallback_generic: 0,
    error: 0,
    other: 0,
  };
  for (const c of allMapped) {
    const s = c.source as keyof typeof sourceTallies;
    if (s in sourceTallies) sourceTallies[s]++;
    else sourceTallies.other++;
  }

  const ratingTallies = { up: 0, down: 0 };
  for (const c of feedbackRowsRaw as any[]) {
    const r = (c.changes || {}).rating;
    if (r === 'up') ratingTallies.up++;
    else if (r === 'down') ratingTallies.down++;
  }

  // Configuration pills
  const config = {
    groqConfigured: !!process.env.GROQ_API_KEY,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    activeProvider: process.env.GROQ_API_KEY
      ? 'groq'
      : process.env.OPENAI_API_KEY
      ? 'openai'
      : 'fallback_kb',
    activeModel:
      process.env.MYNCEL_AI_MODEL ||
      (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'n/a'),
    modelOverridden: !!process.env.MYNCEL_AI_MODEL,
  };

  return NextResponse.json({
    counts: {
      today: countToday,
      sevenDays: count7d,
      thirtyDays: count30d,
      sampleWindow: (chatRowsRaw as any[]).length,
    },
    sourceTallies,
    ratingTallies,
    config,
    chat: mappedChat,
    feedback: mappedFeedback,
    filters: { limit, source: sourceFilter || null, q: qNeedle || null },
  });
}

/**
 * DELETE /api/admin/ai-chat-log
 *
 * Modes (super-admin only, admin@myncel.com):
 *   1. ?ids=id1,id2,id3   → delete those specific AuditLog rows
 *   2. ?scope=feedback    → only operate on AI_CHAT_FEEDBACK rows (combine with above or below)
 *      ?scope=chat        → only operate on AI_CHAT rows (default)
 *      ?scope=all         → both AI_CHAT and AI_CHAT_FEEDBACK
 *   3. ?olderThanDays=N   → delete rows older than N days (in scope)
 *   4. ?all=true          → delete every row in scope (DANGEROUS)
 *
 * Always requires confirmation header X-Confirm-Delete: yes for `all=true`
 * or `olderThanDays` modes, to make accidental nuking harder.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get('ids') || '';
  const scope = (searchParams.get('scope') || 'chat').toLowerCase();
  const olderThanDays = parseInt(searchParams.get('olderThanDays') || '0', 10);
  const all = searchParams.get('all') === 'true';
  const confirm = req.headers.get('x-confirm-delete') === 'yes';

  // Build the action filter
  const actions: string[] =
    scope === 'feedback'
      ? ['AI_CHAT_FEEDBACK']
      : scope === 'all'
      ? ['AI_CHAT', 'AI_CHAT_FEEDBACK']
      : ['AI_CHAT'];

  // ---- Mode 1: by IDs ----
  if (idsParam) {
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 500);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'no valid ids' }, { status: 400 });
    }
    try {
      const result = await db.auditLog.deleteMany({
        where: {
          id: { in: ids },
          action: { in: actions },
        },
      });
      return NextResponse.json({ ok: true, deleted: result.count, mode: 'ids' });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'delete failed' }, { status: 500 });
    }
  }

  // ---- Mode 2: olderThanDays ----
  if (olderThanDays > 0) {
    if (!confirm) {
      return NextResponse.json(
        { error: 'confirmation required (X-Confirm-Delete: yes)' },
        { status: 428 }
      );
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    try {
      const result = await db.auditLog.deleteMany({
        where: {
          action: { in: actions },
          createdAt: { lt: cutoff },
        },
      });
      return NextResponse.json({
        ok: true,
        deleted: result.count,
        mode: 'olderThanDays',
        olderThanDays,
        cutoff: cutoff.toISOString(),
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'delete failed' }, { status: 500 });
    }
  }

  // ---- Mode 3: all ----
  if (all) {
    if (!confirm) {
      return NextResponse.json(
        { error: 'confirmation required (X-Confirm-Delete: yes)' },
        { status: 428 }
      );
    }
    try {
      const result = await db.auditLog.deleteMany({
        where: { action: { in: actions } },
      });
      return NextResponse.json({ ok: true, deleted: result.count, mode: 'all', scope });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'delete failed' }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: 'no delete mode specified — use ?ids=, ?olderThanDays=, or ?all=true' },
    { status: 400 }
  );
}
