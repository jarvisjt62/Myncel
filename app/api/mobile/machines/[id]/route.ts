import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/machines/[id]
 * Returns a single machine with related work orders, tasks, alerts.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const machine = await db.machine.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
    include: {
      workOrders: {
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      },
      maintenanceTasks: {
        orderBy: { nextDueAt: 'asc' },
        take: 20,
      },
      alerts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!machine) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(machine)
}
