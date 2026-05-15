import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/alerts
 * Optional query: ?unread=1
 */
export async function GET(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.organizationId) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const unread = searchParams.get('unread') === '1'

  const where: any = { organizationId: user.organizationId }
  if (unread) where.isRead = false

  const alerts = await db.alert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      machine: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(alerts)
}
