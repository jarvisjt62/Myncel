import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create / refresh the Google Play (and App Store) review demo account.
 *
 * This account is given to Google's reviewers via Play Console
 * "App access" so they can sign in and review every screen of the app.
 *
 * Properties:
 *   - Email pre-verified (emailVerified set) so they don't need email access
 *   - OWNER role on its own demo organization
 *   - Organization plan set to PROFESSIONAL with trialEndsAt 2 years out
 *     so no paywall blocks any feature during review
 *   - Sample data (machines, work orders, maintenance tasks) seeded so the
 *     dashboard looks like a real CMMS, not an empty shell
 *
 * Usage:
 *   npx ts-node scripts/create-demo-account.ts
 *
 * Override defaults via env vars:
 *   DEMO_EMAIL=googleplay@myncel.com DEMO_PASSWORD='SecurePass123!' \
 *     npx ts-node scripts/create-demo-account.ts
 *
 * Re-running is safe — it upserts the user and resets the password +
 * verification state so the same credentials always work.
 */

const DEMO_EMAIL = (process.env.DEMO_EMAIL || 'googleplay@myncel.com').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'GooglePlay2026!';
const DEMO_ORG_NAME = process.env.DEMO_ORG_NAME || 'Demo Manufacturing Co.';
const DEMO_ORG_SLUG = process.env.DEMO_ORG_SLUG || 'demo-mfg-co';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Myncel — Demo / Reviewer Account Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` Email:    ${DEMO_EMAIL}`);
  console.log(` Password: ${DEMO_PASSWORD}`);
  console.log(` Org:      ${DEMO_ORG_NAME}`);
  console.log('');

  // 1. Create or update the demo organization
  const trialEndsAt = new Date();
  trialEndsAt.setFullYear(trialEndsAt.getFullYear() + 2); // 2 years out

  const org = await prisma.organization.upsert({
    where: { slug: DEMO_ORG_SLUG },
    create: {
      name: DEMO_ORG_NAME,
      slug: DEMO_ORG_SLUG,
      industry: 'METAL_FABRICATION' as any,
      size: 'MIDSIZE' as any,
      plan: 'PROFESSIONAL' as any,
      trialEndsAt,
      subscriptionStatus: 'active',
      currentPeriodEnd: trialEndsAt,
      isActive: true,
      isSuspended: false,
    },
    update: {
      name: DEMO_ORG_NAME,
      plan: 'PROFESSIONAL' as any,
      trialEndsAt,
      subscriptionStatus: 'active',
      currentPeriodEnd: trialEndsAt,
      isActive: true,
      isSuspended: false,
    },
  });
  console.log(`✅ Organization ready: ${org.name} (${org.id})`);

  // 2. Create or update the demo user
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      name: 'Google Play Reviewer',
      password: hashedPassword,
      emailVerified: new Date(), // pre-verified
      role: 'OWNER' as any,
      organizationId: org.id,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    update: {
      password: hashedPassword,
      emailVerified: new Date(),
      role: 'OWNER' as any,
      organizationId: org.id,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log(`✅ User ready: ${user.email} (${user.role})`);

  // 3. Seed sample data — only if the org has none yet, so re-running
  //    doesn't create duplicates after a reviewer has clicked around.
  const machineCount = await prisma.machine.count({ where: { organizationId: org.id } });
  if (machineCount === 0) {
    console.log('📦 Seeding sample machines + work orders...');

    const machines = await Promise.all([
      prisma.machine.create({
        data: {
          name: 'CNC Lathe #1',
          serialNumber: 'CNC-001',
          manufacturer: 'Haas',
          model: 'ST-20',
          category: 'CNC_LATHE' as any,
          status: 'OPERATIONAL' as any,
          criticality: 'HIGH' as any,
          location: 'Plant 1 — Bay A',
          organizationId: org.id,
        },
      }),
      prisma.machine.create({
        data: {
          name: 'Hydraulic Press Brake',
          serialNumber: 'HPB-204',
          manufacturer: 'Amada',
          model: 'HFE-100',
          category: 'PRESS' as any,
          status: 'OPERATIONAL' as any,
          criticality: 'MEDIUM' as any,
          location: 'Plant 1 — Bay B',
          organizationId: org.id,
        },
      }),
      prisma.machine.create({
        data: {
          name: 'Welding Robot Cell',
          serialNumber: 'WRC-117',
          manufacturer: 'Fanuc',
          model: 'ARC Mate 100iD',
          category: 'WELDER' as any,
          status: 'MAINTENANCE' as any,
          criticality: 'HIGH' as any,
          location: 'Plant 2 — Cell 3',
          organizationId: org.id,
        },
      }),
    ]).catch(e => {
      console.warn('   ⚠️  Some machine fields rejected (enum mismatch?). Skipping seed.');
      console.warn(`   ${e.message}`);
      return [];
    });

    if (machines.length > 0) {
      console.log(`   ✅ ${machines.length} machines created`);

      // A couple of sample work orders
      await prisma.workOrder.createMany({
        data: [
          {
            woNumber: 'WO-DEMO-001',
            title: 'Quarterly inspection — CNC Lathe #1',
            description: 'Routine quarterly inspection per OEM schedule',
            status: 'OPEN' as any,
            priority: 'MEDIUM' as any,
            type: 'PREVENTIVE' as any,
            machineId: machines[0].id,
            organizationId: org.id,
            createdById: user.id,
            estimatedMinutes: 120,
          },
          {
            woNumber: 'WO-DEMO-002',
            title: 'Spindle bearing replacement — Welding Robot',
            description: 'Replace worn spindle bearings, vibration alert triggered',
            status: 'IN_PROGRESS' as any,
            priority: 'HIGH' as any,
            type: 'CORRECTIVE' as any,
            machineId: machines[2].id,
            organizationId: org.id,
            createdById: user.id,
            estimatedMinutes: 360,
          },
        ],
      }).catch(e => {
        console.warn(`   ⚠️  Work order seed skipped: ${e.message}`);
      });

      console.log('   ✅ Sample work orders created');
    }
  } else {
    console.log(`📦 Sample data already exists (${machineCount} machines) — skipping seed`);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' DONE — paste these into Google Play Console > App access:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` Username: ${DEMO_EMAIL}`);
  console.log(` Password: ${DEMO_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
