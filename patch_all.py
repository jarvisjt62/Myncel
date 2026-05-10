#!/usr/bin/env python3
# encoding: utf-8

with open('app/dashboard/DashboardClient.tsx', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# 1. Update Props type to include orgUsers
# ============================================================
content = content.replace(
    "type Props = {\n  user: { name: string; email: string; role: string; organizationName: string };\n  data: {\n    machines: Machine[];\n    workOrders: WorkOrder[];\n    maintenanceTasks: MaintenanceTask[];\n    alerts: Alert[];\n    stats: Stats;\n  };\n};",
    "type OrgUser = { id: string; name: string | null; email: string; role: string };\n\ntype Props = {\n  user: { name: string; email: string; role: string; organizationName: string };\n  data: {\n    machines: Machine[];\n    workOrders: WorkOrder[];\n    maintenanceTasks: MaintenanceTask[];\n    alerts: Alert[];\n    orgUsers: OrgUser[];\n    stats: Stats;\n  };\n};"
)

# ============================================================
# 2. Destructure orgUsers + make machines mutable
# ============================================================
content = content.replace(
    "  const { machines: initialMachines, workOrders: initialWorkOrders, maintenanceTasks: initialTasks, alerts: initialAlerts, stats } = data;\n\n  // Local state for live updates\n  const [machines] = useState(initialMachines);",
    "  const { machines: initialMachines, workOrders: initialWorkOrders, maintenanceTasks: initialTasks, alerts: initialAlerts, orgUsers, stats } = data;\n\n  // Local state for live updates\n  const [machines, setMachines] = useState(initialMachines);"
)

# ============================================================
# 3. Add edit/delete state after loadingDetail state
# ============================================================
content = content.replace(
    "  const [loadingDetail, setLoadingDetail] = useState(false);",
    """  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit/Delete states
  const [editingMachine, setEditingMachine] = useState<any>(null);
  const [editingWo, setEditingWo] = useState<any>(null);
  const [deletingMachineId, setDeletingMachineId] = useState<string | null>(null);
  const [deletingWoId, setDeletingWoId] = useState<string | null>(null);
  const [editMachineForm, setEditMachineForm] = useState<any>({});
  const [editWoForm, setEditWoForm] = useState<any>({});
  const [confirmDeleteMachine, setConfirmDeleteMachine] = useState<any>(null);
  const [confirmDeleteWo, setConfirmDeleteWo] = useState<any>(null);"""
)

# ============================================================
# 4. Add edit/delete handlers before markTaskDone
# ============================================================
content = content.replace(
    "  // Mark maintenance task done\n  const markTaskDone = async (taskId: string) => {",
    """  // Edit Machine
  const openEditMachine = (m: any) => {
    setEditingMachine(m);
    setEditMachineForm({
      name: m.name || '',
      model: m.model || '',
      manufacturer: m.manufacturer || '',
      location: m.location || '',
      category: m.category || 'OTHER',
      criticality: m.criticality || 'MEDIUM',
      status: m.status || 'OPERATIONAL',
      notes: m.notes || '',
    });
  };
  const saveEditMachine = async () => {
    if (!editingMachine) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/machines/${editingMachine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMachineForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...updated.machine } : m));
        setEditingMachine(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to update machine');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };
  const deleteMachine = async (machineId: string) => {
    setDeletingMachineId(machineId);
    try {
      const res = await fetch(`/api/machines/${machineId}`, { method: 'DELETE' });
      if (res.ok) {
        setMachines(prev => prev.filter(m => m.id !== machineId));
        setConfirmDeleteMachine(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to delete machine');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setDeletingMachineId(null); }
  };

  // Edit Work Order
  const openEditWo = (wo: any) => {
    setEditingWo(wo);
    setEditWoForm({
      title: wo.title || '',
      description: wo.description || '',
      type: wo.type || 'PREVENTIVE',
      priority: wo.priority || 'MEDIUM',
      status: wo.status || 'OPEN',
      dueAt: wo.dueAt ? new Date(wo.dueAt).toISOString().slice(0, 16) : '',
      assignedToId: wo.assignedTo?.id || '',
      estimatedMinutes: wo.estimatedMinutes || '',
    });
  };
  const saveEditWo = async () => {
    if (!editingWo) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/work-orders/${editingWo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editWoForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkOrders(prev => prev.map(w => w.id === editingWo.id ? { ...w, ...updated.workOrder } : w));
        setEditingWo(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to update work order');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };
  const deleteWo = async (woId: string) => {
    setDeletingWoId(woId);
    try {
      const res = await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkOrders(prev => prev.filter(w => w.id !== woId));
        setConfirmDeleteWo(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to delete work order');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setDeletingWoId(null); }
  };

  // Mark maintenance task done
  const markTaskDone = async (taskId: string) => {"""
)

# ============================================================
# 5. Add Actions column header to Equipment table
# ============================================================
content = content.replace(
    '                         <th className="px-5 py-3 text-left text-xs font-semibold text-[#425466] uppercase tracking-wide hidden lg:table-cell">Work Orders</th>\n                       </tr>\n                     </thead>',
    '                         <th className="px-5 py-3 text-left text-xs font-semibold text-[#425466] uppercase tracking-wide hidden lg:table-cell">Work Orders</th>\n                         <th className="px-5 py-3 text-right text-xs font-semibold text-[#425466] uppercase tracking-wide">Actions</th>\n                       </tr>\n                     </thead>'
)

# ============================================================
# 6. Update Equipment table rows to add Edit/Delete buttons
# ============================================================
content = content.replace(
    '                         <tr key={m.id} className="hover:bg-[#f6f9fc] transition-colors cursor-pointer" onClick={() => openMachineDetail(m)}>',
    '                         <tr key={m.id} className="hover:bg-[#f6f9fc] transition-colors">'
)
content = content.replace(
    '                           <td className="px-5 py-3.5 text-[#425466] hidden lg:table-cell">\n                             {m._count.workOrders} total\n                           </td>\n                         </tr>',
    '                           <td className="px-5 py-3.5 text-[#425466] hidden lg:table-cell">\n                             {m._count.workOrders} total\n                           </td>\n                           <td className="px-5 py-3.5 text-right">\n                             <div className="flex items-center justify-end gap-2">\n                               <button onClick={() => openMachineDetail(m)} className="text-xs text-[#425466] hover:text-[#635bff] px-2 py-1 rounded hover:bg-[#f6f9fc] transition-colors" title="View details">View</button>\n                               <button onClick={() => openEditMachine(m)} className="text-xs text-[#635bff] hover:text-[#4f46e5] px-2 py-1 rounded hover:bg-[#f0f0ff] transition-colors" title="Edit">Edit</button>\n                               <button onClick={() => setConfirmDeleteMachine(m)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors" title="Delete">Delete</button>\n                             </div>\n                           </td>\n                         </tr>'
)

# ============================================================
# 7. Add Actions column header to Work Orders table
# ============================================================
content = content.replace(
    '                         <th className="px-5 py-3 text-left text-xs font-semibold text-[#425466] uppercase tracking-wide hidden lg:table-cell">Assigned To</th>\n                       </tr>\n                     </thead>',
    '                         <th className="px-5 py-3 text-left text-xs font-semibold text-[#425466] uppercase tracking-wide hidden lg:table-cell">Assigned To</th>\n                         <th className="px-5 py-3 text-right text-xs font-semibold text-[#425466] uppercase tracking-wide">Actions</th>\n                       </tr>\n                     </thead>'
)

# ============================================================
# 8. Update Work Orders table rows to add Edit/Delete buttons
# ============================================================
content = content.replace(
    '                         <tr key={wo.id} className="hover:bg-[#f6f9fc] transition-colors cursor-pointer" onClick={() => openWoDetail(wo)}>',
    '                         <tr key={wo.id} className="hover:bg-[#f6f9fc] transition-colors">'
)
content = content.replace(
    '                           <td className="px-5 py-3.5 text-xs text-[#425466] hidden lg:table-cell">\n                             {wo.assignedTo?.name ?? \'Unassigned\'}\n                           </td>\n                         </tr>',
    '                           <td className="px-5 py-3.5 text-xs text-[#425466] hidden lg:table-cell">\n                             {wo.assignedTo?.name ?? \'Unassigned\'}\n                           </td>\n                           <td className="px-5 py-3.5 text-right">\n                             <div className="flex items-center justify-end gap-2">\n                               <button onClick={() => openWoDetail(wo)} className="text-xs text-[#425466] hover:text-[#635bff] px-2 py-1 rounded hover:bg-[#f6f9fc] transition-colors" title="View details">View</button>\n                               <button onClick={() => openEditWo(wo)} className="text-xs text-[#635bff] hover:text-[#4f46e5] px-2 py-1 rounded hover:bg-[#f0f0ff] transition-colors" title="Edit">Edit</button>\n                               <button onClick={() => setConfirmDeleteWo(wo)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors" title="Delete">Delete</button>\n                             </div>\n                           </td>\n                         </tr>'
)

# ============================================================
# 9. Also update new WO form to include orgUsers in assignedToId dropdown
# ============================================================
# Find and update the assignedToId select in the new WO form
content = content.replace(
    "                {/* Assign To */}\n                <div>\n                  <label className={labelClass}>Assign To</label>\n                  <select value={woForm.assignedToId} onChange={e => setWoForm({...woForm, assignedToId: e.target.value})} className={selectClass}>\n                    <option value=\"\">-- Select team member --</option>\n                  </select>\n                </div>",
    "                {/* Assign To */}\n                <div>\n                  <label className={labelClass}>Assign To</label>\n                  <select value={woForm.assignedToId} onChange={e => setWoForm({...woForm, assignedToId: e.target.value})} className={selectClass}>\n                    <option value=\"\">-- Unassigned --</option>\n                    {orgUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>)}\n                  </select>\n                </div>"
)

# ============================================================
# 10. Add Edit/Delete Modals + Confirm Delete before final closing div
# ============================================================
end_marker = "      {/* \u2500\u2500 Detail Modals \u2500\u2500 */}\n      <MachineDetailModal />\n      <WorkOrderDetailModal />\n    </div>\n  );\n}"

new_ending = """      {/* \u2500\u2500 Detail Modals \u2500\u2500 */}
      <MachineDetailModal />
      <WorkOrderDetailModal />

      {/* Edit Machine Modal */}
      {editingMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingMachine(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e6ebf1]">
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Machine</h3>
              <button onClick={() => setEditingMachine(null)} className="text-[#8898aa] hover:text-[#0a2540]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {saveError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Machine Name</label>
                  <input value={editMachineForm.name || ''} onChange={e => setEditMachineForm({...editMachineForm, name: e.target.value})} className={inputClass} placeholder="Machine name" />
                </div>
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input value={editMachineForm.manufacturer || ''} onChange={e => setEditMachineForm({...editMachineForm, manufacturer: e.target.value})} className={inputClass} placeholder="e.g. Fanuc" />
                </div>
                <div>
                  <label className={labelClass}>Model</label>
                  <input value={editMachineForm.model || ''} onChange={e => setEditMachineForm({...editMachineForm, model: e.target.value})} className={inputClass} placeholder="e.g. CNC-200X" />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input value={editMachineForm.location || ''} onChange={e => setEditMachineForm({...editMachineForm, location: e.target.value})} className={inputClass} placeholder="e.g. Bay A" />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={editMachineForm.status || 'OPERATIONAL'} onChange={e => setEditMachineForm({...editMachineForm, status: e.target.value})} className={selectClass}>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="BREAKDOWN">Breakdown</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Criticality</label>
                  <select value={editMachineForm.criticality || 'MEDIUM'} onChange={e => setEditMachineForm({...editMachineForm, criticality: e.target.value})} className={selectClass}>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={editMachineForm.category || 'OTHER'} onChange={e => setEditMachineForm({...editMachineForm, category: e.target.value})} className={selectClass}>
                    {['CNC','HYDRAULIC','PNEUMATIC','ELECTRICAL','CONVEYOR','PUMP','COMPRESSOR','ROBOT','HVAC','OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Notes</label>
                  <textarea value={editMachineForm.notes || ''} onChange={e => setEditMachineForm({...editMachineForm, notes: e.target.value})} rows={2} className={inputClass} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingMachine(null)} className="flex-1 px-4 py-2 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc]">Cancel</button>
                <button onClick={saveEditMachine} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Order Modal */}
      {editingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingWo(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e6ebf1]">
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Work Order</h3>
              <button onClick={() => setEditingWo(null)} className="text-[#8898aa] hover:text-[#0a2540]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {saveError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Title</label>
                  <input value={editWoForm.title || ''} onChange={e => setEditWoForm({...editWoForm, title: e.target.value})} className={inputClass} placeholder="Work order title" />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={editWoForm.status || 'OPEN'} onChange={e => setEditWoForm({...editWoForm, status: e.target.value})} className={selectClass}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select value={editWoForm.priority || 'MEDIUM'} onChange={e => setEditWoForm({...editWoForm, priority: e.target.value})} className={selectClass}>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={editWoForm.type || 'PREVENTIVE'} onChange={e => setEditWoForm({...editWoForm, type: e.target.value})} className={selectClass}>
                    {['PREVENTIVE','CORRECTIVE','EMERGENCY','INSPECTION','PROJECT'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input type="datetime-local" value={editWoForm.dueAt || ''} onChange={e => setEditWoForm({...editWoForm, dueAt: e.target.value})} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Assign To</label>
                  <select value={editWoForm.assignedToId || ''} onChange={e => setEditWoForm({...editWoForm, assignedToId: e.target.value})} className={selectClass}>
                    <option value="">-- Unassigned --</option>
                    {orgUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea value={editWoForm.description || ''} onChange={e => setEditWoForm({...editWoForm, description: e.target.value})} rows={3} className={inputClass} placeholder="Work order description..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingWo(null)} className="flex-1 px-4 py-2 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc]">Cancel</button>
                <button onClick={saveEditWo} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Machine */}
      {confirmDeleteMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteMachine(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Delete Machine?</h3>
              <p className="text-sm text-[#425466] mb-6">Delete <strong>{confirmDeleteMachine.name}</strong>? This removes all associated work orders and tasks.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteMachine(null)} className="flex-1 px-4 py-2 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc]">Cancel</button>
                <button onClick={() => deleteMachine(confirmDeleteMachine.id)} disabled={!!deletingMachineId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  {deletingMachineId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Work Order */}
      {confirmDeleteWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteWo(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Delete Work Order?</h3>
              <p className="text-sm text-[#425466] mb-6">Delete <strong>{confirmDeleteWo.title}</strong>? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteWo(null)} className="flex-1 px-4 py-2 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc]">Cancel</button>
                <button onClick={() => deleteWo(confirmDeleteWo.id)} disabled={!!deletingWoId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  {deletingWoId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}"""

if end_marker in content:
    content = content.replace(end_marker, new_ending)
    print('Step 10 (modals): SUCCESS')
else:
    print('Step 10 (modals): NOT FOUND')
    idx = content.find('<MachineDetailModal />')
    print(repr(content[max(0,idx-100):idx+100]))

with open('app/dashboard/DashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('All done - lines:', content.count('\n'))