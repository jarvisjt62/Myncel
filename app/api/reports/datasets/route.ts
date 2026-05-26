/**
 * GET /api/reports/datasets
 *   Return the dataset registry so the create-report UI can render
 *   filter forms dynamically. Pure metadata, no auth-sensitive data.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DATASETS } from '@/lib/reports/datasets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const datasets = Object.values(DATASETS).map(d => ({
    id: d.id,
    label: d.label,
    description: d.description,
    supportsDateRange: d.supportsDateRange,
    filters: d.filters,
    columns: d.columns,
  }));

  return NextResponse.json({ datasets });
}
