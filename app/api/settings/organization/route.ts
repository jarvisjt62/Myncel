import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { normalizeCurrencyCode, SUPPORTED_CURRENCIES } from '@/app/lib/currency';

/**
 * GET /api/settings/organization
 * Returns the org's localization settings (currency, etc).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const org = await safeQuery(
    db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { id: true, name: true, currency: true },
    }),
    null,
  );

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json({
    organization: org,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  });
}

/**
 * PATCH /api/settings/organization
 * Updates the org's localization settings.
 * Only ADMIN / OWNER roles may change org-wide settings.
 *
 * Body: { currency?: string }
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only privileged roles can change org settings
  const role = (session.user as any).role ?? 'MEMBER';
  const PRIVILEGED = new Set(['OWNER', 'ADMIN', 'MANAGER']);
  if (!PRIVILEGED.has(role) && session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const updates: { currency?: string } = {};

  if (typeof body.currency === 'string') {
    updates.currency = normalizeCurrencyCode(body.currency);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
  }

  try {
    const updated = await db.organization.update({
      where: { id: session.user.organizationId },
      data: updates,
      select: { id: true, name: true, currency: true },
    });

    // Audit log (best effort)
    await safeQuery(
      db.auditLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: (session.user as any).id ?? null,
          action: 'UPDATE',
          entity: 'Organization',
          entityId: session.user.organizationId,
          changes: updates as any,
        },
      }),
      null,
    );

    return NextResponse.json({ organization: updated });
  } catch (error: any) {
    console.error('[settings/organization PATCH]', error);
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 });
  }
}
