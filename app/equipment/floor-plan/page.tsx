'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Machine {
  id: string;
  name: string;
  status: string;
  location?: string;
}

interface Position {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

const STATUS_COLORS: Record<string, string> = {
  OPERATIONAL: '#10b981',
  MAINTENANCE: '#f59e0b',
  DOWN: '#ef4444',
  OFFLINE: '#6b7280',
};

export default function FloorPlanPage() {
  const [floorPlan, setFloorPlan] = useState<string | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragMachine, setDragMachine] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/equipment/floor-plan');
      if (res.ok) {
        const data = await res.json();
        setFloorPlan(data.floorPlan);
        setMachines(data.machines || []);
        setPositions(data.positions || {});
      }
    } catch (e) {
      console.error('Failed to load floor plan:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/equipment/floor-plan', { method: 'PUT', body: fd });
      if (res.ok) {
        const data = await res.json();
        setFloorPlan(data.imageUrl);
        showToast('success', 'Floor plan uploaded!');
      } else {
        const d = await res.json();
        showToast('error', d.error || 'Upload failed');
      }
    } catch {
      showToast('error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePositions = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/equipment/floor-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      });
      if (res.ok) showToast('success', 'Positions saved!');
      else showToast('error', 'Failed to save positions');
    } catch {
      showToast('error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Drag-and-drop handlers
  const handleMachineDragStart = (e: React.MouseEvent | React.TouchEvent, machineId: string) => {
    e.preventDefault();
    setDragMachine(machineId);

    const mapEl = mapRef.current;
    if (!mapEl) return;
    const rect = mapEl.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = positions[machineId] || { x: 10, y: 10 };
    const pinX = rect.left + (pos.x / 100) * rect.width;
    const pinY = rect.top + (pos.y / 100) * rect.height;
    setDragOffset({ x: clientX - pinX, y: clientY - pinY });
  };

  const handleMapMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragMachine || !mapRef.current) return;
    e.preventDefault();
    const rect = mapRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.min(100, Math.max(0, ((clientX - dragOffset.x - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - dragOffset.y - rect.top) / rect.height) * 100));
    setPositions(prev => ({ ...prev, [dragMachine]: { x, y } }));
  };

  const handleMapMouseUp = () => { setDragMachine(null); };

  const placedMachines = machines.filter(m => positions[m.id]);
  const unplacedMachines = machines.filter(m => !positions[m.id]);

  const handlePlaceMachine = (machineId: string) => {
    // Place in a default position
    setPositions(prev => ({ ...prev, [machineId]: { x: 50, y: 50 } }));
  };

  const handleRemovePlacement = (machineId: string) => {
    setPositions(prev => {
      const next = { ...prev };
      delete next[machineId];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.text}</div>
      )}

      {/* Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/equipment" className="text-[#635bff] hover:underline text-sm">← Equipment</Link>
              <span className="text-[#e6ebf1]">/</span>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Floor Plan</h1>
            </div>
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-page)] disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading…' : floorPlan ? '🔄 Replace Floor Plan' : '📁 Upload Floor Plan'}
              </button>
              {floorPlan && (
                <button
                  onClick={handleSavePositions}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : '💾 Save Layout'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-12 text-center text-[var(--text-muted)]">Loading…</div>
        ) : !floorPlan ? (
          /* Upload prompt */
          <div className="bg-[var(--bg-surface)] rounded-xl border border-dashed border-[#c4cdd6] p-16 text-center">
            <div className="text-6xl mb-4">🏭</div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Upload Your Factory Floor Plan</h2>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
              Upload an image of your factory floor plan, then drag and drop equipment icons onto the map to visualize your machine layout.
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-6">Supported formats: JPEG, PNG, WebP, SVG — up to 10MB</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 bg-[#635bff] text-white font-semibold rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload Floor Plan Image'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Floor plan map */}
            <div className="xl:col-span-4">
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Factory Floor Map</p>
                  <p className="text-xs text-[var(--text-muted)]">Drag equipment icons to position them on the map</p>
                </div>
                <div
                  ref={mapRef}
                  className="relative select-none overflow-hidden"
                  style={{ aspectRatio: '16/9', cursor: dragMachine ? 'grabbing' : 'default' }}
                  onMouseMove={handleMapMouseMove}
                  onMouseUp={handleMapMouseUp}
                  onMouseLeave={handleMapMouseUp}
                  onTouchMove={handleMapMouseMove}
                  onTouchEnd={handleMapMouseUp}
                >
                  {/* Floor plan image */}
                  <img
                    src={floorPlan}
                    alt="Factory floor plan"
                    className="w-full h-full object-contain bg-[var(--bg-page)]"
                    draggable={false}
                  />

                  {/* Machine pins */}
                  {placedMachines.map(machine => {
                    const pos = positions[machine.id]!;
                    const color = STATUS_COLORS[machine.status] || '#6b7280';
                    const isSelected = selectedMachine === machine.id;
                    return (
                      <div
                        key={machine.id}
                        className="absolute"
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: 'grab',
                          zIndex: isSelected ? 20 : 10,
                        }}
                        onMouseDown={e => handleMachineDragStart(e, machine.id)}
                        onTouchStart={e => handleMachineDragStart(e, machine.id)}
                        onClick={() => setSelectedMachine(isSelected ? null : machine.id)}
                      >
                        {/* Pin */}
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110"
                          style={{ background: color }}
                          title={machine.name}
                        >
                          ⚙
                        </div>

                        {/* Tooltip on select */}
                        {isSelected && (
                          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-xl p-3 min-w-[160px] text-xs z-30">
                            <p className="font-bold text-[var(--text-primary)] mb-1">{machine.name}</p>
                            <p className="text-[var(--text-secondary)]">Status: <span style={{ color }}>{machine.status}</span></p>
                            {machine.location && <p className="text-[var(--text-muted)]">{machine.location}</p>}
                            <button
                              onClick={e => { e.stopPropagation(); handleRemovePlacement(machine.id); setSelectedMachine(null); }}
                              className="mt-2 text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove from map
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center gap-4 px-1">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-[var(--text-muted)] capitalize">{status.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: machine list */}
            <div className="space-y-4">
              {unplacedMachines.length > 0 && (
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                    Not Placed ({unplacedMachines.length})
                  </h3>
                  <div className="space-y-2">
                    {unplacedMachines.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[m.status] || '#6b7280' }} />
                          <span className="text-xs font-medium text-[var(--text-primary)] truncate">{m.name}</span>
                        </div>
                        <button
                          onClick={() => handlePlaceMachine(m.id)}
                          className="text-xs text-[#635bff] hover:underline flex-shrink-0"
                        >
                          + Place
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {placedMachines.length > 0 && (
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                    On Map ({placedMachines.length})
                  </h3>
                  <div className="space-y-2">
                    {placedMachines.map(m => (
                      <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#f0fdf4] border border-emerald-100">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[m.status] || '#6b7280' }} />
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">{m.name}</span>
                        <span className="text-xs text-emerald-600">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[var(--bg-page)] rounded-xl border border-[var(--border)] p-4 text-xs text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text-secondary)]">Tips</p>
                <p>• Drag pins to reposition equipment</p>
                <p>• Click a pin to see details</p>
                <p>• Click "Save Layout" to persist positions</p>
                <p>• Upload a new image to replace the floor plan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}