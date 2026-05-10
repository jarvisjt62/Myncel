import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Static navigation pages for search
const NAVIGATION_PAGES = [
  // Dashboard tabs (hash-based navigation)
  { id: 'dashboard-equipment', type: 'page', title: 'Equipment', subtitle: 'Dashboard - Equipment list and management', url: '/dashboard#equipment', keywords: ['equipment', 'machines', 'assets', 'devices'] },
  { id: 'dashboard-workorders', type: 'page', title: 'Work Orders', subtitle: 'Dashboard - Work order management', url: '/dashboard#workorders', keywords: ['work', 'orders', 'wo', 'tickets', 'jobs'] },
  { id: 'dashboard-parts', type: 'page', title: 'Parts', subtitle: 'Dashboard - Parts and inventory', url: '/dashboard#parts', keywords: ['parts', 'inventory', 'stock', 'supplies'] },
  { id: 'dashboard-schedules', type: 'page', title: 'Schedules', subtitle: 'Dashboard - Maintenance schedules', url: '/dashboard#schedules', keywords: ['schedules', 'maintenance', 'pm', 'preventive', 'calendar', 'tasks'] },
  { id: 'dashboard-reports', type: 'page', title: 'Reports', subtitle: 'Dashboard - Analytics and reports', url: '/dashboard#reports', keywords: ['reports', 'analytics', 'statistics', 'metrics', 'kpi'] },
  { id: 'dashboard-alerts', type: 'page', title: 'Alerts', subtitle: 'Dashboard - Alerts and notifications', url: '/dashboard#alerts', keywords: ['alerts', 'notifications', 'warnings', 'alarms'] },
  { id: 'dashboard-iot', type: 'page', title: 'IoT Dashboard', subtitle: 'Dashboard - IoT monitoring', url: '/dashboard#iot', keywords: ['iot', 'sensors', 'monitoring', 'realtime', 'live'] },
  { id: 'dashboard-settings', type: 'page', title: 'Dashboard Settings', subtitle: 'Dashboard - Configuration', url: '/dashboard#settings', keywords: ['settings', 'config', 'preferences'] },
  
  // Settings pages
  { id: 'settings', type: 'page', title: 'Settings', subtitle: 'Account and organization settings', url: '/settings', keywords: ['settings', 'account', 'organization', 'preferences'] },
  { id: 'settings-team', type: 'page', title: 'Team', subtitle: 'Team members and permissions', url: '/settings/team', keywords: ['team', 'members', 'users', 'permissions', 'roles'] },
  { id: 'settings-billing', type: 'page', title: 'Billing', subtitle: 'Subscription and payment settings', url: '/settings/billing', keywords: ['billing', 'payment', 'subscription', 'invoice', 'plan'] },
  { id: 'settings-integrations', type: 'page', title: 'Integrations', subtitle: 'Third-party integrations', url: '/settings/integrations', keywords: ['integrations', 'connect', 'api', 'third-party', 'apps'] },
  { id: 'settings-security', type: 'page', title: 'Security', subtitle: 'Security settings and 2FA', url: '/settings/security', keywords: ['security', '2fa', 'password', 'mfa', 'authentication'] },
  { id: 'settings-notifications', type: 'page', title: 'Notification Settings', subtitle: 'Email and notification preferences', url: '/settings/notifications', keywords: ['notifications', 'email', 'alerts', 'preferences'] },
  { id: 'settings-api-keys', type: 'page', title: 'API Keys', subtitle: 'API key management', url: '/settings/api-keys', keywords: ['api', 'keys', 'tokens', 'developer'] },
  { id: 'settings-webhooks', type: 'page', title: 'Webhooks', subtitle: 'Webhook configuration', url: '/settings/webhooks', keywords: ['webhooks', 'callbacks', 'events', 'hooks'] },
  
  // Dashboard sub-pages
  { id: 'iot-simulator', type: 'page', title: 'IoT Simulator', subtitle: 'Simulate sensor data for testing', url: '/dashboard/iot-simulator', keywords: ['iot', 'simulator', 'test', 'mock', 'sensor', 'demo'] },
  { id: 'hmi', type: 'page', title: 'HMI Interface', subtitle: 'Human Machine Interface', url: '/dashboard/hmi', keywords: ['hmi', 'interface', 'control', 'panel', 'operator'] },
  { id: 'gateway-setup', type: 'page', title: 'Gateway Setup', subtitle: 'Configure IoT gateway', url: '/dashboard/gateway-setup', keywords: ['gateway', 'setup', 'iot', 'configure', 'connect'] },
  
  // Equipment pages
  { id: 'equipment-qr-labels', type: 'page', title: 'QR Labels', subtitle: 'Generate equipment QR labels', url: '/equipment/qr-labels', keywords: ['qr', 'labels', 'equipment', 'tags', 'barcode'] },
  { id: 'equipment-scan', type: 'page', title: 'Scan Equipment', subtitle: 'Scan QR codes for equipment', url: '/equipment/scan', keywords: ['scan', 'qr', 'equipment', 'mobile'] },
  { id: 'equipment-floor-plan', type: 'page', title: 'Floor Plan', subtitle: 'Equipment floor plan view', url: '/equipment/floor-plan', keywords: ['floor', 'plan', 'map', 'layout', 'location'] },
  
  // Support pages
  { id: 'support', type: 'page', title: 'Support', subtitle: 'Help and support center', url: '/support', keywords: ['support', 'help', 'documentation', 'docs', 'faq'] },
  { id: 'contact', type: 'page', title: 'Contact', subtitle: 'Contact us', url: '/contact', keywords: ['contact', 'email', 'reach', 'inquiry'] },
  { id: 'changelog', type: 'page', title: 'Changelog', subtitle: 'Recent updates and changes', url: '/changelog', keywords: ['changelog', 'updates', 'changes', 'new', 'release'] },
];


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const types = searchParams.get('types')?.split(',') || ['machines', 'work-orders', 'parts', 'maintenance'];
    const limit = parseInt(searchParams.get('limit') || '10');

    const results: Record<string, unknown[]> = {};
    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

    // Search machines
    if (types.includes('machines')) {
      const machineWhere: Prisma.MachineWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { model: { contains: term, mode: 'insensitive' } },
            { manufacturer: { contains: term, mode: 'insensitive' } },
            { serialNumber: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const machines = await db.machine.findMany({
        where: machineWhere,
        take: limit,
        select: {
          id: true,
          name: true,
          model: true,
          manufacturer: true,
          status: true,
          category: true,
          location: true,
        },
      });

      results.machines = machines.map(m => ({
        ...m,
        type: 'machine',
        title: m.name,
        subtitle: `${m.manufacturer || ''} ${m.model || ''}`.trim() || m.category,
        url: `/dashboard?machineId=${m.id}#equipment`,
      }));
    }

    // Search work orders
    if (types.includes('work-orders')) {
      const woWhere: Prisma.WorkOrderWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { woNumber: { contains: term, mode: 'insensitive' } },
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const workOrders = await db.workOrder.findMany({
        where: woWhere,
        take: limit,
        select: {
          id: true,
          woNumber: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          machine: { select: { name: true } },
        },
      });

      results.workOrders = workOrders.map(wo => ({
        ...wo,
        type: 'work-order',
        title: `${wo.woNumber}: ${wo.title}`,
        subtitle: wo.machine?.name || 'No machine',
        url: `/dashboard?workOrderId=${wo.id}#workorders`,
      }));
    }

    // Search parts
    if (types.includes('parts')) {
      const partsWhere: Prisma.PartWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { partNumber: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { supplier: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const parts = await db.part.findMany({
        where: partsWhere,
        take: limit,
        select: {
          id: true,
          name: true,
          partNumber: true,
          quantity: true,
          minQuantity: true,
        },
      });

      results.parts = parts.map(p => ({
        ...p,
        type: 'part',
        title: p.name,
        subtitle: p.partNumber || `Qty: ${p.quantity}`,
        lowStock: p.quantity <= p.minQuantity,
        url: `/dashboard?partId=${p.id}#parts`,
      }));
    }

    // Search maintenance tasks
    if (types.includes('maintenance')) {
      const tasksWhere: Prisma.MaintenanceTaskWhereInput = {
        organizationId,
        OR: searchTerms.map(term => ({
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        })),
      };

      const tasks = await db.maintenanceTask.findMany({
        where: tasksWhere,
        take: limit,
        select: {
          id: true,
          title: true,
          taskType: true,
          frequency: true,
          nextDueAt: true,
          machine: { select: { name: true } },
        },
      });

      results.maintenanceTasks = tasks.map(t => ({
        ...t,
        type: 'maintenance-task',
        title: t.title,
        subtitle: `${t.machine.name} • ${t.frequency}`,
        url: `/dashboard?taskId=${t.id}#schedules`,
      }));
    }

    // Search navigation pages
    if (types.includes('pages')) {
      const pageResults = NAVIGATION_PAGES.filter(page => {
        const searchText = `${page.title} ${page.subtitle} ${page.keywords.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term.toLowerCase()));
      });
      
      results.pages = pageResults.slice(0, limit);
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    return NextResponse.json({
      query,
      totalResults,
      results,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}