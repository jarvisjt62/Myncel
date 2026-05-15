import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/work-orders
 * Optional query: ?status=OPEN&assignedToMe=1
 */
export async function GET(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const assignedToMe = searchParams.get('assignedToMe') === '1'

  const where: any = { organizationId: user.organizationId }
  if (status) where.status = status
  if (assignedToMe) where.assignedToId = user.id

  const workOrders = await db.workOrder.findMany({
    where,
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    take: 200,
    include: {
      machine: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json(workOrders)
}
