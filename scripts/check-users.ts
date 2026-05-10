import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      organizationId: true,
      organization: { select: { name: true } },
    },
  });

  console.log(`\nTotal users: ${users.length}\n`);
  
  for (const user of users) {
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`OrgId: ${user.organizationId}`);
    console.log(`Org: ${user.organization?.name}`);
    console.log(`Has password: ${!!user.password}`);
    if (user.password) {
      // Test common passwords
      const passwords = ['Test1234!', 'admin123', 'password', 'Admin1234!', 'myncel123', '123456'];
      for (const pwd of passwords) {
        const match = await bcrypt.compare(pwd, user.password);
        if (match) {
          console.log(`✅ Password matches: "${pwd}"`);
          break;
        }
      }
    }
    console.log('---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());