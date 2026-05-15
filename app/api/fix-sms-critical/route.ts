import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * ONE-TIME FIX: Turn off smsCriticalOnly for org cmoaf76en000111ly1vgdj46g
 * This route deletes itself after running (well, it just runs once — delete the file after deploy).
 * GET /api/fix-sms-critical
 */
export async function GET(req: NextRequest) {
  try {
    const ORG_ID = 'cmoaf76en000111ly1vgdj46g'

    const updated = await db.notificationSetting.update({
      where: { organizationId: ORG_ID },
      data: { smsCriticalOnly: false },
    })

    return NextResponse.json({
      success: true,
      message: 'smsCriticalOnly has been set to FALSE. SMS will now fire for ALL severities.',
      smsCriticalOnly: updated.smsCriticalOnly,
      smsEnabled: updated.smsEnabled,
      smsAlerts: updated.smsAlerts,
      smsWorkOrders: updated.smsWorkOrders,
      phoneNumber: updated.phoneNumber,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}
