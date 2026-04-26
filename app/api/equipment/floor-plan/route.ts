import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET - fetch current floor plan and machine positions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Read floor plan config from a JSON file stored per organization
    const configPath = `/tmp/floorplan-${user.organizationId}.json`;
    let config = { imageUrl: null as string | null, positions: {} as Record<string, { x: number; y: number }> };

    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(data);
    } catch {
      // No floor plan yet — return empty config
    }

    // Get machines for positioning
    const machines = await safeQuery(
      db.machine.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, name: true, status: true, location: true },
        orderBy: { name: 'asc' },
      }),
      []
    );

    return NextResponse.json({
      floorPlan: config.imageUrl,
      positions: config.positions,
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

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json();
    const { positions } = body;

    const configPath = `/tmp/floorplan-${user.organizationId}.json`;
    let config = { imageUrl: null as string | null, positions: {} as Record<string, { x: number; y: number }> };

    try {
      const fs = await import('fs/promises');
      const existing = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(existing);
    } catch {}

    config.positions = positions || config.positions;

    const fs = await import('fs/promises');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

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

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true },
      }),
      null
    );

    if (!user?.organizationId) {
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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
    }

    // Save to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'floorplans');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `floorplan-${user.organizationId}.${ext}`;
    const filepath = join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const imageUrl = `/uploads/floorplans/${filename}?t=${Date.now()}`;

    // Update config
    const configPath = `/tmp/floorplan-${user.organizationId}.json`;
    let config = { imageUrl: null as string | null, positions: {} as Record<string, { x: number; y: number }> };
    try {
      const fs = await import('fs/promises');
      const existing = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(existing);
    } catch {}

    config.imageUrl = imageUrl;
    const fs = await import('fs/promises');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading floor plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}