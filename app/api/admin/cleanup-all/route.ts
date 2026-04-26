import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('Starting full cleanup...')
    
    // Delete all data in the correct order (without transaction to avoid connection issues)
    
    // Delete chat messages first (they reference chat sessions)
    const chatMessages = await db.chatMessage.deleteMany({})
    console.log('Deleted chat messages:', chatMessages.count)
    
    // Delete chat sessions
    const chatSessions = await db.chatSession.deleteMany({})
    console.log('Deleted chat sessions:', chatSessions.count)
    
    // Delete alerts
    const alerts = await db.alert.deleteMany({})
    console.log('Deleted alerts:', alerts.count)
    
    // Delete work order parts
    const workOrderParts = await db.workOrderPart.deleteMany({})
    console.log('Deleted work order parts:', workOrderParts.count)
    
    // Delete work orders
    const workOrders = await db.workOrder.deleteMany({})
    console.log('Deleted work orders:', workOrders.count)
    
    // Delete maintenance tasks
    const maintenanceTasks = await db.maintenanceTask.deleteMany({})
    console.log('Deleted maintenance tasks:', maintenanceTasks.count)
    
    // Delete sensor readings
    const sensorReadings = await db.sensorReading.deleteMany({})
    console.log('Deleted sensor readings:', sensorReadings.count)
    
    // Delete machines
    const machines = await db.machine.deleteMany({})
    console.log('Deleted machines:', machines.count)
    
    // Delete parts
    const parts = await db.part.deleteMany({})
    console.log('Deleted parts:', parts.count)
    
    console.log('Cleanup complete!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'All data cleared',
      deleted: {
        chatMessages: chatMessages.count,
        chatSessions: chatSessions.count,
        alerts: alerts.count,
        workOrderParts: workOrderParts.count,
        workOrders: workOrders.count,
        maintenanceTasks: maintenanceTasks.count,
        sensorReadings: sensorReadings.count,
        machines: machines.count,
        parts: parts.count,
      }
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Failed to cleanup', details: String(error) }, { status: 500 })
  }
}