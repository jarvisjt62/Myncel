import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/machines
 * Returns machines for the authenticated user's organization.
 */
export async function GET(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId) return NextResponse.json([])

  const machines = await db.machine.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          workOrders: true,
          maintenanceTasks: true,
          alerts: true,
        },
      },
    },
  })

  return NextResponse.json(machines)
}
