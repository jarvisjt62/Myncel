import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/admin-settings';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.email === 'admin@myncel.com';

  const dbSettings = await db.adminSetting.findMany().catch(() => []);

  // Merge DB values with defaults
  const merged: Record<string, any> = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const dbRecord = dbSettings.find(s => s.key === key);
    merged[key] = dbRecord ? JSON.parse(dbRecord.value) : def.value;
  }

  // For public requests, only return payment + feature flags
  if (!isAdmin) {
    const publicKeys = Object.keys(DEFAULT_SETTINGS).filter(k =>
      k.startsWith('payment.') || k.startsWith('feature.')
    );
    const publicSettings: Record<string, any> = {};
    for (const k of publicKeys) publicSettings[k] = merged[k];
    return NextResponse.json({ settings: publicSettings });
  }

  // Admin gets full settings with metadata
  const full: Record<string, { value: any; group: string; label: string; fromDb: boolean }> = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const dbRecord = dbSettings.find(s => s.key === key);
    full[key] = {
      value: dbRecord ? JSON.parse(dbRecord.value) : def.value,
      group: def.group,
      label: def.label,
      fromDb: !!dbRecord,
    };
  }

  return NextResponse.json({ settings: full });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { updates } = await req.json();
  if (!updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'Invalid updates' }, { status: 400 });
  }

  const results: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!DEFAULT_SETTINGS[key]) continue;
    const def = DEFAULT_SETTINGS[key];
    await db.adminSetting.upsert({
      where: { key },
      create: {
        key,
        value: JSON.stringify(value),
        group: def.group,
        label: def.label,
        updatedBy: session.user.id ?? null,
      },
      update: {
        value: JSON.stringify(value),
        updatedBy: session.user.id ?? null,
      },
    });
    results.push(key);
  }

  await db.auditLog.create({
    data: {
      action: 'ADMIN_SETTINGS_UPDATED',
      entity: 'AdminSetting',
      changes: updates as any,
      userId: session.user.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, updated: results });
}