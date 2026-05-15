import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mobile/logout
 * Header: Authorization: Bearer <token>
 * Body (optional): { pushToken?: string }
 *
 * If a push token is provided we delete it so the device stops receiving
 * notifications. JWTs themselves are stateless so the client should just
 * discard the token.
 */
export async function POST(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const pushToken = typeof body?.pushToken === 'string' ? body.pushToken : null
    if (pushToken) {
      await db.mobilePushToken
        .deleteMany({
          where: { userId: user.id, token: pushToken },
        })
        .catch(() => {})
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mobile/logout] error:', err)
    return NextResponse.json({ ok: true })
  }
}
