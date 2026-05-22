import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

/**
 * One-shot endpoint to (re)seed the App Store / Google Play review demo
 * accounts after Apple's 2026-05-21 rejection of submission 1e279a14.
 *
 * Auth model
 * ----------
 *   POST /api/admin/seed-review-accounts
 *   Header:  X-Seed-Secret: <APP_REVIEW_SEED_SECRET env var>
 *   Body:    {} (no body required)
 *
 * Why a custom header instead of the existing /api/admin/full-seed
 * pattern?
 *   - full-seed uses a hard-coded literal in the source code, which is
 *     fine for kellytron's demo data but not appropriate for a credential
 *     that lets you reset the App Store reviewer's login. We want this
 *     one to be controllable via a Vercel env var (rotatable, not
 *     in git).
 *
 * Idempotent: safe to POST multiple times. Each call re-hashes the
 * passwords and re-marks the users as email-verified / unlocked.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ---- review credentials (the passwords are reset to these on every call) ----
const APPLE_EMAIL = 'appstore-review@myncel.com';
const APPLE_PASSWORD = 'ReviewMyncel2026!';
const GOOGLE_EMAIL = 'googleplay@myncel.com';
const GOOGLE_PASSWORD = 'Google123456!';

const ORG_NAME = 'Apple Review Demo';
const ORG_SLUG = 'apple-review-demo';

export async function POST(req: NextRequest) {
  // ---- auth ----
  const expected = process.env.APP_REVIEW_SEED_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'APP_REVIEW_SEED_SECRET is not configured on the server.' },
      { status: 500 }
    );
  }
  const provided = req.headers.get('x-seed-secret') || '';
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log: string[] = [];

  try {
    // ---- 1. Org ----
    let org = await db.organization.findUnique({ where: { slug: ORG_SLUG } });
    if (!org) {
      org = await db.organization.create({
        data: {
          name: ORG_NAME,
          slug: ORG_SLUG,
          industry: 'METAL_FABRICATION',
          size: 'GROWING',
          plan: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
          isActive: true,
          isSuspended: false,
          adminNotes:
            'App Store / Google Play review demo workspace. Do not delete. ' +
            'Maintained by /api/admin/seed-review-accounts.',
        },
      });
      log.push(`Created org "${ORG_NAME}" (id=${org.id}).`);
    } else {
      org = await db.organization.update({
        where: { id: org.id },
        data: {
          name: ORG_NAME,
          plan: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
          isActive: true,
          isSuspended: false,
          suspendedAt: null,
          suspendedReason: null,
        },
      });
      log.push(`Refreshed org "${ORG_NAME}" (id=${org.id}).`);
    }

    // ---- 2. Users ----
    const upsertReviewer = async (email: string, password: string, displayName: string) => {
      const hashed = await bcrypt.hash(password, 10);
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        await db.user.update({
          where: { id: existing.id },
          data: {
            name: displayName,
            password: hashed,
            role: 'ADMIN',
            emailVerified: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null,
            organizationId: org!.id,
            twoFactorEnabled: false,
            twoFactorSecret: null,
          },
        });
        log.push(`Refreshed user ${email} (password reset, unlocked, ADMIN).`);
        return existing.id;
      }
      const created = await db.user.create({
        data: {
          email,
          name: displayName,
          password: hashed,
          role: 'ADMIN',
          emailVerified: new Date(),
          organizationId: org!.id,
          failedLoginAttempts: 0,
        },
      });
      log.push(`Created user ${email} (id=${created.id}).`);
      return created.id;
    };

    const appleUserId = await upsertReviewer(APPLE_EMAIL, APPLE_PASSWORD, 'App Store Reviewer');
    await upsertReviewer(GOOGLE_EMAIL, GOOGLE_PASSWORD, 'Google Play Reviewer');

    // ---- 3. Sample machines (only if org is empty) ----
    const existingMachines = await db.machine.count({ where: { organizationId: org.id } });
    let machines: { id: string }[];
    if (existingMachines === 0) {
      const seedMachines: Array<{ name: string; model: string; manufacturer: string; category: any; criticality: any; location: string; yearInstalled: number }> = [
        { name: 'Haas VF-2 CNC Mill', model: 'VF-2', manufacturer: 'Haas', category: 'CNC_MILL', criticality: 'HIGH', location: 'Bay 1', yearInstalled: 2020 },
        { name: 'Mazak QT-250 Lathe', model: 'QT-250', manufacturer: 'Mazak', category: 'CNC_LATHE', criticality: 'HIGH', location: 'Bay 2', yearInstalled: 2019 },
        { name: 'Atlas Copco GA-37 Compressor', model: 'GA-37', manufacturer: 'Atlas Copco', category: 'COMPRESSOR', criticality: 'HIGH', location: 'Utility Room', yearInstalled: 2018 },
        { name: 'Cummins Standby Generator', model: 'C175D6', manufacturer: 'Cummins', category: 'GENERATOR', criticality: 'HIGH', location: 'Outdoor Yard', yearInstalled: 2021 },
        { name: 'Grundfos Cooling Pump', model: 'CR 32-4', manufacturer: 'Grundfos', category: 'PUMP', criticality: 'MEDIUM', location: 'Utility Room', yearInstalled: 2022 },
      ];
      machines = [];
      for (const m of seedMachines) {
        const created = await db.machine.create({
          data: {
            organizationId: org.id,
            name: m.name,
            model: m.model,
            manufacturer: m.manufacturer,
            category: m.category,
            criticality: m.criticality,
            status: 'OPERATIONAL',
            location: m.location,
            yearInstalled: m.yearInstalled,
            totalHours: Math.floor(Math.random() * 5000),
          },
          select: { id: true },
        });
        machines.push(created);
      }
      log.push(`Seeded ${machines.length} sample machines.`);
    } else {
      machines = await db.machine.findMany({
        where: { organizationId: org.id },
        take: 5,
        select: { id: true },
      });
      log.push(`Org already has ${existingMachines} machines, skipping machine seed.`);
    }

    // ---- 4. Sample maintenance schedules ----
    const existingTasks = await db.maintenanceTask.count({ where: { organizationId: org.id } });
    if (existingTasks === 0 && machines.length >= 2) {
      await db.maintenanceTask.create({
        data: {
          organizationId: org.id,
          machineId: machines[0].id,
          title: 'Monthly spindle lubrication',
          description: 'Lubricate spindle bearings, check belt tension, inspect coolant levels.',
          taskType: 'PREVENTIVE',
          frequency: 'MONTHLY',
          priority: 'MEDIUM',
          estimatedMinutes: 45,
          isActive: true,
          nextDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await db.maintenanceTask.create({
        data: {
          organizationId: org.id,
          machineId: machines[1].id,
          title: 'Quarterly coolant change',
          description: 'Drain, flush and refill coolant. Replace filter.',
          taskType: 'PREVENTIVE',
          frequency: 'QUARTERLY',
          priority: 'HIGH',
          estimatedMinutes: 90,
          isActive: true,
          nextDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      log.push('Seeded 2 preventive-maintenance schedules.');
    } else {
      log.push(`Org already has ${existingTasks} maintenance tasks, skipping.`);
    }

    // ---- 5. Sample work orders ----
    const existingWO = await db.workOrder.count({ where: { organizationId: org.id } });
    if (existingWO === 0 && machines.length >= 4) {
      const year = new Date().getFullYear();
      const samples: Array<{ woNumber: string; title: string; machineIdx: number; type: any; priority: any; status: any }> = [
        { woNumber: `WO-${year}-DEMO1`, title: 'Investigate spindle vibration', machineIdx: 0, type: 'CORRECTIVE', priority: 'HIGH', status: 'OPEN' },
        { woNumber: `WO-${year}-DEMO2`, title: 'Replace hydraulic filter', machineIdx: 1, type: 'PREVENTIVE', priority: 'MEDIUM', status: 'IN_PROGRESS' },
        { woNumber: `WO-${year}-DEMO3`, title: 'Annual generator load test', machineIdx: 3, type: 'INSPECTION', priority: 'MEDIUM', status: 'OPEN' },
      ];
      for (const s of samples) {
        await db.workOrder.create({
          data: {
            organizationId: org.id,
            machineId: machines[s.machineIdx].id,
            woNumber: s.woNumber,
            title: s.title,
            description: 'Auto-generated demo work order for App Store review.',
            type: s.type,
            priority: s.priority,
            status: s.status,
            assignedToId: appleUserId,
            createdById: appleUserId,
            estimatedMinutes: 60,
            dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        });
      }
      log.push(`Seeded 3 sample work orders.`);
    } else {
      log.push(`Org already has ${existingWO} work orders, skipping.`);
    }

    // ---- 6. Sample alerts ----
    const existingAlerts = await db.alert.count({ where: { organizationId: org.id } });
    if (existingAlerts === 0 && machines.length >= 2) {
      await db.alert.create({
        data: {
          organizationId: org.id,
          machineId: machines[0].id,
          type: 'MAINTENANCE_DUE',
          severity: 'MEDIUM',
          title: 'Monthly lubrication due in 7 days',
          message: 'The monthly spindle lubrication for Haas VF-2 is due on the upcoming Monday.',
          isRead: false,
          isResolved: false,
        },
      });
      await db.alert.create({
        data: {
          organizationId: org.id,
          machineId: machines[1].id,
          type: 'SENSOR_THRESHOLD',
          severity: 'LOW',
          title: 'Vibration trend stabilised',
          message: 'Vibration on Mazak QT-250 returned to baseline after this morning\u2019s service.',
          isRead: true,
          isResolved: true,
          resolvedAt: new Date(),
        },
      });
      log.push('Seeded 2 sample alerts.');
    } else {
      log.push(`Org already has ${existingAlerts} alerts, skipping.`);
    }

    return NextResponse.json({
      ok: true,
      log,
      credentials: {
        appStore: { username: APPLE_EMAIL, password: APPLE_PASSWORD },
        googlePlay: { username: GOOGLE_EMAIL, password: GOOGLE_PASSWORD },
      },
    });
  } catch (err: any) {
    console.error('[seed-review-accounts] failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Seed failed', log },
      { status: 500 }
    );
  }
}
