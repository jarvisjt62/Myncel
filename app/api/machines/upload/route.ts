import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/machines/upload - Upload machine image
// Stores the image as a base64 data URL in the database (works on Vercel serverless)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const machineId = formData.get('machineId') as string;

    if (!file || !machineId) {
      return NextResponse.json({ error: 'File and machineId are required' }, { status: 400 });
    }

    // Verify machine belongs to org
    const isSA = session.user.email === 'admin@myncel.com';
    const machine = await db.machine.findUnique({ where: { id: machineId } });
    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }
    if (!isSA && machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed (JPG, PNG, WebP, GIF)' }, { status: 400 });
    }

    // Validate file size (2MB max for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 2MB' }, { status: 400 });
    }

    // Convert to base64 data URL (stores in DB - works on Vercel serverless)
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;

    // Update machine imageUrl
    await db.machine.update({
      where: { id: machineId },
      data: { imageUrl },
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Machine upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Upload failed' }, { status: 500 });
  }
}