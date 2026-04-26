import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// This endpoint sets up or resets the admin user
// It should be called once or when admin needs to be reset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secretKey = body.secretKey;
    
    // Simple security check - use an environment variable in production
    const validSecret = process.env.ADMIN_SETUP_SECRET || 'myncel-admin-setup-secret-2024';
    if (secretKey !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const email = 'admin@myncel.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if admin exists
    const existingAdmin = await db.user.findUnique({
      where: { email }
    });
    
    if (existingAdmin) {
      // Update existing admin
      const updated = await db.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
        }
      });
      return NextResponse.json({ 
        message: 'Admin user updated successfully',
        email: updated.email,
        role: updated.role
      });
    } else {
      // Create new admin
      const created = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Admin',
          role: 'ADMIN',
        }
      });
      return NextResponse.json({ 
        message: 'Admin user created successfully',
        email: created.email,
        role: created.role
      });
    }
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}