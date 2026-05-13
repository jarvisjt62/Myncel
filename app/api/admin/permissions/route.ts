import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const PLATFORM_ADMIN = 'admin@myncel.com';

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (session.user.email !== PLATFORM_ADMIN) {
    return { error: NextResponse.json({ error: 'Forbidden — Platform admin only' }, { status: 403 }) };
  }
  return { session };
}

// GET /api/admin/permissions — full permission catalog grouped by category
export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const perms = await db.permission.findMany({ orderBy: [{ category: 'asc' }, { label: 'asc' }] });
  const byCategory: Record<string, typeof perms> = {};
  for (const p of perms) {
    (byCategory[p.category] ||= []).push(p);
  }
  return NextResponse.json({ permissions: perms, byCategory });
}

// POST /api/admin/permissions — add a new custom permission to the catalog
// body: { key, category, label, description? }
export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { key, category, label, description } = body ?? {};
  if (!key || !category || !label) {
    return NextResponse.json({ error: 'key, category and label are required' }, { status: 400 });
  }
  const normalKey = String(key).toLowerCase().trim();
  const existing = await db.permission.findUnique({ where: { key: normalKey } });
  if (existing) return NextResponse.json({ error: 'Permission key already exists' }, { status: 409 });

  const created = await db.permission.create({
    data: { key: normalKey, category: String(category).trim(), label: String(label).trim(), description: description ?? null, isCustom: true },
  });
  return NextResponse.json({ permission: created }, { status: 201 });
}
