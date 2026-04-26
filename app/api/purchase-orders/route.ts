import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * Purchase Orders API
 * Stored as a JSON file per organization (no schema migration needed).
 * In production, add a PurchaseOrder model to Prisma schema.
 */

interface POItem {
  id: string;
  partName: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  supplier: string;
  supplierEmail?: string;
  supplierPhone?: string;
  items: POItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  requestedBy: string;
  requestedById: string;
  approvedBy?: string;
  workOrderId?: string;
  machineId?: string;
  machineName?: string;
  expectedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

// GET - list purchase orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, organizationId: true, role: true, name: true },
      }),
      null
    );
    if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    let orders = await loadPOs(user.organizationId);

    if (status) orders = orders.filter(o => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(o =>
        o.poNumber.toLowerCase().includes(q) ||
        o.supplier.toLowerCase().includes(q) ||
        o.items.some(i => i.partName.toLowerCase().includes(q))
      );
    }

    // Sort by createdAt desc
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const stats = {
      total: orders.length,
      draft: orders.filter(o => o.status === 'DRAFT').length,
      submitted: orders.filter(o => o.status === 'SUBMITTED').length,
      ordered: orders.filter(o => o.status === 'ORDERED').length,
      received: orders.filter(o => o.status === 'RECEIVED').length,
      totalValue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    };

    return NextResponse.json({ purchaseOrders: orders, stats });
  } catch (error) {
    console.error('PO GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - create purchase order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, organizationId: true, role: true, name: true },
      }),
      null
    );
    if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { supplier, supplierEmail, supplierPhone, items, notes, workOrderId, machineId, machineName, expectedDelivery, tax = 0 } = body;

    if (!supplier || !items || items.length === 0) {
      return NextResponse.json({ error: 'Supplier and at least one item are required' }, { status: 400 });
    }

    const orders = await loadPOs(user.organizationId);
    const poNumber = `PO-${String(orders.length + 1).padStart(4, '0')}`;

    const subtotal = items.reduce((sum: number, i: POItem) => sum + (i.quantity * i.unitPrice), 0);
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount;

    const newPO: PurchaseOrder = {
      id: crypto.randomUUID(),
      poNumber,
      status: 'DRAFT',
      supplier,
      supplierEmail,
      supplierPhone,
      items: items.map((i: any) => ({ ...i, id: crypto.randomUUID() })),
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      notes,
      requestedBy: user.name || session.user.name || 'Unknown',
      requestedById: user.id,
      workOrderId,
      machineId,
      machineName,
      expectedDelivery,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newPO);
    await savePOs(user.organizationId, orders);

    return NextResponse.json({ success: true, purchaseOrder: newPO }, { status: 201 });
  } catch (error) {
    console.error('PO POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - update purchase order (status change, receive, etc.)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, organizationId: true, role: true, name: true },
      }),
      null
    );
    if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { id, status, approvedBy, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'PO id required' }, { status: 400 });

    const orders = await loadPOs(user.organizationId);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

    const updated: PurchaseOrder = {
      ...orders[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (status) updated.status = status;
    if (approvedBy) updated.approvedBy = approvedBy;

    // Recalculate totals if items changed
    if (updates.items) {
      updated.subtotal = updates.items.reduce((sum: number, i: POItem) => sum + (i.quantity * i.unitPrice), 0);
      updated.tax = updated.subtotal * (updates.tax || 0) / 100;
      updated.total = updated.subtotal + updated.tax;
    }

    orders[idx] = updated;
    await savePOs(user.organizationId, orders);

    return NextResponse.json({ success: true, purchaseOrder: updated });
  } catch (error) {
    console.error('PO PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - delete purchase order
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, organizationId: true, role: true },
      }),
      null
    );
    if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'PO id required' }, { status: 400 });

    const orders = await loadPOs(user.organizationId);
    const po = orders.find(o => o.id === id);
    if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only DRAFT or CANCELLED can be deleted
    if (!['DRAFT', 'CANCELLED'].includes(po.status)) {
      return NextResponse.json({ error: 'Only draft or cancelled orders can be deleted' }, { status: 400 });
    }

    const updated = orders.filter(o => o.id !== id);
    await savePOs(user.organizationId, updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PO DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function loadPOs(orgId: string): Promise<PurchaseOrder[]> {
  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile(`/tmp/pos-${orgId}.json`, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function savePOs(orgId: string, orders: PurchaseOrder[]): Promise<void> {
  const fs = await import('fs/promises');
  await fs.writeFile(`/tmp/pos-${orgId}.json`, JSON.stringify(orders, null, 2));
}