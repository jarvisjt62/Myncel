import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  // Check raw env var
  const rawDbUrl = process.env.DATABASE_URL || '';
  results.rawEnvPort = rawDbUrl.match(/:(\d+)\//)?.[1] || 'unknown';
  results.rawEnvHost = rawDbUrl.match(/@([^:]+):/)?.[1] || 'unknown';
  results.directUrlSet = !!process.env.DIRECT_URL;

  // Check what port the resolved URL uses (what getDatabaseUrl() produced)
  try {
    const parsed = new URL(rawDbUrl);
    const resolvedPort = parsed.port === '5432' ? '6543 (auto-switched by code)' : parsed.port;
    results.resolvedPort = resolvedPort;
    results.hasPgbouncer = parsed.searchParams.has('pgbouncer') || rawDbUrl.includes('pgbouncer=true');
  } catch {
    results.resolvedPort = 'parse error';
  }

  try {
    // Test basic DB connectivity
    const userCount = await db.user.count();
    results.userCount = userCount;
    results.dbConnected = true;
  } catch (e) {
    results.dbConnected = false;
    results.dbError = String(e);
    return NextResponse.json(results, { status: 500 });
  }

  try {
    // Get admin user's password hash
    const admin = await db.user.findUnique({
      where: { email: 'admin@myncel.com' },
      select: { id: true, email: true, password: true, role: true },
    });

    if (admin) {
      results.adminFound = true;
      results.adminId = admin.id;
      results.adminRole = admin.role;
      results.adminPasswordHashPrefix = admin.password?.substring(0, 30);

      // Test common passwords
      const testPasswords = ['Emperor1980&', 'Admin1234!', 'Test1234!', 'admin123', 'password'];
      for (const pwd of testPasswords) {
        if (admin.password) {
          const match = await bcrypt.compare(pwd, admin.password);
          if (match) {
            results.adminPasswordMatches = pwd;
            break;
          }
        }
      }
      if (!results.adminPasswordMatches) {
        results.adminPasswordMatches = 'none of the tested passwords match';
      }
    } else {
      results.adminFound = false;
    }
  } catch (e) {
    results.adminCheckError = String(e);
  }

  try {
    // Get user's password hash
    const user = await db.user.findUnique({
      where: { email: 'kellytron@yahoo.com' },
      select: { id: true, email: true, password: true, role: true },
    });

    if (user) {
      results.userFound = true;
      results.userId = user.id;
      results.userRole = user.role;
      results.userPasswordHashPrefix = user.password?.substring(0, 30);

      const testPasswords = ['Emperor1980&', 'Test1234!', 'Admin1234!', 'password'];
      for (const pwd of testPasswords) {
        if (user.password) {
          const match = await bcrypt.compare(pwd, user.password);
          if (match) {
            results.userPasswordMatches = pwd;
            break;
          }
        }
      }
      if (!results.userPasswordMatches) {
        results.userPasswordMatches = 'none of the tested passwords match';
      }
    } else {
      results.userFound = false;
    }
  } catch (e) {
    results.userCheckError = String(e);
  }

  // Show all users in DB for reference
  try {
    const allUsers = await db.user.findMany({
      select: { email: true, role: true, id: true },
    });
    results.allUsers = allUsers;
  } catch (e) {
    results.allUsersError = String(e);
  }

  results.timestamp = new Date().toISOString();
  return NextResponse.json(results);
}