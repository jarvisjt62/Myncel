import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/admin-settings';

// Public endpoint — no auth required
// Returns all admin settings (payment, feature, security, platform) as flat key-value pairs
// Used by signup, middleware, and client-side hooks
export async function GET() {
  const dbSettings = await db.adminSetting.findMany().catch(() => []);

  const merged: Record<string, any> = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const dbRecord = dbSettings.find(s => s.key === key);
    merged[key] = dbRecord ? JSON.parse(dbRecord.value) : def.value;
  }

  return NextResponse.json({ settings: merged });
}