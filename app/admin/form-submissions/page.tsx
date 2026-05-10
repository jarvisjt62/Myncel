import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { FormSubmissionType } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { safeQuery } from '@/lib/admin-helpers';
import AdminFormSubmissionsClient from './AdminFormSubmissionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminFormSubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/admin/form-submissions');
  if (session.user.email !== 'admin@myncel.com') redirect('/dashboard');

  const [submissions, unreadCount, totalCount, contactCount, supportCount, leadCount, partnerCount] = await Promise.all([
    safeQuery(
      db.formSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      []
    ),
    safeQuery(db.formSubmission.count({ where: { isRead: false } }), 0),
    safeQuery(db.formSubmission.count(), 0),
    safeQuery(db.formSubmission.count({ where: { type: FormSubmissionType.CONTACT } }), 0),
    safeQuery(db.formSubmission.count({ where: { type: FormSubmissionType.SUPPORT } }), 0),
    safeQuery(db.formSubmission.count({ where: { type: FormSubmissionType.LEAD } }), 0),
    safeQuery(db.formSubmission.count({ where: { type: FormSubmissionType.PARTNER } }), 0),
  ]);

  return (
    <AdminFormSubmissionsClient
      initialSubmissions={submissions || []}
      initialCounts={{
        total: totalCount || 0,
        unread: unreadCount || 0,
        byType: {
          CONTACT: contactCount || 0,
          SUPPORT: supportCount || 0,
          LEAD: leadCount || 0,
          PARTNER: partnerCount || 0,
        },
      }}
    />
  );
}