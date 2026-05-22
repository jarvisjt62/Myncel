import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { MYNCEL_SYSTEM_PROMPT, findFallbackAnswer } from '@/lib/ai/myncel-knowledge';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MODEL = process.env.MYNCEL_AI_MODEL || 'gpt-4o-mini';
const MAX_HISTORY = 12;

/**
 * Best-effort observability log. Never throws.
 */
async function logChat(opts: {
  userId: string | null;
  question: string;
  answerLength: number;
  source: 'llm' | 'fallback_kb' | 'fallback_generic' | 'error';
  model?: string;
  error?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: opts.userId || null,
        action: 'AI_CHAT',
        entity: 'ChatMessage',
        changes: {
          q: opts.question.slice(0, 500),
          aLen: opts.answerLength,
          source: opts.source,
          model: opts.model,
          error: opts.error,
          at: new Date().toISOString(),
        } as any,
      },
    });
  } catch {
    // swallow — observability must never break chat
  }
}

/**
 * Final safety net if both LLM and KB fail to produce something useful.
 */
function genericHelpfulFallback(question: string): string {
  const kb = findFallbackAnswer(question);
  if (kb) return kb;
  return [
    "I want to give you an accurate answer, but I'm not 100% sure about that one.",
    '',
    "Here's what I can definitely help with right now:",
    '• Adding equipment, creating work orders, scheduling preventive maintenance',
    '• Pricing & plan limits (Starter, Growth, Professional, Enterprise)',
    '• Inviting teammates and roles',
    '• Predictive maintenance, alerts, mobile push notifications',
    '• Account & billing basics',
    '',
    "If your question is something more specific (an outage, a billing issue, or something custom to your setup), switch to **Live Support** in this chat and a human teammate will jump in.",
  ].join('\n');
}

export async function POST(req: NextRequest) {
  let question = '';
  let userId: string | null = null;

  try {
    // Auth is OPTIONAL — we want public visitors on the marketing site
    // to be able to ask questions too. We just record who they are if known.
    const session = await getServerSession(authOptions).catch(() => null);
    userId = session?.user?.id || null;

    const body = await req.json().catch(() => ({}));
    question = (body?.question || '').toString().trim();
    const rawHistory = Array.isArray(body?.history) ? body.history : [];

    if (!question) {
      return NextResponse.json(
        { response: "Ask me anything about Myncel — features, pricing, how to do something in the app, or troubleshooting." },
        { status: 200 }
      );
    }

    // Sanitize history: only valid roles, trimmed content, capped count
    const history: Message[] = rawHistory
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_HISTORY)
      .map((m: any) => ({ role: m.role, content: m.content.toString().slice(0, 4000) }));

    const apiKey = process.env.OPENAI_API_KEY;

    // ---- Path A: real LLM ----
    if (apiKey) {
      try {
        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
          model: MODEL,
          temperature: 0.4,
          max_tokens: 600,
          messages: [
            { role: 'system', content: MYNCEL_SYSTEM_PROMPT },
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: question },
          ],
        });

        const answer =
          completion.choices?.[0]?.message?.content?.trim() ||
          genericHelpfulFallback(question);

        // fire-and-forget log
        logChat({
          userId,
          question,
          answerLength: answer.length,
          source: 'llm',
          model: MODEL,
        });

        return NextResponse.json({ response: answer, source: 'llm' });
      } catch (llmErr: any) {
        // LLM failed (rate limit, network, bad key, etc.) — gracefully degrade
        console.error('[chat/ai] LLM error:', llmErr?.message || llmErr);

        const kb = findFallbackAnswer(question);
        const answer = kb || genericHelpfulFallback(question);

        logChat({
          userId,
          question,
          answerLength: answer.length,
          source: kb ? 'fallback_kb' : 'fallback_generic',
          error: String(llmErr?.message || llmErr).slice(0, 300),
        });

        return NextResponse.json({ response: answer, source: 'fallback' });
      }
    }

    // ---- Path B: no API key configured — use grounded KB ----
    const kb = findFallbackAnswer(question);
    const answer = kb || genericHelpfulFallback(question);

    logChat({
      userId,
      question,
      answerLength: answer.length,
      source: kb ? 'fallback_kb' : 'fallback_generic',
    });

    return NextResponse.json({ response: answer, source: 'fallback' });
  } catch (error: any) {
    console.error('[chat/ai] fatal error:', error?.message || error);

    const safe = genericHelpfulFallback(question || '');
    logChat({
      userId,
      question: question || '(unparsed)',
      answerLength: safe.length,
      source: 'error',
      error: String(error?.message || error).slice(0, 300),
    });

    // Never 500 — the chat widget should always get something to render
    return NextResponse.json({ response: safe, source: 'error' }, { status: 200 });
  }
}
