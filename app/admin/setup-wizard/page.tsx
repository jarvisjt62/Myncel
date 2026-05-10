import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SetupWizardClient from '@/app/setup/SetupWizardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Setup Wizard — Myncel Admin',
  description: 'Register your equipment and connect IoT sensors in minutes.',
};

export default async function AdminSetupWizardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/admin/setup-wizard');

  return <SetupWizardClient />;
}