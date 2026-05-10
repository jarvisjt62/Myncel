import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/parts/upload - Upload a photo for a part
// Stores the image as a base64 data URL in the database (works on Vercel serverless)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.email === 'admin@myncel.com';

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const partId = formData.get('partId') as string;

    if (!file || !partId) {
      return NextResponse.json({ error: 'File and partId are required' }, { status: 400 });
    }

    // Verify part exists and belongs to org (unless admin)
    const part = await db.part.findUnique({ where: { id: partId } });
    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }
    if (!isAdmin && part.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed (JPG, PNG, WebP, GIF)' }, { status: 400 });
    }

    // Validate file size (5MB max for base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    // Convert to base64 data URL (stores in DB - works on Vercel serverless)
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;

    // Update part record with base64 image URL
    await db.part.update({
      where: { id: partId },
      data: { imageUrl },
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Part image upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Upload failed' }, { status: 500 });
  }
}