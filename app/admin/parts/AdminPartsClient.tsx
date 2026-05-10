'use client';

import { useState } from 'react';

interface Part {
  id: string;
  name: string;
  partNumber: string | null;
  description: string | null;
  quantity: number;
  minQuantity: number;
  unitCost: number | null;
  supplier: string | null;
  location: string | null;
  imageUrl: string | null;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  parts: Part[];
  _count: { parts: number };
}

type PartWithOrg = Part & { orgName: string; orgId: string };

export default function AdminPartsClient({ organizations: initialOrgs }: { organizations: Organization[] }) {
  const [organizations, setOrganizations] = useState(initialOrgs);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Detail / edit modal state
  const [selectedPart, setSelectedPart] = useState<PartWithOrg | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingPart, setEditingPart] = useState(false);
  const [partEditForm, setPartEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Add part modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, string>>({
    name: '', partNumber: '', description: '', quantity: '0', minQuantity: '1',
    unitCost: '', supplier: '', location: '', organizationId: '', imageUrl: '',
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const selectedOrgs = selectedOrgId === 'all' ? organizations : organizations.filter(o => o.id === selectedOrgId);
  const allParts: PartWithOrg[] = selectedOrgs.flatMap(o => o.parts.map(p => ({ ...p, orgName: o.name, orgId: o.id })));

  const filteredParts = allParts.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.partNumber?.toLowerCase().includes(search.toLowerCase())) ||
      (p.supplier?.toLowerCase().includes(search.toLowerCase()));
    const isLow = p.quantity <= p.minQuantity && p.quantity > 0;
    const isOut = p.quantity === 0;
    const matchStock = stockFilter === 'all' || (stockFilter === 'low' && isLow) || (stockFilter === 'out' && isOut);
    return matchSearch && matchStock;
  });

  const totalParts = allParts.length;
  const lowStock = allParts.filter(p => p.quantity <= p.minQuantity && p.quantity > 0).length;
  const outOfStock = allParts.filter(p => p.quantity === 0).length;
  const totalValue = allParts.reduce((s, p) => s + (p.unitCost ?? 0) * p.quantity, 0);

  const updatePartInState = (updated: Part) => {
    setOrganizations(prev => prev.map(org => ({
      ...org,
      parts: org.parts.map(p => p.id === updated.id ? updated : p),
    })));
    if (selectedPart && selectedPart.id === updated.id) {
      setSelectedPart({ ...updated, orgName: selectedPart.orgName, orgId: selectedPart.orgId });
    }
  };

  const openDetail = (part: PartWithOrg) => {
    setSelectedPart(part);
    setEditingPart(false);
    setPartEditForm({});
    setSaveError('');
    setShowDetail(true);
  };

  const startEdit = (part: PartWithOrg) => {
    setPartEditForm({
      name: part.name,
      partNumber: part.partNumber ?? '',
      description: part.description ?? '',
      quantity: String(part.quantity),
      minQuantity: String(part.minQuantity),
      unitCost: part.unitCost != null ? String(part.unitCost) : '',
      supplier: part.supplier ?? '',
      location: part.location ?? '',
    });
    setEditingPart(true);
    setSaveError('');
  };

  const handleSaveEdit = async () => {
    if (!selectedPart) return;
    if (!partEditForm.name?.trim()) { setSaveError('Part name is required'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/parts/${selectedPart.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...partEditForm,
          quantity: parseInt(partEditForm.quantity) || 0,
          minQuantity: parseInt(partEditForm.minQuantity) || 1,
          unitCost: partEditForm.unitCost ? parseFloat(partEditForm.unitCost) : null,
        }),
      });
      if (res.ok) {
        const { part: updated } = await res.json();
        updatePartInState(updated);
        setEditingPart(false);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to update part');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (partId: string) => {
    if (!confirm('Delete this part? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/parts/${partId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrganizations(prev => prev.map(org => ({ ...org, parts: org.parts.filter(p => p.id !== partId) })));
        setShowDetail(false);
        setSelectedPart(null);
      }
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (file: File, partId: string) => {
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('partId', partId);
      const res = await fetch('/api/parts/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        const { imageUrl } = data;
        updatePartInState({ ...selectedPart!, imageUrl } as Part);
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Upload failed: ${error?.message || 'Network error'}`);
    } finally {
      setImageUploading(false);
    }
  };

  const fileToImageDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Only image files are allowed (JPG, PNG, WebP, GIF)'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File size must be under 5MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read selected image'));
    reader.readAsDataURL(file);
  });

  const handleNewPartImageSelect = async (file: File | null) => {
    if (!file) return;
    setImageUploading(true);
    setAddError('');
    try {
      const imageUrl = await fileToImageDataUrl(file);
      setAddForm(prev => ({ ...prev, imageUrl }));
    } catch (error: any) {
      setAddError(error?.message || 'Could not attach image');
    } finally {
      setImageUploading(false);
    }
  };

  const resetAddForm = () => {
    setAddForm({ name: '', partNumber: '', description: '', quantity: '0', minQuantity: '1', unitCost: '', supplier: '', location: '', organizationId: '', imageUrl: '' });
  };

  const handleAddPart = async () => {
    if (!addForm.name?.trim()) { setAddError('Part name is required'); return; }
    if (!addForm.organizationId) { setAddError('Please select an organization'); return; }
    setAddSaving(true); setAddError('');
    try {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          quantity: parseInt(addForm.quantity) || 0,
          minQuantity: parseInt(addForm.minQuantity) || 1,
          unitCost: addForm.unitCost ? parseFloat(addForm.unitCost) : null,
          organizationId: addForm.organizationId,
        }),
      });
      if (res.ok) {
        const { part } = await res.json();
        // Find org name for the new part
        const org = organizations.find(o => o.id === addForm.organizationId);
        setOrganizations(prev => prev.map(o =>
          o.id === addForm.organizationId
            ? { ...o, parts: [...o.parts, part], _count: { ...o._count, parts: o._count.parts + 1 } }
            : o
        ));
        setShowAddModal(false);
        resetAddForm();
      } else {
        const d = await res.json();
        setAddError(d.error || 'Failed to add part');
      }
    } catch { setAddError('Something went wrong'); }
    finally { setAddSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40";
  const inputStyle = { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Parts Inventory</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Real-time parts inventory across all organizations. Click any row to view or edit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowAddModal(true); setAddError(''); }}
            className="px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors"
          >
            + Add Part
          </button>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(99,91,255,0.08)', color: '#635bff', border: '1px solid rgba(99,91,255,0.25)' }}>
            Admin Mode
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Parts', value: totalParts, color: 'var(--text-primary)', sub: 'Across all orgs' },
          { label: 'Low Stock', value: lowStock, color: lowStock > 0 ? '#f59e0b' : 'var(--text-primary)', sub: 'At or below min qty' },
          { label: 'Out of Stock', value: outOfStock, color: outOfStock > 0 ? '#ef4444' : 'var(--text-primary)', sub: 'Zero quantity' },
          { label: 'Total Inventory Value', value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--text-primary)', sub: 'Estimated value' },
        ].map(card => (
          <div key={card.label} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{card.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Organization</label>
          <select
            value={selectedOrgId}
            onChange={e => setSelectedOrgId(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 appearance-none"
            style={{
              backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
            }}
          >
            <option value="all">All Organizations ({organizations.length})</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name} — {org._count.parts} parts
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Search</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search part name, number, supplier..."
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40"
            style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Stock Status</label>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'low', label: '⚠️ Low' },
              { id: 'out', label: '🔴 Out' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStockFilter(f.id as any)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={stockFilter === f.id
                  ? { backgroundColor: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.35)', color: 'var(--text-primary)' }
                  : { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Parts ({filteredParts.length})
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click any row to view or edit</p>
        </div>

        {filteredParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-secondary)' }}>
            <span className="text-3xl mb-2">📦</span>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No parts found</p>
            <p className="text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Organization', 'Part', 'Part #', 'Qty', 'Min', 'Unit Cost', 'Value', 'Supplier', 'Location', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredParts.map(part => {
                  const isOut = part.quantity === 0;
                  const isLow = part.quantity <= part.minQuantity && !isOut;
                  const value = (part.unitCost ?? 0) * part.quantity;
                  return (
                    <tr key={part.id} className="hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => openDetail(part)}>
                      <td className="px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: '#635bff' }}>{part.orgName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {part.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={part.imageUrl} alt={part.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border" style={{ borderColor: 'var(--border)' }} />
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>🔧</div>
                          )}
                          <div>
                            <div className="font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{part.name}</div>
                            {part.description && <div className="text-xs mt-0.5 max-w-[150px] truncate" style={{ color: 'var(--text-muted)' }}>{part.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{part.partNumber ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold" style={{ color: isOut ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text-primary)' }}>{part.quantity}</td>
                      <td className="px-4 py-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{part.minQuantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{part.unitCost != null ? `$${part.unitCost.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{value > 0 ? `$${value.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{part.supplier ?? '—'}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{part.location ?? '—'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">Out of Stock</span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">Low Stock</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600">In Stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); openDetail(part); }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                          style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowAddModal(false); setAddError(''); }} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Add Part to Organization</h2>
              <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-lg" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Organization selector */}
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Organization *</label>
                <select
                  value={addForm.organizationId}
                  onChange={e => setAddForm(f => ({ ...f, organizationId: e.target.value }))}
                  className={inputCls}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select organization...</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Part Details</p>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Part Name *</label>
                  <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Drive Belt XL-450" className={inputCls} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Part Number</label>
                    <input value={addForm.partNumber} onChange={e => setAddForm(f => ({ ...f, partNumber: e.target.value }))} placeholder="e.g. BELT-XL450" className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Supplier</label>
                    <input value={addForm.supplier} onChange={e => setAddForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Grainger" className={inputCls} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Part Photo</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:w-28 h-24 rounded-xl border border-dashed flex items-center justify-center overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }}>
                      {addForm.imageUrl ? (
                        <img src={addForm.imageUrl} alt="Selected part" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-center px-2" style={{ color: 'var(--text-muted)' }}>No photo selected</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] cursor-pointer">
                        {imageUploading ? 'Loading image...' : (addForm.imageUrl ? 'Change Photo' : 'Upload Photo')}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={imageUploading}
                          onChange={async e => {
                            const file = e.target.files?.[0] || null;
                            await handleNewPartImageSelect(file);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      {addForm.imageUrl && (
                        <button type="button" onClick={() => setAddForm(f => ({ ...f, imageUrl: '' }))} className="text-xs text-red-600 hover:underline self-start">
                          Remove selected photo
                        </button>
                      )}
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Saved when the part is added. Max 5MB.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Stock & Cost</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Quantity</label>
                    <input type="number" value={addForm.quantity} onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))} min="0" className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Min Qty</label>
                    <input type="number" value={addForm.minQuantity} onChange={e => setAddForm(f => ({ ...f, minQuantity: e.target.value }))} min="0" className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Unit Cost ($)</label>
                    <input type="number" value={addForm.unitCost} onChange={e => setAddForm(f => ({ ...f, unitCost: e.target.value }))} placeholder="0.00" step="0.01" min="0" className={inputCls} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Shelf / Bin Location</label>
                  <input value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Warehouse B — Shelf 3" className={inputCls} style={inputStyle} />
                </div>
              </div>
              {addError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{addError}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                <button onClick={handleAddPart} disabled={addSaving || !addForm.name.trim() || !addForm.organizationId} className="flex-1 px-4 py-2.5 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50 flex items-center justify-center gap-2">
                  {addSaving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Adding...</> : '+ Add Part'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part Detail / Edit Modal */}
      {showDetail && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowDetail(false); setEditingPart(false); setSaveError(''); }} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{editingPart ? 'Edit Part' : selectedPart.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(99,91,255,0.1)', color: '#635bff', border: '1px solid rgba(99,91,255,0.25)' }}>{selectedPart.orgName}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedPart.partNumber ? `Part #${selectedPart.partNumber}` : 'No part number'}</p>
              </div>
              <div className="flex items-center gap-2">
                {!editingPart && (
                  <>
                    <button
                      onClick={() => startEdit(selectedPart)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedPart.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
                <button onClick={() => { setShowDetail(false); setEditingPart(false); setSaveError(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-lg" style={{ color: 'var(--text-secondary)' }}>✕</button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Part Image */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)', minHeight: '180px', maxHeight: '280px' }}>
                  {selectedPart.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPart.imageUrl} alt={selectedPart.name} className="w-full h-full object-contain" style={{ maxHeight: '280px' }} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8" style={{ color: 'var(--text-muted)' }}>
                      <span className="text-5xl mb-2">🔧</span>
                      <p className="text-sm">No photo uploaded</p>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2" style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {imageUploading ? (
                    <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Uploading...</>
                  ) : (
                    <><span>📷</span> {selectedPart.imageUrl ? 'Change Photo' : 'Upload Photo'}</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={imageUploading}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageUpload(file, selectedPart.id);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {editingPart ? (
                <div className="space-y-4">
                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Part Details</p>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Part Name *</label>
                      <input value={partEditForm.name ?? ''} onChange={e => setPartEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Part Number</label>
                        <input value={partEditForm.partNumber ?? ''} onChange={e => setPartEditForm(f => ({ ...f, partNumber: e.target.value }))} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Supplier</label>
                        <input value={partEditForm.supplier ?? ''} onChange={e => setPartEditForm(f => ({ ...f, supplier: e.target.value }))} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                      <textarea value={partEditForm.description ?? ''} onChange={e => setPartEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
                    </div>
                  </div>
                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Stock & Cost</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Quantity</label>
                        <input type="number" value={partEditForm.quantity ?? '0'} onChange={e => setPartEditForm(f => ({ ...f, quantity: e.target.value }))} min="0" className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Min Qty</label>
                        <input type="number" value={partEditForm.minQuantity ?? '1'} onChange={e => setPartEditForm(f => ({ ...f, minQuantity: e.target.value }))} min="0" className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Unit Cost ($)</label>
                        <input type="number" value={partEditForm.unitCost ?? ''} onChange={e => setPartEditForm(f => ({ ...f, unitCost: e.target.value }))} placeholder="0.00" step="0.01" min="0" className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Shelf / Bin Location</label>
                      <input value={partEditForm.location ?? ''} onChange={e => setPartEditForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Warehouse B — Shelf 3 — Bin 12" className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setEditingPart(false); setSaveError(''); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                    <button onClick={handleSaveEdit} disabled={saving} className="flex-1 px-4 py-2.5 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</> : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Identification</p>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Part Name</p>
                        <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedPart.name}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Part Number</p>
                        <p className="font-mono text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedPart.partNumber ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Supplier</p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedPart.supplier ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Location</p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedPart.location ?? '—'}</p>
                      </div>
                    </div>
                    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Stock & Cost</p>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quantity on Hand</p>
                        <p className="text-2xl font-bold mt-0.5" style={{ color: selectedPart.quantity === 0 ? '#ef4444' : selectedPart.quantity <= selectedPart.minQuantity ? '#f59e0b' : 'var(--text-primary)' }}>{selectedPart.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Min Quantity (Reorder Point)</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedPart.minQuantity}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Unit Cost</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedPart.unitCost != null ? `$${selectedPart.unitCost.toFixed(2)}` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Value</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                          {selectedPart.unitCost != null ? `$${(selectedPart.unitCost * selectedPart.quantity).toFixed(2)}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Stock Status</p>
                        <div className="mt-1">
                          {selectedPart.quantity === 0 ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">Out of Stock</span>
                          ) : selectedPart.quantity <= selectedPart.minQuantity ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-600">Low Stock</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">In Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedPart.description && (
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest mb-2">Description</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selectedPart.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}