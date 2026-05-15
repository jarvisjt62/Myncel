import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/maintenance-tasks
 * Returns active maintenance schedules for the user's organization.
 */
export async function GET(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId) return NextResponse.json([])

  const tasks = await db.maintenanceTask.findMany({
    where: { organizationId: user.organizationId, isActive: true },
    orderBy: { nextDueAt: 'asc' },
    take: 200,
    include: {
      machine: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(tasks)
}
