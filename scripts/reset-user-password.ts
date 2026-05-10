import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reset a user's password
 * Usage: npx ts-node scripts/reset-user-password.ts <email> <new-password>
 */
async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Usage: npx ts-node scripts/reset-user-password.ts <email> <new-password>');
    console.log('Example: npx ts-node scripts/reset-user-password.ts user@example.com NewPassword123!');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 8) {
    console.error('Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log('✅ Password reset successfully!');
    console.log(`   User: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ User not found with email: ${email}`);
    } else {
      console.error('❌ Error resetting password:', error.message);
    }
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());