'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface POItem {
  id?: string;
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
  approvedBy?: string;
  machineName?: string;
  expectedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  draft: number;
  submitted: number;
  ordered: number;
  received: number;
  totalValue: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:      { label: 'Draft',     color: 'text-gray-600',   bg: 'bg-gray-100',    border: 'border-gray-200' },
  SUBMITTED:  { label: 'Submitted', color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-200' },
  APPROVED:   { label: 'Approved',  color: 'text-purple-700', bg: 'bg-purple-50',   border: 'border-purple-200' },
  ORDERED:    { label: 'Ordered',   color: 'text-amber-700',  bg: 'bg-amber-50',    border: 'border-amber-200' },
  RECEIVED:   { label: 'Received',  color: 'text-emerald-700',bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  CANCELLED:  { label: 'Cancelled', color: 'text-red-600',    bg: 'bg-red-50',      border: 'border-red-200' },
};

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ORDERED', 'CANCELLED'],
  ORDERED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

const emptyItem = (): POItem => ({ partName: '', partNumber: '', quantity: 1, unitPrice: 0, unit: 'ea' });
const emptyForm = () => ({
  supplier: '', supplierEmail: '', supplierPhone: '',
  notes: '', machineName: '', expectedDelivery: '', tax: '0',
  items: [emptyItem()],
});

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, submitted: 0, ordered: 0, received: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/purchase-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.purchaseOrders || []);
        setStats(data.stats || {});
      }
    } catch {}
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const subtotal = form.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const taxAmt = subtotal * (parseFloat(form.tax) || 0) / 100;
  const total = subtotal + taxAmt;

  const updateItem = (idx: number, field: keyof POItem, value: any) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value };
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleCreate = async () => {
    setFormError('');
    if (!form.supplier.trim()) { setFormError('Supplier name is required.'); return; }
    if (form.items.some(i => !i.partName.trim())) { setFormError('All items need a part name.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tax: parseFloat(form.tax) || 0 }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(emptyForm());
        showToast('success', 'Purchase order created!');
        fetchOrders();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Failed to create PO');
      }
    } catch { setFormError('Failed to create. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (po: PurchaseOrder, newStatus: string) => {
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: po.id, status: newStatus }),
      });
      if (res.ok) {
        showToast('success', `Order ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
        fetchOrders();
        if (selectedPO?.id === po.id) {
          const data = await res.json();
          setSelectedPO(data.purchaseOrder);
        }
      }
    } catch { showToast('error', 'Update failed'); }
  };

  const handleDelete = async (po: PurchaseOrder) => {
    if (!confirm(`Delete ${po.poNumber}?`)) return;
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: po.id }),
      });
      if (res.ok) { showToast('success', 'Deleted.'); fetchOrders(); setSelectedPO(null); }
      else { const d = await res.json(); showToast('error', d.error || 'Delete failed'); }
    } catch { showToast('error', 'Delete failed'); }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.text}</div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#0a2540]">Purchase Orders</h1>
              <p className="text-sm text-[#425466]">Manage parts requests and supplier orders</p>
            </div>
            <button
              onClick={() => { setForm(emptyForm()); setFormError(''); setShowForm(true); }}
              className="px-4 py-2 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors"
            >
              + New Purchase Order
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: stats.total, color: '' },
            { label: 'Drafts', value: stats.draft, color: 'text-gray-600' },
            { label: 'Submitted', value: stats.submitted, color: 'text-blue-600' },
            { label: 'Ordered', value: stats.ordered, color: 'text-amber-600' },
            { label: 'Total Value', value: `$${(stats.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-[#635bff]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[#e6ebf1] p-4">
              <p className="text-xs text-[#8898aa] uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color || 'text-[#0a2540]'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <input
            type="text"
            placeholder="Search by supplier, PO#, or part…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 text-sm border border-[#e6ebf1] rounded-lg bg-white focus:outline-none focus:border-[#635bff]"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[#e6ebf1] rounded-lg bg-white text-[#425466] focus:outline-none focus:border-[#635bff]"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#e6ebf1] p-12 text-center text-[#8898aa]">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e6ebf1] p-12 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="font-semibold text-[#0a2540] mb-1">No purchase orders yet</h3>
            <p className="text-sm text-[#425466] mb-4">Create your first PO to start tracking parts requests and supplier orders.</p>
            <button
              onClick={() => { setForm(emptyForm()); setShowForm(true); }}
              className="px-4 py-2 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors"
            >
              Create First PO
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e6ebf1] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f9fc] border-b border-[#e6ebf1]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">PO #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">Items</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f8]">
                {orders.map(po => {
                  const sc = STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr key={po.id} className="hover:bg-[#f6f9fc] transition-colors cursor-pointer" onClick={() => setSelectedPO(po)}>
                      <td className="px-5 py-4">
                        <span className="font-mono font-semibold text-[#635bff]">{po.poNumber}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#0a2540]">{po.supplier}</p>
                        {po.machineName && <p className="text-xs text-[#8898aa]">{po.machineName}</p>}
                      </td>
                      <td className="px-4 py-4 text-[#425466]">{po.items.length} item{po.items.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-4 text-right font-semibold text-[#0a2540]">
                        ${(po.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sc.color} ${sc.bg} ${sc.border}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#8898aa] text-xs">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {STATUS_FLOW[po.status]?.slice(0, 1).map(nextStatus => (
                            <button
                              key={nextStatus}
                              onClick={() => handleStatusChange(po, nextStatus)}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                nextStatus === 'CANCELLED'
                                  ? 'text-red-600 border-red-200 hover:bg-red-50'
                                  : 'text-[#635bff] border-[#635bff]/30 hover:bg-[#635bff]/10'
                              }`}
                            >
                              {STATUS_CONFIG[nextStatus]?.label || nextStatus}
                            </button>
                          ))}
                          {['DRAFT', 'CANCELLED'].includes(po.status) && (
                            <button
                              onClick={() => handleDelete(po)}
                              className="p-1 text-red-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PO Detail Modal ─── */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPO(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-[#0a2540] font-mono">{selectedPO.poNumber}</h2>
                    {(() => { const sc = STATUS_CONFIG[selectedPO.status]; return (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sc.color} ${sc.bg} ${sc.border}`}>{sc.label}</span>
                    );})()}
                  </div>
                  <p className="text-sm text-[#425466]">Supplier: <strong>{selectedPO.supplier}</strong></p>
                  {selectedPO.supplierEmail && <p className="text-xs text-[#8898aa]">{selectedPO.supplierEmail}</p>}
                </div>
                <button onClick={() => setSelectedPO(null)} className="text-[#8898aa] hover:text-[#425466] text-xl">×</button>
              </div>

              {/* Items */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-[#8898aa] uppercase tracking-wide mb-2">Items</h3>
                <div className="border border-[#e6ebf1] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f6f9fc]">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-[#8898aa]">Part</th>
                        <th className="text-right px-3 py-2 text-xs text-[#8898aa]">Qty</th>
                        <th className="text-right px-3 py-2 text-xs text-[#8898aa]">Unit Price</th>
                        <th className="text-right px-4 py-2 text-xs text-[#8898aa]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f8]">
                      {selectedPO.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-[#0a2540]">{item.partName}</p>
                            {item.partNumber && <p className="text-xs text-[#8898aa] font-mono">{item.partNumber}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-right text-[#425466]">{item.quantity} {item.unit || 'ea'}</td>
                          <td className="px-3 py-2.5 text-right text-[#425466]">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-[#0a2540]">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-[#e6ebf1]">
                      <tr><td colSpan={3} className="px-4 py-2 text-right text-sm text-[#8898aa]">Subtotal</td><td className="px-4 py-2 text-right font-medium">${selectedPO.subtotal.toFixed(2)}</td></tr>
                      {selectedPO.tax > 0 && <tr><td colSpan={3} className="px-4 py-2 text-right text-sm text-[#8898aa]">Tax</td><td className="px-4 py-2 text-right font-medium">${selectedPO.tax.toFixed(2)}</td></tr>}
                      <tr className="bg-[#f6f9fc]"><td colSpan={3} className="px-4 py-2 text-right font-semibold">Total</td><td className="px-4 py-2 text-right font-bold text-[#635bff]">${selectedPO.total.toFixed(2)}</td></tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                <div><p className="text-xs text-[#8898aa]">Requested by</p><p className="font-medium text-[#0a2540]">{selectedPO.requestedBy}</p></div>
                {selectedPO.approvedBy && <div><p className="text-xs text-[#8898aa]">Approved by</p><p className="font-medium text-[#0a2540]">{selectedPO.approvedBy}</p></div>}
                {selectedPO.machineName && <div><p className="text-xs text-[#8898aa]">Equipment</p><p className="font-medium text-[#0a2540]">{selectedPO.machineName}</p></div>}
                {selectedPO.expectedDelivery && <div><p className="text-xs text-[#8898aa]">Expected Delivery</p><p className="font-medium text-[#0a2540]">{selectedPO.expectedDelivery}</p></div>}
                <div><p className="text-xs text-[#8898aa]">Created</p><p className="font-medium text-[#0a2540]">{new Date(selectedPO.createdAt).toLocaleDateString()}</p></div>
              </div>
              {selectedPO.notes && <div className="mb-5 p-3 bg-[#f6f9fc] rounded-lg text-sm text-[#425466]"><span className="font-semibold">Notes: </span>{selectedPO.notes}</div>}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {STATUS_FLOW[selectedPO.status]?.map(nextStatus => (
                  <button
                    key={nextStatus}
                    onClick={() => handleStatusChange(selectedPO, nextStatus)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      nextStatus === 'CANCELLED'
                        ? 'border border-red-200 text-red-600 hover:bg-red-50'
                        : 'bg-[#635bff] text-white hover:bg-[#4f46e5]'
                    }`}
                  >
                    Mark as {STATUS_CONFIG[nextStatus]?.label || nextStatus}
                  </button>
                ))}
                {['DRAFT', 'CANCELLED'].includes(selectedPO.status) && (
                  <button onClick={() => handleDelete(selectedPO)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create PO Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#0a2540] mb-5">Create Purchase Order</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Supplier *</label>
                    <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                      placeholder="Acme Industrial Supply" className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Supplier Email</label>
                    <input type="email" value={form.supplierEmail} onChange={e => setForm(f => ({ ...f, supplierEmail: e.target.value }))}
                      placeholder="orders@supplier.com" className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Supplier Phone</label>
                    <input type="tel" value={form.supplierPhone} onChange={e => setForm(f => ({ ...f, supplierPhone: e.target.value }))}
                      placeholder="+1 (555) 000-0000" className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Equipment / Machine</label>
                    <input type="text" value={form.machineName} onChange={e => setForm(f => ({ ...f, machineName: e.target.value }))}
                      placeholder="Press #3 (optional)" className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Expected Delivery</label>
                    <input type="date" value={form.expectedDelivery} onChange={e => setForm(f => ({ ...f, expectedDelivery: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]" />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#425466] uppercase tracking-wide">Line Items *</label>
                    <button onClick={addItem} className="text-xs text-[#635bff] hover:underline">+ Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input type="text" value={item.partName} onChange={e => updateItem(idx, 'partName', e.target.value)}
                            placeholder="Part name *" className="w-full px-2.5 py-2 border border-[#e6ebf1] rounded-lg text-xs focus:outline-none focus:border-[#635bff]" />
                        </div>
                        <div className="col-span-2">
                          <input type="text" value={item.partNumber || ''} onChange={e => updateItem(idx, 'partNumber', e.target.value)}
                            placeholder="Part #" className="w-full px-2.5 py-2 border border-[#e6ebf1] rounded-lg text-xs focus:outline-none focus:border-[#635bff]" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                            placeholder="Qty" className="w-full px-2.5 py-2 border border-[#e6ebf1] rounded-lg text-xs focus:outline-none focus:border-[#635bff]" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                            placeholder="Price" className="w-full px-2.5 py-2 border border-[#e6ebf1] rounded-lg text-xs focus:outline-none focus:border-[#635bff]" />
                        </div>
                        <div className="col-span-1 text-right text-xs font-medium text-[#0a2540]">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {form.items.length > 1 && (
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm">×</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e6ebf1]">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#8898aa]">Tax %:</label>
                      <input type="number" min="0" max="100" step="0.1" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))}
                        className="w-16 px-2 py-1 border border-[#e6ebf1] rounded text-xs focus:outline-none focus:border-[#635bff]" />
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-[#8898aa]">Subtotal: ${subtotal.toFixed(2)}</p>
                      {taxAmt > 0 && <p className="text-[#8898aa]">Tax: ${taxAmt.toFixed(2)}</p>}
                      <p className="font-bold text-[#0a2540]">Total: ${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any special instructions or notes…" rows={2}
                    className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]" />
                </div>

                {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{formError}</div>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
                  {saving ? 'Creating…' : 'Create Purchase Order'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}