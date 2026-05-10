import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  const rawDbUrl = process.env.DATABASE_URL || '';
  results.databaseUrlSet = !!process.env.DATABASE_URL;
  results.directUrlSet = !!process.env.DIRECT_URL;

  try {
    const parsed = rawDbUrl ? new URL(rawDbUrl) : null;
    results.databaseHostSet = !!parsed?.hostname;
    results.databasePortSet = !!parsed?.port;
    results.hasPgbouncer = parsed ? parsed.searchParams.has('pgbouncer') || rawDbUrl.includes('pgbouncer=true') : false;
  } catch {
    results.databaseUrlParseable = false;
  }

  try {
    const userCount = await db.user.count();
    results.userCount = userCount;
    results.dbConnected = true;
  } catch (e) {
    results.dbConnected = false;
    results.dbError = String(e);
    return NextResponse.json(results, { status: 500 });
  }

  try {
    const admin = await db.user.findUnique({
      where: { email: 'admin@myncel.com' },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    if (admin) {
      results.adminFound = true;
      results.adminId = admin.id;
      results.adminEmail = admin.email;
      results.adminRole = admin.role;
      results.adminOrganizationId = admin.organizationId;
    } else {
      results.adminFound = false;
    }
  } catch (e) {
    results.adminCheckError = String(e);
  }

  try {
    const allUsers = await db.user.findMany({
      select: { email: true, role: true, id: true, organizationId: true },
      take: 25,
    });
    results.usersPreview = allUsers;
    results.usersPreviewLimitedTo = 25;
  } catch (e) {
    results.usersPreviewError = String(e);
  }

  results.timestamp = new Date().toISOString();
  return NextResponse.json(results);
}