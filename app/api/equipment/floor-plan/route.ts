import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getOrgId(email: string): Promise<string | null> {
  const user = await safeQuery(
    db.user.findUnique({
      where: { email },
      select: { organizationId: true },
    }),
    null
  );
  return user?.organizationId ?? null;
}

// GET - fetch current floor plan and machine positions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = await getOrgId(session.user.email || '');
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Read floor plan config from the organization record in the database
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { floorPlanImageUrl: true, floorPlanPositions: true },
    });

    const positions = org?.floorPlanPositions
      ? JSON.parse(org.floorPlanPositions)
      : {};

    // Get machines for positioning
    const machines = await safeQuery(
      db.machine.findMany({
        where: { organizationId },
        select: { id: true, name: true, status: true, location: true },
        orderBy: { name: 'asc' },
      }),
      []
    );

    return NextResponse.json({
      floorPlan: org?.floorPlanImageUrl ?? null,
      positions,
      machines,
    });
  } catch (error) {
    console.error('Error fetching floor plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - save machine positions
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = await getOrgId(session.user.email || '');
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json();
    const { positions } = body;

    await db.organization.update({
      where: { id: organizationId },
      data: { floorPlanPositions: JSON.stringify(positions || {}) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving floor plan positions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - upload floor plan image
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = await getOrgId(session.user.email || '');
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File must be an image (JPEG, PNG, WebP, or SVG)' }, { status: 400 });
    }

    // Validate file size (2MB max for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 2MB' }, { status: 400 });
    }

    // Convert to base64 data URL (stores in DB - works on Vercel serverless)
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;

    // Store in database
    await db.organization.update({
      where: { id: organizationId },
      data: { floorPlanImageUrl: imageUrl },
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading floor plan:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Internal server error' }, { status: 500 });
  }
}