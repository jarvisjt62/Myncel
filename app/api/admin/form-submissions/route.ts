import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { FormSubmissionType } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (email !== 'admin@myncel.com') {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 }) };
  }

  return { ok: true as const };
}

function isValidType(value: string | null): value is FormSubmissionType {
  return !!value && Object.values(FormSubmissionType).includes(value as FormSubmissionType);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const take = Math.min(Number(searchParams.get('take') || 100), 200);

    const where: any = {};

    if (isValidType(type)) {
      where.type = type;
    }

    if (status === 'unread') {
      where.isRead = false;
    } else if (status === 'read') {
      where.isRead = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [submissions, total, unread, contact, support, lead, partner] = await Promise.all([
      db.formSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
      }),
      db.formSubmission.count({ where }),
      db.formSubmission.count({ where: { isRead: false } }),
      db.formSubmission.count({ where: { type: FormSubmissionType.CONTACT } }),
      db.formSubmission.count({ where: { type: FormSubmissionType.SUPPORT } }),
      db.formSubmission.count({ where: { type: FormSubmissionType.LEAD } }),
      db.formSubmission.count({ where: { type: FormSubmissionType.PARTNER } }),
    ]);

    return NextResponse.json({
      submissions,
      counts: {
        total,
        unread,
        byType: {
          CONTACT: contact,
          SUPPORT: support,
          LEAD: lead,
          PARTNER: partner,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const body = await request.json();
    const { id, isRead } = body as { id?: string; isRead?: boolean };

    if (!id || typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'Submission id and isRead are required' }, { status: 400 });
    }

    const submission = await db.formSubmission.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error updating form submission:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}