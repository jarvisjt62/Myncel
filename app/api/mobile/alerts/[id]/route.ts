import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/alerts/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const alert = await db.alert.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
    include: { machine: { select: { id: true, name: true, location: true } } },
  })
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(alert)
}

/**
 * PATCH /api/mobile/alerts/[id]
 * Body: { isRead?: boolean, isResolved?: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await db.alert.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.isRead === 'boolean') data.isRead = body.isRead
  if (typeof body.isResolved === 'boolean') {
    data.isResolved = body.isResolved
    data.resolvedAt = body.isResolved ? new Date() : null
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields' }, { status: 400 })
  }

  const updated = await db.alert.update({ where: { id: existing.id }, data })
  return NextResponse.json(updated)
}
