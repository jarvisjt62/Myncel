import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Simple debug endpoint to check/reset admin user
export async function GET() {
  try {
    // Check if admin user exists
    const admin = await db.user.findUnique({
      where: { email: 'admin@myncel.com' },
      select: { id: true, email: true, name: true, role: true, password: true, organizationId: true },
    });

    if (!admin) {
      return NextResponse.json({ 
        status: 'not_found',
        message: 'Admin user does not exist. Need to create it.',
      });
    }

    return NextResponse.json({
      status: 'exists',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        hasPassword: !!admin.password,
        passwordPrefix: admin.password?.substring(0, 10),
        organizationId: admin.organizationId,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Reset admin password
export async function POST() {
  try {
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@myncel.com' },
    });

    if (existingAdmin) {
      // Update existing admin
      const updated = await db.user.update({
        where: { email: 'admin@myncel.com' },
        data: { 
          password: hashedPassword,
          role: 'ADMIN',
        },
        select: { id: true, email: true, name: true, role: true, password: true },
      });

      // Verify the password works
      const isValid = await bcrypt.compare(password, updated.password!);

      return NextResponse.json({
        status: 'updated',
        message: 'Admin password reset successfully',
        credentials: {
          email: 'admin@myncel.com',
          password: password,
        },
        verified: isValid,
      });
    } else {
      // Create new admin
      const created = await db.user.create({
        data: {
          email: 'admin@myncel.com',
          password: hashedPassword,
          name: 'Admin',
          role: 'ADMIN',
        },
        select: { id: true, email: true, name: true, role: true },
      });

      return NextResponse.json({
        status: 'created',
        message: 'Admin user created successfully',
        credentials: {
          email: 'admin@myncel.com',
          password: password,
        },
      });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}