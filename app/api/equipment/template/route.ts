import { NextResponse } from 'next/server';
import { buildCsvTemplate } from '@/lib/csv/equipment-template';

export const dynamic = 'force-static';

/**
 * Serves the bulk-import CSV template as a download. Public on purpose —
 * no org-specific data is included, just the column headers + a sample
 * row, so prospects can preview the format before signing up.
 */
export async function GET() {
  const csv = buildCsvTemplate();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="myncel-equipment-template.csv"',
      // Cache the static template at the edge — speeds up the download
      // and keeps the API workload minimal.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
