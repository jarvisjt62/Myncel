/**
 * Seed / refresh the demo accounts that Apple App Review and Google Play
 * Review use to test the Myncel app.
 *
 * Why this script exists
 * ----------------------
 * Apple's review team rejected submission 1e279a14 (1.0 build 11) on
 * 2026-05-21 because the demo credentials we provided
 * (`googleplay@myncel.com` / `Google123456!`) did not work. This script
 * makes sure those credentials work AND seeds a fresh, dedicated
 * `appstore-review@myncel.com` account with a fully populated workspace
 * so the next reviewer sees a real-looking app on first launch instead
 * of an empty shell.
 *
 * What it does (idempotent — safe to run repeatedly)
 * --------------------------------------------------
 * 1) Upserts an organization called "Apple Review Demo"
 *      - Plan: TRIAL  (no payment ever required)
 *      - trialEndsAt: 5 years in the future (so the trial never expires
 *        on review day)
 *      - isActive: true, isSuspended: false
 * 2) Upserts the two review users:
 *      - appstore-review@myncel.com  (NEW, primary credential for Apple)
 *      - googleplay@myncel.com       (FIX: ensures the old creds work)
 *    Both:
 *      - Role: ADMIN  (so reviewers can see every screen)
 *      - emailVerified: NOW (no email-confirm step blocking sign-in)
 *      - failedLoginAttempts: 0, lockedUntil: null  (never locked out)
 *      - Password: re-hashed every run, so even if someone changes it
 *        the next deploy resets it back to the known value.
 * 3) Seeds five sample machines (CNC, press, compressor, generator, pump)
 *    if the org currently has none.
 * 4) Seeds three open work orders and two preventive-maintenance tasks
 *    if the org currently has none.
 * 5) Seeds two sample alerts (one open, one resolved).
 *
 * Usage
 * -----
 *   # Production (against the deployed Postgres):
 *   npx tsx scripts/seed-apple-review-account.ts
 *
 *   # Dry run (prints what would change, makes no writes):
 *   DRY_RUN=1 npx tsx scripts/seed-apple-review-account.ts
 *
 * Environment
 * -----------
 *   DATABASE_URL   (required) — same Postgres URL the app uses.
 *   DRY_RUN=1      (optional) — print only, no writes.
 *
 * After running
 * -------------
 *   - Update the demo credentials in App Store Connect to:
 *       Username: appstore-review@myncel.com
 *       Password: ReviewMyncel2026!
 *   - Keep googleplay@myncel.com / Google123456! as a backup credential.
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === '1';

// ---- Hard-coded review credentials (intentionally checked into git) ----
// These are review-only accounts on a sandbox org. They never hold
// real customer data and never grant access to production tenants.
const APPLE_EMAIL = 'appstore-review@myncel.com';
const APPLE_PASSWORD = 'ReviewMyncel2026!';

const GOOGLE_EMAIL = 'googleplay@myncel.com';
const GOOGLE_PASSWORD = 'Google123456!';

const ORG_NAME = 'Apple Review Demo';
const ORG_SLUG = 'apple-review-demo';

function log(msg: string) {
  console.log(`${DRY_RUN ? '[DRY-RUN] ' : ''}${msg}`);
}

async function ensureOrganization() {
  const existing = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (existing) {
    log(`Organization "${ORG_NAME}" already exists (id=${existing.id}). Refreshing flags.`);
    if (DRY_RUN) return existing;
    return prisma.organization.update({
      where: { id: existing.id },
      data: {
        name: ORG_NAME,
        plan: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null,
        adminNotes:
          'App Store / Google Play review demo workspace. Do not delete. ' +
          'See scripts/seed-apple-review-account.ts.',
      },
    });
  }
  log(`Creating organization "${ORG_NAME}"...`);
  if (DRY_RUN) return { id: 'dry-run-org', name: ORG_NAME, slug: ORG_SLUG } as any;
  return prisma.organization.create({
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
        'See scripts/seed-apple-review-account.ts.',
    },
  });
}

async function ensureReviewUser(email: string, password: string, displayName: string, organizationId: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    log(`User ${email} exists (id=${existing.id}). Resetting password, role, lockout, verification.`);
    if (DRY_RUN) return existing;
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: displayName,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        organizationId,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }
  log(`Creating user ${email}...`);
  if (DRY_RUN) return { id: 'dry-run-user', email } as any;
  return prisma.user.create({
    data: {
      email,
      name: displayName,
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      organizationId,
      failedLoginAttempts: 0,
    },
  });
}

async function ensureSampleMachines(organizationId: string) {
  const count = await prisma.machine.count({ where: { organizationId } });
  if (count > 0) {
    log(`Org already has ${count} machines, skipping machine seed.`);
    return prisma.machine.findMany({ where: { organizationId }, take: 5 });
  }
  log(`Seeding 5 sample machines...`);
  if (DRY_RUN) return [] as any[];
  const machines = [
    { name: 'Haas VF-2 CNC Mill', model: 'VF-2', manufacturer: 'Haas', category: 'CNC_MILL', criticality: 'HIGH', location: 'Bay 1', yearInstalled: 2020 },
    { name: 'Mazak QT-250 Lathe', model: 'QT-250', manufacturer: 'Mazak', category: 'CNC_LATHE', criticality: 'HIGH', location: 'Bay 2', yearInstalled: 2019 },
    { name: 'Atlas Copco GA-37 Compressor', model: 'GA-37', manufacturer: 'Atlas Copco', category: 'COMPRESSOR', criticality: 'HIGH', location: 'Utility Room', yearInstalled: 2018 },
    { name: 'Cummins Standby Generator', model: 'C175D6', manufacturer: 'Cummins', category: 'GENERATOR', criticality: 'HIGH', location: 'Outdoor Yard', yearInstalled: 2021 },
    { name: 'Grundfos Cooling Pump', model: 'CR 32-4', manufacturer: 'Grundfos', category: 'PUMP', criticality: 'MEDIUM', location: 'Utility Room', yearInstalled: 2022 },
  ];
  const created = [];
  for (const m of machines) {
    const machine = await prisma.machine.create({
      data: {
        organizationId,
        name: m.name,
        model: m.model,
        manufacturer: m.manufacturer,
        category: m.category as any,
        criticality: m.criticality as any,
        status: 'OPERATIONAL',
        location: m.location,
        yearInstalled: m.yearInstalled,
        totalHours: Math.floor(Math.random() * 5000),
      },
    });
    created.push(machine);
  }
  return created;
}

async function ensureSampleSchedules(organizationId: string, machines: { id: string }[]) {
  const count = await prisma.maintenanceTask.count({ where: { organizationId } });
  if (count > 0) {
    log(`Org already has ${count} maintenance tasks, skipping.`);
    return;
  }
  if (machines.length < 2) {
    log(`Not enough machines to seed schedules.`);
    return;
  }
  log(`Seeding 2 preventive-maintenance schedules...`);
  if (DRY_RUN) return;
  await prisma.maintenanceTask.create({
    data: {
      organizationId,
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
  await prisma.maintenanceTask.create({
    data: {
      organizationId,
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
}

async function ensureSampleWorkOrders(organizationId: string, userId: string, machines: { id: string }[]) {
  const count = await prisma.workOrder.count({ where: { organizationId } });
  if (count > 0) {
    log(`Org already has ${count} work orders, skipping.`);
    return;
  }
  if (machines.length < 3) {
    log(`Not enough machines to seed work orders.`);
    return;
  }
  log(`Seeding 3 sample work orders...`);
  if (DRY_RUN) return;
  const year = new Date().getFullYear();
  const samples = [
    { woNumber: `WO-${year}-DEMO1`, title: 'Investigate spindle vibration', machineIdx: 0, type: 'CORRECTIVE', priority: 'HIGH', status: 'OPEN' },
    { woNumber: `WO-${year}-DEMO2`, title: 'Replace hydraulic filter', machineIdx: 1, type: 'PREVENTIVE', priority: 'MEDIUM', status: 'IN_PROGRESS' },
    { woNumber: `WO-${year}-DEMO3`, title: 'Annual generator load test', machineIdx: 3, type: 'INSPECTION', priority: 'MEDIUM', status: 'OPEN' },
  ];
  for (const s of samples) {
    await prisma.workOrder.create({
      data: {
        organizationId,
        machineId: machines[s.machineIdx].id,
        woNumber: s.woNumber,
        title: s.title,
        description: 'Auto-generated demo work order for App Store review.',
        type: s.type as any,
        priority: s.priority as any,
        status: s.status as any,
        assignedToId: userId,
        createdById: userId,
        estimatedMinutes: 60,
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function ensureSampleAlerts(organizationId: string, machines: { id: string }[]) {
  const count = await prisma.alert.count({ where: { organizationId } });
  if (count > 0) {
    log(`Org already has ${count} alerts, skipping.`);
    return;
  }
  if (machines.length < 2) return;
  log(`Seeding 2 sample alerts...`);
  if (DRY_RUN) return;
  await prisma.alert.create({
    data: {
      organizationId,
      machineId: machines[0].id,
      type: 'MAINTENANCE_DUE',
      severity: 'MEDIUM',
      title: 'Monthly lubrication due in 7 days',
      message: 'The monthly spindle lubrication for Haas VF-2 is due on the upcoming Monday.',
      isRead: false,
      isResolved: false,
    },
  });
  await prisma.alert.create({
    data: {
      organizationId,
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
}

async function main() {
  console.log('=========================================');
  console.log('  Myncel App Review demo seeder');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}`);
  console.log('=========================================\n');

  const org = await ensureOrganization();
  const apple = await ensureReviewUser(APPLE_EMAIL, APPLE_PASSWORD, 'App Store Reviewer', org.id);
  await ensureReviewUser(GOOGLE_EMAIL, GOOGLE_PASSWORD, 'Google Play Reviewer', org.id);

  const machines = await ensureSampleMachines(org.id);
  await ensureSampleSchedules(org.id, machines);
  await ensureSampleWorkOrders(org.id, apple.id, machines);
  await ensureSampleAlerts(org.id, machines);

  console.log('\n-----------------------------------------');
  console.log('  ✅ Done.');
  console.log('-----------------------------------------');
  console.log('  App Store demo credentials:');
  console.log(`    Username: ${APPLE_EMAIL}`);
  console.log(`    Password: ${APPLE_PASSWORD}`);
  console.log('');
  console.log('  Google Play demo credentials (also fixed):');
  console.log(`    Username: ${GOOGLE_EMAIL}`);
  console.log(`    Password: ${GOOGLE_PASSWORD}`);
  console.log('-----------------------------------------\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
