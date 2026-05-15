import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mobile/push-token
 * Header: Authorization: Bearer <token>
 * Body: { token: string, platform: 'ios' | 'android', deviceName?: string, appVersion?: string }
 *
 * Registers (or refreshes) an Expo push token for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const token = String(body?.token || '').trim()
    const platform = String(body?.platform || '').toLowerCase()
    const deviceName = body?.deviceName ? String(body.deviceName) : null
    const appVersion = body?.appVersion ? String(body.appVersion) : null

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }
    if (platform !== 'ios' && platform !== 'android') {
      return NextResponse.json(
        { error: 'platform must be "ios" or "android"' },
        { status: 400 }
      )
    }

    // Upsert: a single Expo token always belongs to one device, but a user
    // may sign in on multiple devices.
    const record = await db.mobilePushToken.upsert({
      where: { token },
      update: {
        userId: user.id,
        platform,
        deviceName,
        appVersion,
        lastUsedAt: new Date(),
      },
      create: {
        userId: user.id,
        token,
        platform,
        deviceName,
        appVersion,
      },
    })

    return NextResponse.json({ ok: true, id: record.id })
  } catch (err) {
    console.error('[mobile/push-token] error:', err)
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 })
  }
}

/**
 * DELETE /api/mobile/push-token?token=<expo-token>
 * Removes a push token (e.g. on logout).
 */
export async function DELETE(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }
  await db.mobilePushToken
    .deleteMany({ where: { userId: user.id, token } })
    .catch(() => {})
  return NextResponse.json({ ok: true })
}
