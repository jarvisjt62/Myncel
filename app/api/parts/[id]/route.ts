import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/parts/[id] - Get a single part
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId && session?.user?.email !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const part = await db.part.findUnique({
      where: { id: params.id },
      include: { organization: { select: { id: true, name: true } } },
    });

    if (!part) return NextResponse.json({ error: 'Part not found' }, { status: 404 });

    // Non-admin: must belong to their org
    if (session.user.email !== 'admin@myncel.com' && part.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ part });
  } catch (error) {
    console.error('Get part error:', error);
    return NextResponse.json({ error: 'Failed to fetch part' }, { status: 500 });
  }
}

// PUT /api/parts/[id] - Update a part
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.email === 'admin@myncel.com';

    // Fetch part to verify ownership
    const existing = await db.part.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Part not found' }, { status: 404 });

    if (!isAdmin && existing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, partNumber, description, quantity, minQuantity, unitCost, supplier, location, imageUrl } = body;

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Part name cannot be empty' }, { status: 400 });
    }

    const updated = await db.part.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(partNumber !== undefined && { partNumber: partNumber?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(quantity !== undefined && { quantity: typeof quantity === 'number' ? quantity : parseInt(quantity) || 0 }),
        ...(minQuantity !== undefined && { minQuantity: typeof minQuantity === 'number' ? minQuantity : parseInt(minQuantity) || 1 }),
        ...(unitCost !== undefined && { unitCost: unitCost ? parseFloat(unitCost) : null }),
        ...(supplier !== undefined && { supplier: supplier?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    });

    return NextResponse.json({ success: true, part: updated });
  } catch (error) {
    console.error('Update part error:', error);
    return NextResponse.json({ error: 'Failed to update part' }, { status: 500 });
  }
}

// DELETE /api/parts/[id] - Delete a part
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.email === 'admin@myncel.com';

    const existing = await db.part.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Part not found' }, { status: 404 });

    if (!isAdmin && existing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.part.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete part error:', error);
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 });
  }
}