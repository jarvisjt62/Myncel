import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const usersToReset = [
    { email: 'admin@myncel.com', password: 'Admin1234!' },
    { email: 'kellytron@yahoo.com', password: 'Test1234!' },
  ];

  for (const { email, password } of usersToReset) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // First check the user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      console.log(`❌ User not found: ${email}`);
      continue;
    }

    console.log(`Found user: ${email} (id: ${existing.id})`);
    console.log(`Current password hash: ${existing.password?.substring(0, 30)}...`);

    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Verify immediately
    const verify = await bcrypt.compare(password, updated.password!);
    console.log(`✅ Reset ${email} → password: "${password}" | verify: ${verify}`);
    console.log(`New hash: ${updated.password?.substring(0, 30)}...`);
    console.log('---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());