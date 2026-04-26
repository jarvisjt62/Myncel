import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, model, manufacturer, location, category, criticality, notes, serialNumber } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Machine name is required' }, { status: 400 });
    }

    // Generate WO number
    const woCount = await db.machine.count({ where: { organizationId: session.user.organizationId } });

    const machine = await db.machine.create({
      data: {
        name: name.trim(),
        model: model?.trim() || null,
        manufacturer: manufacturer?.trim() || null,
        location: location?.trim() || null,
        category: category || 'OTHER',
        criticality: criticality || 'MEDIUM',
        notes: notes?.trim() || null,
        serialNumber: serialNumber?.trim() || null,
        status: 'OPERATIONAL',
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true, machine }, { status: 201 });
  } catch (error) {
    console.error('Create machine error:', error);
    return NextResponse.json({ error: 'Failed to create machine' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const machines = await db.machine.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { workOrders: true, maintenanceTasks: true } },
      },
    });

    return NextResponse.json({ machines });
  } catch (error) {
    console.error('Get machines error:', error);
    return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 });
  }
}