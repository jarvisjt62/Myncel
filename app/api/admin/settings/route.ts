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
      k.startsWith('payment.') || k.startsWith('feature.') || k.startsWith('security.') || k.startsWith('platform.')
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

    // When trial days is updated, retroactively recompute each active TRIAL org's
    // trial-end date from THAT ORG's createdAt — NOT from "now". Setting it from
    // "now" would silently extend every existing trial (an org that signed up
    // 20 days ago would suddenly get another full trial period), which is the
    // bug that produced "29d left" countdowns on long-existing orgs.
    if (key === 'platform.trialDays' && typeof value === 'number' && value > 0) {
      try {
        const ms = value * 24 * 60 * 60 * 1000;
        const now = new Date();
        const orgs = await db.organization.findMany({
          where: {
            plan: 'TRIAL',
            OR: [
              { trialEndsAt: { gt: now } }, // Active trials with future expiry
              { trialEndsAt: null },         // Trials with no expiry set yet
            ],
          },
          select: { id: true, createdAt: true },
        });
        let updatedCount = 0;
        for (const org of orgs) {
          const correctEnd = new Date(org.createdAt.getTime() + ms);
          await db.organization.update({
            where: { id: org.id },
            data: { trialEndsAt: correctEnd },
          });
          updatedCount++;
        }
        console.log(`[Admin Settings] Recomputed trial period to ${value} days from each org's createdAt. ${updatedCount} active trial org(s) updated.`);
      } catch (err) {
        console.error('[Admin Settings] Failed to update trial orgs:', err);
      }
    }
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