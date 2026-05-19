import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { guardPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = await guardPermission((session.user as any).id, 'parts.create');
    if (denied) return denied;

    const isAdmin = session.user.email === 'admin@myncel.com';

    const body = await req.json();
    const { name, partNumber, description, quantity, minQuantity, unitCost, supplier, location, imageUrl, organizationId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Part name is required' }, { status: 400 });
    }

    // Admin can specify organizationId; org users use their own
    const targetOrgId = isAdmin && organizationId ? organizationId : session.user.organizationId;
    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Admin: verify the org exists; Org user: already verified by session
    if (isAdmin && organizationId) {
      const org = await db.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
    }

    // Stamp the part with the org's current currency
    const orgCurrency = await db.organization.findUnique({
      where: { id: targetOrgId },
      select: { currency: true },
    }).then(o => o?.currency ?? 'USD').catch(() => 'USD');

    const part = await db.part.create({
      data: {
        name: name.trim(),
        partNumber: partNumber?.trim() || null,
        description: description?.trim() || null,
        quantity: typeof quantity === 'number' ? quantity : parseInt(quantity) || 0,
        minQuantity: typeof minQuantity === 'number' ? minQuantity : parseInt(minQuantity) || 1,
        unitCost: typeof unitCost === 'number' ? unitCost : (unitCost ? parseFloat(unitCost) : null),
        currency: orgCurrency,
        supplier: supplier?.trim() || null,
        location: location?.trim() || null,
        imageUrl: imageUrl || null,
        organizationId: targetOrgId,
      },
    });

    return NextResponse.json({ success: true, part }, { status: 201 });
  } catch (error) {
    console.error('Create part error:', error);
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.email === 'admin@myncel.com';
    const url = new URL(req.url);
    const orgFilter = url.searchParams.get('organizationId');

    // Admin can query any org's parts; org users see only their own
    const where = isAdmin && orgFilter
      ? { organizationId: orgFilter }
      : { organizationId: session.user.organizationId };

    const parts = await db.part.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ parts });
  } catch (error) {
    console.error('Get parts error:', error);
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}