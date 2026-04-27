import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// POST /api/machines/upload - Upload machine image/attachment
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
    const machine = await db.machine.findUnique({ where: { id: machineId } });
    if (!machine || machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed (JPG, PNG, WebP, GIF)' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'machines');
    await mkdir(uploadDir, { recursive: true });

    // Generate filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${machineId}-${Date.now()}.${ext}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update machine imageUrl
    const imageUrl = `/uploads/machines/${filename}`;
    await db.machine.update({
      where: { id: machineId },
      data: { imageUrl },
    });

    return NextResponse.json({ success: true, imageUrl, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}