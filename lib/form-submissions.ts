import { db } from '@/lib/db';
import { FormSubmissionType, Prisma } from '@prisma/client';

type PublicFormSubmissionInput = {
  type: FormSubmissionType;
  name: string;
  email: string;
  company?: string | null;
  subject?: string | null;
  source?: string | null;
  recipient?: string | null;
  payload: Prisma.InputJsonValue;
};

export async function savePublicFormSubmission(input: PublicFormSubmissionInput) {
  try {
    return await db.formSubmission.create({
      data: {
        type: input.type,
        name: input.name,
        email: input.email,
        company: input.company || null,
        subject: input.subject || null,
        source: input.source || null,
        recipient: input.recipient || null,
        payload: input.payload,
      },
    });
  } catch (error) {
    console.error('Failed to save public form submission:', error);
    return null;
  }
}