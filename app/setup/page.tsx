import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SetupWizardClient from './SetupWizardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Setup Wizard — Myncel',
  description: 'Register your equipment and connect IoT sensors in minutes.',
};

export default async function SetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/setup');

  return <SetupWizardClient />;
}