/**
 * POST /api/admin/indexnow-ping
 *
 * Super-Admin endpoint that submits a list of URLs to IndexNow, which
 * forwards to Bing + Yandex (and friends). Two modes:
 *
 *   { mode: 'urls', urls: ['https://www.myncel.com/foo', ...] }
 *      explicit list. Use this for newly published / updated content.
 *
 *   { mode: 'all-blog' }
 *      submit every known blog article from lib/blog-articles.ts plus
 *      the homepage, pricing, and blog index. Use this once after
 *      enabling IndexNow to seed Bing/Yandex with everything we have.
 *
 * Auth: NextAuth session, email === admin@myncel.com.
 *
 * Audit-logged as PLATFORM_INDEXNOW_PING for traceability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { submitToIndexNow } from '@/lib/indexnow';
import { BLOG_ARTICLES, SITE_URL } from '@/lib/blog-articles';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = { mode: 'all-blog' };
  }

  const mode = payload?.mode === 'urls' ? 'urls' : 'all-blog';

  let urls: string[] = [];
  if (mode === 'urls') {
    urls = Array.isArray(payload.urls)
      ? payload.urls.filter((u: unknown) => typeof u === 'string')
      : [];
  } else {
    urls = [
      `${SITE_URL}/`,
      `${SITE_URL}/pricing`,
      `${SITE_URL}/blog`,
      ...BLOG_ARTICLES.map((a) => `${SITE_URL}/blog/${a.slug}`),
    ];
  }

  const result = await submitToIndexNow(urls);

  // Audit log; best-effort, never block the response.
  try {
    await db.auditLog.create({
      data: {
        action: 'PLATFORM_INDEXNOW_PING',
        entity: 'Platform',
        userId: (session.user as any).id ?? null,
        changes: {
          mode,
          submitted: result.submitted,
          ok: result.ok,
          status: result.status,
          statusText: result.statusText,
          urlsSample: urls.slice(0, 5),
          urlsTotal: urls.length,
        } as any,
      },
    });
  } catch {
    /* audit failure is non-fatal */
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
