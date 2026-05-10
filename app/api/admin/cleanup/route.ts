import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow OWNER or ADMIN to cleanup
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const orgId = user.organizationId

    // Delete all data for this organization in the correct order
    // (due to foreign key constraints)
    await db.$transaction(async (tx) => {
      // Delete alerts
      await tx.alert.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete work order parts
      await tx.workOrderPart.deleteMany({
        where: { workOrder: { organizationId: orgId } },
      })

      // Delete work orders
      await tx.workOrder.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete maintenance tasks
      await tx.maintenanceTask.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete sensor readings
      await tx.sensorReading.deleteMany({
        where: { machine: { organizationId: orgId } },
      })

      // Delete machines
      await tx.machine.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete parts inventory
      await tx.part.deleteMany({
        where: { organizationId: orgId },
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: 'All data has been cleared for your organization' 
    })

  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Failed to cleanup data' }, { status: 500 })
  }
}