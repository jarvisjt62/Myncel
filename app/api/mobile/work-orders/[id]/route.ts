import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/work-orders/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const wo = await db.workOrder.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
    include: {
      machine: { select: { id: true, name: true, location: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      maintenanceTask: { select: { id: true, title: true } },
      parts: { include: { part: true } },
    },
  })

  if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(wo)
}

/**
 * PATCH /api/mobile/work-orders/[id]
 * Body: { status?, completionNotes?, actualMinutes? }
 *
 * Allows the assignee (or a manager/admin) to update progress from mobile.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await db.workOrder.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAssignee = existing.assignedToId === user.id
  const isManager = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user.role)
  if (!isAssignee && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const data: any = {}

  if (body.status && typeof body.status === 'string') {
    const allowed = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status
    if (body.status === 'IN_PROGRESS' && !existing.startedAt) {
      data.startedAt = new Date()
    }
    if (body.status === 'COMPLETED') {
      data.completedAt = new Date()
    }
  }
  if (typeof body.completionNotes === 'string') {
    data.completionNotes = body.completionNotes
  }
  if (typeof body.actualMinutes === 'number' && body.actualMinutes >= 0) {
    data.actualMinutes = Math.round(body.actualMinutes)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields' }, { status: 400 })
  }

  const updated = await db.workOrder.update({
    where: { id: existing.id },
    data,
    include: {
      machine: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json(updated)
}
