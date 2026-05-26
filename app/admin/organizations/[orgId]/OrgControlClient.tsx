'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────────────── */
interface OrgData {
  id: string; name: string; slug: string; industry: string; size: string;
  plan: string; trialEndsAt: string | null;
  stripeCustomerId: string | null; stripeSubscriptionId: string | null;
  subscriptionStatus: string | null; currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean; isActive: boolean; isSuspended: boolean;
  adminNotes: string | null; suspendedReason: string | null; suspendedAt: string | null;
  createdAt: string;
  counts: {
    users: number;
    machines: number;
    workOrders: number;
    alerts: number;
    parts: number;
    sites?: number;
    buildings?: number;
    floors?: number;
    rooms?: number;
    machineDocuments?: number;
    approvalPolicies?: number;
    approvalRequests?: number;
    savedReports?: number;
  };
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string; lastLoginAt: string | null; twoFactorEnabled: boolean; failedLoginAttempts: number; deletionRequestedAt?: string | null }>;
  machines: Array<{ id: string; name: string; status: string; category: string; location: string | null; createdAt: string }>;
  workOrders: Array<{ id: string; woNumber: string; title: string; status: string; priority: string; createdAt: string; completedAt: string | null }>;
  alerts: Array<{ id: string; type: string; title: string; severity: string; isResolved: boolean; createdAt: string }>;
  integrations: Array<{ id: string; type: string; name: string; status: string; createdAt: string }>;
  webhooks: Array<{ id: string; name: string; url: string; isActive: boolean; failureCount: number; lastTriggeredAt: string | null }>;
  ssoConfig: {
    enabled: boolean;
    enforced: boolean;
    idpEntityId: string;
    idpSsoUrl: string;
    defaultRole: string;
    updatedAt: string;
  } | null;
  scimTokens: Array<{ id: string; label: string; prefix: string; lastUsedAt: string | null; createdAt: string }>;
  // Big Bet #3 — Fleet tab payload
  fleetMachines: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    location: string | null;
    createdAt: string;
    workOrderCount: number;
    alertCount: number;
    gatewayTokenCount: number;
    lastReading: { type: string; value: number; unit: string; recordedAt: string } | null;
  }>;
  gatewayTokens: Array<{
    id: string;
    name: string;
    tokenPrefix: string;
    isActive: boolean;
    lastSeenAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    machineId: string;
    machineName: string | null;
    machineCategory: string | null;
    machineStatus: string | null;
  }>;
  ai: {
    settings: {
      enabled: boolean;
      model: string;
      sensitivity: number;
      minAlertSeverity: string;
      forecastHorizonDays: number;
      autoCreateWorkOrders: boolean;
      updatedAt: string;
    } | null;
    detections: Array<{
      id: string;
      sensorType: string;
      value: number;
      unit: string | null;
      severity: string;
      message: string;
      recommendation: string | null;
      feedback: string;
      modelUsed: string;
      detectedAt: string;
      machineId: string | null;
      machineName: string | null;
    }>;
    forecasts: Array<{
      id: string;
      sensorType: string;
      predictedFailureAt: string | null;
      confidence: number;
      recommendation: string;
      horizonDays: number;
      generatedAt: string;
      machineId: string | null;
      machineName: string | null;
    }>;
    totals: { confirmed: number; rejected: number; pending: number };
  };
}

interface AuditEntry { id: string; action: string; entity: string; entityId: string | null; changes: string | null; createdAt: string; userName: string | null; }

interface Props { org: OrgData; auditLogs: AuditEntry[]; }

/* ─── Constants ─────────────────────────────────────────────────── */
const PLANS = ['TRIAL','STARTER','GROWTH','PROFESSIONAL','ENTERPRISE'];
const PLAN_COLORS: Record<string,string> = { TRIAL:'#f59e0b', STARTER:'#6366f1', GROWTH:'#10b981', PROFESSIONAL:'#8b5cf6', ENTERPRISE:'#ec4899' };
const ROLES = ['OWNER','ADMIN','TECHNICIAN','OPERATOR','EMPLOYEE','MEMBER'];
const ROLE_COLORS: Record<string,string> = { OWNER:'#8b5cf6', ADMIN:'#6366f1', TECHNICIAN:'#10b981', OPERATOR:'#f97316', EMPLOYEE:'#06b6d4', MEMBER:'#6b7280' };
const STATUS_COLORS: Record<string,string> = { OPERATIONAL:'#10b981', MAINTENANCE:'#f59e0b', BREAKDOWN:'#ef4444', RETIRED:'#6b7280' };
const WO_STATUS_COLORS: Record<string,string> = { OPEN:'#6366f1', IN_PROGRESS:'#f59e0b', ON_HOLD:'#6b7280', COMPLETED:'#10b981', CANCELLED:'#ef4444' };
const SEVERITY_COLORS: Record<string,string> = { CRITICAL:'#ef4444', HIGH:'#f97316', MEDIUM:'#f59e0b', LOW:'#10b981' };
const TABS = ['overview','users','machines','fleet','work-orders','alerts','operations','ai','billing','integrations','identity','activity'] as const;
type Tab = typeof TABS[number];

/* ─── Small helpers ─────────────────────────────────────────────── */
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, color, background:color+'20', display:'inline-flex', alignItems:'center' }}>
      {label}
    </span>
  );
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v:boolean)=>void }) {
  return (
    <button onClick={()=>onChange(!checked)} style={{ width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',background:checked?'#10b981':'var(--bg-surface-2)',position:'relative',transition:'background 0.2s',flexShrink:0 }}>
      <span style={{ position:'absolute',top:2,left:checked?21:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US',{dateStyle:'short',timeStyle:'short'});
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function OrgControlClient({ org, auditLogs }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [toast, setToast] = useState<{type:'success'|'error';text:string}|null>(null);
  const [saving, setSaving] = useState(false);

  // Overview edit state
  const [editName, setEditName] = useState(org.name);
  const [editSlug, setEditSlug] = useState(org.slug);
  const [editIndustry, setEditIndustry] = useState(org.industry);
  const [editSize, setEditSize] = useState(org.size);
  const [editNotes, setEditNotes] = useState(org.adminNotes ?? '');
  const [editPlan, setEditPlan] = useState(org.plan);

  // Suspend state
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  const showToast = (type:'success'|'error', text:string) => {
    setToast({type,text});
    setTimeout(()=>setToast(null), 5000);
  };

  /* ─── API Helpers ─────────────────────────────────────── */
  const patchOrg = async (body: Record<string, any>, successMsg: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('success', successMsg);
      router.refresh();
    } catch (e:any) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  const patchUser = async (userId: string, body: Record<string, any>, successMsg: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('success', successMsg);
      router.refresh();
    } catch (e:any) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this organization? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('success', `${name} removed`);
      router.refresh();
    } catch (e:any) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  const suspendOrg = async () => {
    await patchOrg({ isSuspended: true, suspendedReason: suspendReason || 'Suspended by admin' }, 'Organization suspended');
    setShowSuspendForm(false);
    setSuspendReason('');
  };

  const unsuspendOrg = () => patchOrg({ isSuspended: false, suspendedReason: null, suspendedAt: null }, 'Organization reactivated');

  const saveOrgInfo = () => patchOrg({ name: editName, slug: editSlug, industry: editIndustry, size: editSize, adminNotes: editNotes, plan: editPlan }, 'Organization updated');

  const deleteOrg = async () => {
    if (!confirm(`PERMANENTLY DELETE "${org.name}"?\n\nThis will delete ALL data including users, machines, and work orders. This CANNOT be undone.\n\nType the org name to confirm.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/admin/organizations');
    } catch (e:any) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  /* ─── Render ─────────────────────────────────────────── */
  const tabIcons: Record<Tab, string> = {
    overview: '📊', users: '👥', machines: '⚙️', fleet: '🚛', 'work-orders': '📋',
    alerts: '🔔', operations: '🛠️', ai: '🤖', billing: '💳', integrations: '🔌', identity: '🔐', activity: '📋',
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1400px] mx-auto min-w-0">
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',top:20,right:20,zIndex:9999,padding:'12px 20px',borderRadius:8,fontWeight:600,fontSize:14,
          background:toast.type==='success'?'#10b981':'#ef4444',color:'#fff',boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.type==='success'?'✓ ':'✗ '}{toast.text}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:20,fontSize:13 }}>
        <Link href="/admin/organizations" style={{ color:'var(--accent)',textDecoration:'none' }}>← Organizations</Link>
        <span style={{ color:'var(--text-secondary)' }}>/</span>
        <span style={{ color:'var(--text-primary)',fontWeight:600 }}>{org.name}</span>
      </div>

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:16,flexWrap:'wrap' }}>
        <div style={{minWidth:0}}>
          <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
            <h1 style={{ fontSize:20,fontWeight:700,color:'var(--text-primary)',margin:0 }} className="sm:text-2xl">{org.name}</h1>
            <Badge label={org.plan} color={PLAN_COLORS[org.plan]} />
            {org.isSuspended && <Badge label="SUSPENDED" color="#ef4444" />}
            {!org.isSuspended && org.subscriptionStatus && <Badge label={org.subscriptionStatus} color="#10b981" />}
          </div>
          <p style={{ fontSize:13,color:'var(--text-secondary)',marginTop:4 }}>/{org.slug} · Created {fmtDate(org.createdAt)}</p>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          {org.isSuspended ? (
            <button onClick={unsuspendOrg} disabled={saving} style={{ padding:'8px 18px',borderRadius:8,border:'none',background:'#10b981',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer' }}>
              ✓ Reactivate Org
            </button>
          ) : (
            <button onClick={()=>setShowSuspendForm(true)} disabled={saving} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontWeight:700,fontSize:13,cursor:'pointer' }}>
              🚫 Suspend Org
            </button>
          )}
          <button onClick={deleteOrg} disabled={saving} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid rgba(239,68,68,0.5)',background:'rgba(239,68,68,0.15)',color:'#ef4444',fontWeight:700,fontSize:13,cursor:'pointer' }}>
            🗑 Delete Org
          </button>
        </div>
      </div>

      {/* Suspend form */}
      {showSuspendForm && (
        <div style={{ marginBottom:20,padding:16,borderRadius:10,background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.3)' }}>
          <p style={{ fontWeight:700,color:'#ef4444',margin:'0 0 10px',fontSize:14 }}>Suspend "{org.name}"?</p>
          <input value={suspendReason} onChange={e=>setSuspendReason(e.target.value)} placeholder="Reason for suspension (optional)"
            style={{ width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg-surface)',color:'var(--text-primary)',fontSize:13,outline:'none',marginBottom:10,boxSizing:'border-box' }} />
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
            <button onClick={suspendOrg} style={{ padding:'7px 18px',borderRadius:7,border:'none',background:'#ef4444',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer' }}>Confirm Suspend</button>
            <button onClick={()=>setShowSuspendForm(false)} style={{ padding:'7px 18px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg-surface)',color:'var(--text-primary)',fontWeight:600,fontSize:13,cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* KPI strip — responsive: 2 cols on mobile, 3 on sm, 5 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[
          { label:'Users',       val:org.counts.users,      icon:'👥', color:'#6366f1' },
          { label:'Machines',    val:org.counts.machines,   icon:'⚙️', color:'#10b981' },
          { label:'Work Orders', val:org.counts.workOrders, icon:'📋', color:'#f59e0b' },
          { label:'Alerts',      val:org.counts.alerts,     icon:'🔔', color:'#ef4444' },
          { label:'Parts',       val:org.counts.parts,      icon:'🔩', color:'#8b5cf6' },
        ].map(k=>(
          <div key={k.label} style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px' }}>
            <div style={{ fontSize:18,marginBottom:2 }}>{k.icon}</div>
            <div style={{ fontSize:20,fontWeight:700,color:k.color }} className="sm:text-2xl">{k.val}</div>
            <div style={{ fontSize:11,color:'var(--text-secondary)',marginTop:2 }} className="sm:text-xs">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-0.5 mb-6 border-b overflow-x-auto flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" style={{ borderColor:'var(--border)' }}>
        {TABS.map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{
            padding:'8px 12px',fontSize:13,fontWeight:600,border:'none',background:'transparent',cursor:'pointer',whiteSpace:'nowrap',
            color:activeTab===tab?'var(--accent)':'var(--text-secondary)',
            borderBottom:activeTab===tab?'2px solid var(--accent)':'2px solid transparent',
            marginBottom:-1,textTransform:'capitalize',flexShrink:0,
          }}>
            {tabIcons[tab]} {tab.replace('-',' ')}
          </button>
        ))}
      </div>

      {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
      {activeTab==='overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Edit org info */}
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 16px' }}>✏️ Edit Organization Info</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {[
                { label:'Name', val:editName, set:setEditName },
                { label:'Slug', val:editSlug, set:setEditSlug },
              ].map(f=>(
                <div key={f.label}>
                  <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>{f.label}</label>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} style={{ width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg-surface-2)',color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>Industry</label>
                <select value={editIndustry} onChange={e=>setEditIndustry(e.target.value)} style={{ width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg-surface-2)',color:'var(--text-primary)',fontSize:13,outline:'none' }}>
                  {['METAL_FABRICATION','PLASTICS','FOOD_BEVERAGE','AUTO_PARTS','ELECTRONICS','WOODWORKING','OTHER'].map(v=>(
                    <option key={v} value={v}>{v.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>Size</label>
                <select value={editSize} onChange={e=>setEditSize(e.target.value)} style={{ width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg-surface-2)',color:'var(--text-primary)',fontSize:13,outline:'none' }}>
                  {['SMALL','GROWING','MIDSIZE','LARGE'].map(v=>(
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>Plan Override</label>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                  {PLANS.map(p=>(
                    <button key={p} onClick={()=>setEditPlan(p)} style={{
                      padding:'4px 12px',borderRadius:8,border:`2px solid ${editPlan===p?PLAN_COLORS[p]:'var(--border)'}`,
                      background:editPlan===p?PLAN_COLORS[p]+'20':'transparent',
                      color:editPlan===p?PLAN_COLORS[p]:'var(--text-secondary)',fontWeight:700,fontSize:12,cursor:'pointer',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>Admin Notes (internal)</label>
                <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={3} style={{ width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg-surface-2)',color:'var(--text-primary)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box' }} />
              </div>
              <button onClick={saveOrgInfo} disabled={saving} style={{ padding:'10px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer' }}>
                {saving?'Saving…':'💾 Save Changes'}
              </button>
            </div>
          </div>

          {/* Org details */}
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 14px' }}>📋 Details</h2>
              {[
                ['ID',          org.id],
                ['Created',     fmtDate(org.createdAt)],
                ['Plan',        org.plan],
                ['Sub Status',  org.subscriptionStatus ?? '—'],
                ['Period End',  fmtDate(org.currentPeriodEnd)],
                ['Trial Ends',  fmtDate(org.trialEndsAt)],
                ['Stripe Cust', org.stripeCustomerId ? org.stripeCustomerId.slice(0,24)+'…' : '—'],
                ['Stripe Sub',  org.stripeSubscriptionId ? org.stripeSubscriptionId.slice(0,24)+'…' : '—'],
                ['Suspended',   org.isSuspended ? `Yes — ${fmtDate(org.suspendedAt)}` : 'No'],
                ['Susp Reason', org.suspendedReason ?? '—'],
                ['Admin Notes', org.adminNotes ?? '—'],
              ].map(([k,v])=>(
                <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)',fontWeight:500 }}>{k}</span>
                  <span style={{ color:'var(--text-primary)',fontWeight:600,textAlign:'right',wordBreak:'break-all' }} className="max-w-[180px] sm:max-w-[220px]">{v as string}</span>
                </div>
              ))}
            </div>

            {org.stripeCustomerId && (
              <a href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`} target="_blank" rel="noreferrer"
                style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'10px 18px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg-surface)',color:'var(--text-primary)',textDecoration:'none',fontSize:13,fontWeight:600 }}>
                🔗 View in Stripe Dashboard
              </a>
            )}

            <Link href={`/admin/billing/${org.id}`}
              style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'10px 18px',borderRadius:8,background:'var(--accent)',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700 }}>
              💳 Full Billing Control →
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════ USERS TAB ═══════════════ */}
      {activeTab==='users' && (
        <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>👥 All Members ({org.counts.users})</h2>
            <span style={{ fontSize:12,color:'var(--text-secondary)' }}>Admin can change roles and remove members</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-surface-2)' }}>
                  {['User','Email','Role','2FA','Failed Logins','Joined','Last Login','Actions'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {org.users.map((u,i)=>(
                  <tr key={u.id} style={{ borderBottom:i<org.users.length-1?'1px solid var(--border)':'none', background: u.deletionRequestedAt ? 'rgba(245,158,11,0.04)' : undefined }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ width:30,height:30,borderRadius:'50%',background:ROLE_COLORS[u.role]+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:ROLE_COLORS[u.role],flexShrink:0 }}>
                          {u.name.charAt(0)}
                        </div>
                        <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
                          <span style={{ fontSize:13,fontWeight:600,color: u.deletionRequestedAt ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: u.deletionRequestedAt ? 'line-through' : 'none' }}>{u.name}</span>
                          {u.deletionRequestedAt && (
                            <span style={{ fontSize:10,fontWeight:700,color:'#f59e0b',textTransform:'uppercase',letterSpacing:'0.05em' }}>
                              ⚠ Pending deletion
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <select value={u.role} onChange={e=>patchUser(u.id,{role:e.target.value},`${u.name}'s role changed to ${e.target.value}`)}
                        style={{ padding:'3px 8px',borderRadius:6,border:`1px solid ${ROLE_COLORS[u.role]}40`,background:ROLE_COLORS[u.role]+'15',color:ROLE_COLORS[u.role],fontSize:11,fontWeight:700,cursor:'pointer',outline:'none' }}>
                        {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:12,fontWeight:600,color:u.twoFactorEnabled?'#10b981':'#6b7280' }}>
                        {u.twoFactorEnabled?'✓ On':'✗ Off'}
                      </span>
                    </td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:u.failedLoginAttempts>3?'#ef4444':'var(--text-secondary)',fontWeight:u.failedLoginAttempts>3?700:400,textAlign:'center' }}>
                      {u.failedLoginAttempts}
                    </td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDateTime(u.lastLoginAt)}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex',gap:6 }}>
                        <button onClick={()=>patchUser(u.id,{failedLoginAttempts:0},`${u.name}'s login attempts reset`)}
                          title="Reset failed logins"
                          style={{ padding:'4px 8px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg-surface-2)',color:'var(--text-secondary)',fontSize:11,cursor:'pointer' }}>
                          🔄
                        </button>
                        <button onClick={()=>deleteUser(u.id,u.name)}
                          style={{ padding:'4px 8px',borderRadius:5,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontSize:11,cursor:'pointer' }}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ MACHINES TAB ═══════════════ */}
      {activeTab==='machines' && (
        <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>⚙️ Machines ({org.counts.machines})</h2>
          </div>
          {/* Fleet rollup — Big Bet #3 multi-domain */}
          {(() => {
            const counts = {
              industrial: 0, vehicleLight: 0, vehicleHeavy: 0, vessel: 0, drone: 0, forklift: 0, other: 0,
            };
            for (const m of org.machines) {
              if (m.category === 'VEHICLE_LIGHT') counts.vehicleLight++;
              else if (m.category === 'VEHICLE_HEAVY') counts.vehicleHeavy++;
              else if (m.category === 'VESSEL') counts.vessel++;
              else if (m.category === 'DRONE_UAV') counts.drone++;
              else if (m.category === 'FORKLIFT') counts.forklift++;
              else if (m.category === 'OTHER') counts.other++;
              else counts.industrial++;
            }
            const cells: Array<[string,number,string]> = [
              ['🏭 Industrial', counts.industrial, '#635bff'],
              ['🚜 Forklift / AGV', counts.forklift, '#0d9488'],
              ['🚗 Light vehicles', counts.vehicleLight, '#0ea5e9'],
              ['🚛 Heavy trucks', counts.vehicleHeavy, '#f97316'],
              ['⛵ Vessels', counts.vessel, '#0284c7'],
              ['🛸 Drones / UAVs', counts.drone, '#a855f7'],
              ['🔩 Other', counts.other, '#6b7280'],
            ];
            return (
              <div style={{ padding:'12px 20px',borderBottom:'1px solid var(--border)',background:'var(--bg-surface-2)' }}>
                <div style={{ fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8 }}>Fleet rollup by category</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                  {cells.map(([label,n,c]) => (
                    <div key={label} style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:'var(--bg-surface)',border:`1px solid ${c}40`,borderRadius:999,fontSize:12 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight:700,color:c }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-surface-2)' }}>
                {['Name','Category','Status','Location','Added'].map(h=>(
                  <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {org.machines.map((m,i)=>(
                <tr key={m.id} style={{ borderBottom:i<org.machines.length-1?'1px solid var(--border)':'none' }}>
                  <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{m.name}</td>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)' }}>{m.category.replace(/_/g,' ')}</td>
                  <td style={{ padding:'11px 14px' }}><Badge label={m.status} color={STATUS_COLORS[m.status]??'#6b7280'} /></td>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)' }}>{m.location??'—'}</td>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(m.createdAt)}</td>
                </tr>
              ))}
              {org.machines.length===0 && <tr><td colSpan={5} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>No machines</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ═══════════════ FLEET TAB (Big Bet #3 multi-domain) ═══════════════ */}
      {activeTab==='fleet' && (() => {
        const FLEET_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
          VEHICLE_LIGHT: { label: 'Light vehicles (cars / vans / light trucks)', emoji: '🚗', color: '#0ea5e9' },
          VEHICLE_HEAVY: { label: 'Heavy trucks / buses / off-highway', emoji: '🚛', color: '#f97316' },
          VESSEL: { label: 'Vessels / boats / yachts', emoji: '⛵', color: '#0284c7' },
          DRONE_UAV: { label: 'Drones / UAVs', emoji: '🛸', color: '#a855f7' },
          FORKLIFT: { label: 'Forklifts / AGVs', emoji: '🚜', color: '#0d9488' },
        };
        const fleetTotal = org.fleetMachines.length;
        const grouped = org.fleetMachines.reduce<Record<string, typeof org.fleetMachines>>((acc, m) => {
          (acc[m.category] ||= []).push(m);
          return acc;
        }, {});
        const tokensByMachine = org.gatewayTokens.reduce<Record<string, typeof org.gatewayTokens>>((acc, t) => {
          (acc[t.machineId] ||= []).push(t);
          return acc;
        }, {});
        const fleetTokens = org.gatewayTokens.filter(t => t.machineCategory && Object.keys(FLEET_LABELS).includes(t.machineCategory));
        const activeFleetTokens = fleetTokens.filter(t => t.isActive && !t.revokedAt);
        const recentlySeenTokens = activeFleetTokens.filter(t => t.lastSeenAt && (Date.now() - new Date(t.lastSeenAt).getTime()) < 1000 * 60 * 60 * 24);
        return (
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

            {/* Header summary */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
                <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>🚛 Fleet — vehicles, vessels & UAVs</h2>
                <div style={{ display:'flex',gap:8,fontSize:12 }}>
                  <span style={{ padding:'4px 10px',background:'#635bff10',border:'1px solid #635bff40',borderRadius:999,color:'#635bff',fontWeight:600 }}>{fleetTotal} fleet assets</span>
                  <span style={{ padding:'4px 10px',background:'#10b98110',border:'1px solid #10b98140',borderRadius:999,color:'#10b981',fontWeight:600 }}>{activeFleetTokens.length} active gateway tokens</span>
                  <span style={{ padding:'4px 10px',background:'#f9731610',border:'1px solid #f9731640',borderRadius:999,color:'#f97316',fontWeight:600 }}>{recentlySeenTokens.length} streaming today</span>
                </div>
              </div>
              <p style={{ margin:'8px 0 0',fontSize:12,color:'var(--text-secondary)',lineHeight:1.5 }}>
                Big Bet #3 multi-domain expansion — OBD-II, SAE J1939, NMEA 2000, MAVLink connectors plus native importers for Geotab, Samsara, Verizon Connect, Motive, and Fleetio. Read-only on this dashboard; the customer admin manages telemetry from Equipment / Edge Gateway.
              </p>
            </div>

            {/* Category breakdown */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px' }}>
              <h3 style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)',margin:'0 0 12px',textTransform:'uppercase',letterSpacing:'0.05em' }}>By category</h3>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:10 }}>
                {Object.entries(FLEET_LABELS).map(([cat, def]) => {
                  const list = grouped[cat] ?? [];
                  return (
                    <div key={cat} style={{ background:'var(--bg-surface-2)',border:`1px solid ${def.color}40`,borderRadius:10,padding:'12px 14px' }}>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
                        <span style={{ fontSize:18 }}>{def.emoji}</span>
                        <span style={{ fontSize:22,fontWeight:700,color:def.color }}>{list.length}</span>
                      </div>
                      <div style={{ fontSize:12,fontWeight:600,color:'var(--text-primary)' }}>{def.label}</div>
                      <div style={{ fontSize:11,color:'var(--text-secondary)',marginTop:4 }}>
                        {list.reduce((s, m) => s + m.gatewayTokenCount, 0)} gateway token{list.reduce((s, m) => s + m.gatewayTokenCount, 0) === 1 ? '' : 's'}
                        {' · '}
                        {list.reduce((s, m) => s + m.alertCount, 0)} active alert{list.reduce((s, m) => s + m.alertCount, 0) === 1 ? '' : 's'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fleet asset list */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
              <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8 }}>
                <h3 style={{ fontSize:14,fontWeight:700,color:'var(--text-primary)',margin:0 }}>Fleet assets ({fleetTotal})</h3>
                <Link href={`/admin/machines?orgId=${org.id}`} style={{ fontSize:12,fontWeight:600,color:'#635bff',textDecoration:'none' }}>Manage in Admin Machines →</Link>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-surface-2)' }}>
                      {['Asset','Category','Status','Tokens','Last reading','WO','Alerts'].map(h => (
                        <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {org.fleetMachines.map((m, i) => {
                      const def = FLEET_LABELS[m.category];
                      return (
                        <tr key={m.id} style={{ borderBottom:i < org.fleetMachines.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>
                            {m.name}
                            {m.location && <div style={{ fontSize:11,fontWeight:400,color:'var(--text-secondary)',marginTop:2 }}>{m.location}</div>}
                          </td>
                          <td style={{ padding:'11px 14px',fontSize:12 }}>
                            <span style={{ padding:'2px 8px',background:`${def?.color ?? '#6b7280'}15`,color:def?.color ?? '#6b7280',borderRadius:999,fontWeight:600 }}>
                              {def?.emoji ?? ''} {def?.label.split(' ')[0] ?? m.category}
                            </span>
                          </td>
                          <td style={{ padding:'11px 14px' }}><Badge label={m.status} color={STATUS_COLORS[m.status] ?? '#6b7280'} /></td>
                          <td style={{ padding:'11px 14px',fontSize:12,color:m.gatewayTokenCount > 0 ? '#10b981' : 'var(--text-secondary)',fontWeight:m.gatewayTokenCount > 0 ? 600 : 400 }}>
                            {m.gatewayTokenCount}
                          </td>
                          <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)' }}>
                            {m.lastReading ? (
                              <span title={`${m.lastReading.value} ${m.lastReading.unit} at ${fmtDateTime(m.lastReading.recordedAt)}`}>
                                {m.lastReading.type} = {m.lastReading.value.toFixed(1)} {m.lastReading.unit}
                                <div style={{ fontSize:10,color:'var(--text-secondary)',marginTop:2 }}>{fmtDate(m.lastReading.recordedAt)}</div>
                              </span>
                            ) : <span style={{ color:'var(--text-secondary)',fontStyle:'italic' }}>no telemetry yet</span>}
                          </td>
                          <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)' }}>{m.workOrderCount}</td>
                          <td style={{ padding:'11px 14px',fontSize:12,color:m.alertCount > 0 ? '#ef4444' : 'var(--text-secondary)',fontWeight:m.alertCount > 0 ? 600 : 400 }}>{m.alertCount}</td>
                        </tr>
                      );
                    })}
                    {org.fleetMachines.length === 0 && (
                      <tr><td colSpan={7} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>
                        This workspace has no fleet assets yet. The customer can add vehicles, vessels, or drones from <Link href="/dashboard" style={{ color:'#635bff',textDecoration:'underline' }}>Equipment → + Add Machine</Link> using the new categories.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gateway tokens table — vehicle/vessel/UAV only */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
              <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)' }}>
                <h3 style={{ fontSize:14,fontWeight:700,color:'var(--text-primary)',margin:0 }}>Telematics gateway tokens ({fleetTokens.length})</h3>
                <p style={{ fontSize:11,color:'var(--text-secondary)',margin:'4px 0 0' }}>
                  Each fleet asset that streams telemetry — via the Edge Gateway connectors (OBD-II / J1939 / NMEA 2000 / MAVLink) or via the native telematics importers (/api/telematics/import?provider=…) — has at least one Machine Gateway Token. SHA-256 hashed on the server; only the prefix is shown here.
                </p>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-surface-2)' }}>
                      {['Asset','Token name','Prefix','Status','Last seen','Created'].map(h => (
                        <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fleetTokens.map((t, i) => {
                      const isStale = t.lastSeenAt ? (Date.now() - new Date(t.lastSeenAt).getTime()) > 1000 * 60 * 60 * 24 : true;
                      const def = t.machineCategory ? FLEET_LABELS[t.machineCategory] : null;
                      return (
                        <tr key={t.id} style={{ borderBottom:i < fleetTokens.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>
                            {def?.emoji} {t.machineName ?? '—'}
                          </td>
                          <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)' }}>{t.name}</td>
                          <td style={{ padding:'11px 14px',fontSize:12,fontFamily:'monospace',color:'var(--text-secondary)' }}>{t.tokenPrefix}…</td>
                          <td style={{ padding:'11px 14px' }}>
                            {t.revokedAt ? <Badge label="Revoked" color="#6b7280" /> :
                              t.isActive ? <Badge label="Active" color="#10b981" /> :
                              <Badge label="Inactive" color="#f59e0b" />}
                          </td>
                          <td style={{ padding:'11px 14px',fontSize:12,color:isStale && t.lastSeenAt ? '#f97316' : 'var(--text-secondary)' }}>
                            {t.lastSeenAt ? fmtDateTime(t.lastSeenAt) : <span style={{ fontStyle:'italic' }}>never</span>}
                          </td>
                          <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(t.createdAt)}</td>
                        </tr>
                      );
                    })}
                    {fleetTokens.length === 0 && (
                      <tr><td colSpan={6} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>
                        No fleet gateway tokens yet. The customer creates these from each vehicle/vessel/UAV machine&apos;s detail page → Create Gateway Token, then pastes the token into the Edge Gateway YAML or the telematics provider&apos;s webhook config.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Documentation links */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px' }}>
              <h3 style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)',margin:'0 0 12px',textTransform:'uppercase',letterSpacing:'0.05em' }}>Customer docs (for reference)</h3>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:10,fontSize:13 }}>
                {[
                  ['🚗 OBD-II setup', '/docs/edge-gateway/obd2'],
                  ['🚛 SAE J1939 setup', '/docs/edge-gateway/j1939'],
                  ['⛵ NMEA 2000 setup', '/docs/edge-gateway/nmea2000'],
                  ['🛸 MAVLink setup', '/docs/edge-gateway/mavlink'],
                  ['🌐 Telematics importers', '/docs/telematics'],
                  ['📋 Vehicle WO templates', '/docs/vehicle-templates'],
                  ['📖 Fleet handbook chapter', '/handbook/vehicles-vessels-uavs'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} target="_blank" style={{ padding:'10px 12px',background:'var(--bg-surface-2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',textDecoration:'none',fontWeight:500,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
                    <span>{label}</span>
                    <span style={{ color:'#635bff',fontSize:12 }}>↗</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        );
      })()}

      {/* ═══════════════ WORK ORDERS TAB ═══════════════ */}
      {activeTab==='work-orders' && (
        <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>📋 Work Orders ({org.counts.workOrders}) — recent 20</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-surface-2)' }}>
                {['WO #','Title','Status','Priority','Created','Completed'].map(h=>(
                  <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {org.workOrders.map((w,i)=>(
                <tr key={w.id} style={{ borderBottom:i<org.workOrders.length-1?'1px solid var(--border)':'none' }}>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--accent)',fontWeight:700 }}>{w.woNumber}</td>
                  <td style={{ padding:'11px 14px',fontSize:13,color:'var(--text-primary)',maxWidth:240 }}>{w.title}</td>
                  <td style={{ padding:'11px 14px' }}><Badge label={w.status.replace('_',' ')} color={WO_STATUS_COLORS[w.status]??'#6b7280'} /></td>
                  <td style={{ padding:'11px 14px' }}><Badge label={w.priority} color={SEVERITY_COLORS[w.priority]??'#6b7280'} /></td>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(w.createdAt)}</td>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(w.completedAt)}</td>
                </tr>
              ))}
              {org.workOrders.length===0 && <tr><td colSpan={6} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>No work orders</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ═══════════════ ALERTS TAB ═══════════════ */}
      {activeTab==='alerts' && (
        <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>🔔 Alerts ({org.counts.alerts}) — recent 20</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-surface-2)' }}>
                {['Title','Type','Severity','Resolved','Created'].map(h=>(
                  <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {org.alerts.map((a,i)=>(
                <tr key={a.id} style={{ borderBottom:i<org.alerts.length-1?'1px solid var(--border)':'none' }}>
                  <td style={{ padding:'11px 14px',fontSize:13,color:'var(--text-primary)',fontWeight:600 }}>{a.title}</td>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)' }}>{a.type.replace(/_/g,' ')}</td>
                  <td style={{ padding:'11px 14px' }}><Badge label={a.severity} color={SEVERITY_COLORS[a.severity]??'#6b7280'} /></td>
                  <td style={{ padding:'11px 14px' }}><span style={{ fontSize:12,fontWeight:600,color:a.isResolved?'#10b981':'#ef4444' }}>{a.isResolved?'✓ Yes':'✗ No'}</span></td>
                  <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(a.createdAt)}</td>
                </tr>
              ))}
              {org.alerts.length===0 && <tr><td colSpan={5} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>No alerts</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ═══════════════ OPERATIONS TAB ═══════════════ */}
      {activeTab==='operations' && (
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 14px' }}>📍 Locations Hierarchy</h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12 }}>
              {[
                ['Sites',     org.counts.sites ?? 0,     '🏭'],
                ['Buildings', org.counts.buildings ?? 0, '🏢'],
                ['Floors',    org.counts.floors ?? 0,    '🪜'],
                ['Rooms',     org.counts.rooms ?? 0,     '🚪'],
              ].map(([label,val,emoji])=>(
                <div key={label as string} style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px' }}>
                  <div style={{ fontSize:11,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600 }}>{emoji as string} {label as string}</div>
                  <div style={{ fontSize:22,fontWeight:800,color:'var(--text-primary)',marginTop:4 }}>{val as number}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:12,color:'var(--text-secondary)',marginTop:12,marginBottom:0 }}>
              Org users manage these in <code>/settings/locations</code>. Site → Building → Floor → Room. SuperAdmin sees totals here; full editing happens inside the org.
            </p>
          </div>

          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 14px' }}>📑 Equipment Documents</h2>
            <div style={{ display:'flex',alignItems:'baseline',gap:14 }}>
              <div style={{ fontSize:32,fontWeight:800,color:'var(--text-primary)' }}>{org.counts.machineDocuments ?? 0}</div>
              <div style={{ fontSize:13,color:'var(--text-secondary)' }}>manuals, drawings, P&IDs, certificates uploaded across all machines</div>
            </div>
          </div>

          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 14px' }}>✅ Approval Workflows</h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12 }}>
              <div style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px' }}>
                <div style={{ fontSize:11,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600 }}>Policies defined</div>
                <div style={{ fontSize:22,fontWeight:800,color:'var(--text-primary)',marginTop:4 }}>{org.counts.approvalPolicies ?? 0}</div>
              </div>
              <div style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px' }}>
                <div style={{ fontSize:11,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600 }}>Total approval requests</div>
                <div style={{ fontSize:22,fontWeight:800,color:'var(--text-primary)',marginTop:4 }}>{org.counts.approvalRequests ?? 0}</div>
              </div>
            </div>
          </div>

          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 14px' }}>📊 Saved Reports</h2>
            <div style={{ display:'flex',alignItems:'baseline',gap:14 }}>
              <div style={{ fontSize:32,fontWeight:800,color:'var(--text-primary)' }}>{org.counts.savedReports ?? 0}</div>
              <div style={{ fontSize:13,color:'var(--text-secondary)' }}>saved &amp; scheduled report definitions</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ AI / PREDICTIVE TAB ═══════════════ */}
      {activeTab==='ai' && (() => {
        const ai = org.ai;
        const sev = ai.settings;
        const sevColors: Record<string, string> = {
          LOW: '#9ca3af', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#dc2626',
        };
        const fbColors: Record<string, string> = {
          PENDING: '#6366f1', CONFIRMED: '#10b981', REJECTED: '#9ca3af',
        };
        const masterEnabled = sev?.enabled ?? true;
        return (
          <div className="space-y-5">
            {/* Header summary */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 6px' }}>🤖 AI &amp; Predictive Maintenance</h2>
                  <p style={{ fontSize:13,color:'var(--text-secondary)',margin:0 }}>
                    SuperAdmin oversight of this org&rsquo;s anomaly detection &amp; forecasting. Read-only here — operators tune their own settings under <code>/settings/ai</code>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{
                    fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:999,
                    background: masterEnabled ? '#d1fae5' : '#f3f4f6',
                    color: masterEnabled ? '#065f46' : '#6b7280',
                  }}>
                    {masterEnabled ? '● ENABLED' : '○ DISABLED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div>
                  <div style={{ fontSize:10,textTransform:'uppercase',color:'var(--text-muted)',letterSpacing:'0.05em' }}>Model</div>
                  <div style={{ fontSize:14,fontWeight:700,color:'var(--text-primary)' }}>{sev?.model ?? 'STATISTICAL'}</div>
                </div>
                <div>
                  <div style={{ fontSize:10,textTransform:'uppercase',color:'var(--text-muted)',letterSpacing:'0.05em' }}>Sensitivity</div>
                  <div style={{ fontSize:14,fontWeight:700,color:'var(--text-primary)' }}>{sev?.sensitivity ?? 50}</div>
                </div>
                <div>
                  <div style={{ fontSize:10,textTransform:'uppercase',color:'var(--text-muted)',letterSpacing:'0.05em' }}>Min severity</div>
                  <div style={{ fontSize:14,fontWeight:700,color:sevColors[sev?.minAlertSeverity ?? 'LOW'] }}>{sev?.minAlertSeverity ?? 'LOW'}</div>
                </div>
                <div>
                  <div style={{ fontSize:10,textTransform:'uppercase',color:'var(--text-muted)',letterSpacing:'0.05em' }}>Forecast horizon</div>
                  <div style={{ fontSize:14,fontWeight:700,color:'var(--text-primary)' }}>{sev?.forecastHorizonDays ?? 30}d</div>
                </div>
              </div>
            </div>

            {/* Detection feedback rollup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:18 }}>
                <div style={{ fontSize:10,textTransform:'uppercase',color:'var(--text-muted)' }}>Pending review</div>
                <div style={{ fontSize:28,fontWeight:800,color:'#6366f1',marginTop:4 }}>{ai.totals.pending}</div>
                <div style={{ fontSize:11,color:'var(--text-secondary)' }}>operators haven&rsquo;t yet confirmed/rejected</div>
              </div>
              <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:18 }}>
                <div style={{ fontSize:10,textTransform:'uppercase',color:'var(--text-muted)' }}>Confirmed real</div>
                <div style={{ fontSize:28,fontWeight:800,color:'#10b981',marginTop:4 }}>{ai.totals.confirmed}</div>
                <div style={{ fontSize:11,color:'var(--text-secondary)' }}>operator marked as a true anomaly</div>
              </div>
              <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:18 }}>
                <div style={{ fontSize:10,textTransform:'uppercase',color:'var(--text-muted)' }}>False positives</div>
                <div style={{ fontSize:28,fontWeight:800,color:'#9ca3af',marginTop:4 }}>{ai.totals.rejected}</div>
                <div style={{ fontSize:11,color:'var(--text-secondary)' }}>used to reduce future noise</div>
              </div>
            </div>

            {/* Active forecasts */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 12px' }}>📅 Active forecasts ({ai.forecasts.length})</h2>
              {ai.forecasts.length === 0 ? (
                <p style={{ fontSize:13,color:'var(--text-muted)',fontStyle:'italic',margin:0 }}>No active forecasts — engine hasn&rsquo;t yet projected any threshold crossings inside the configured horizon.</p>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%',fontSize:12,borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid var(--border)' }}>
                        <th style={{ textAlign:'left',padding:'8px 6px',fontWeight:600,color:'var(--text-secondary)',fontSize:10,textTransform:'uppercase' }}>Asset</th>
                        <th style={{ textAlign:'left',padding:'8px 6px',fontWeight:600,color:'var(--text-secondary)',fontSize:10,textTransform:'uppercase' }}>Sensor</th>
                        <th style={{ textAlign:'left',padding:'8px 6px',fontWeight:600,color:'var(--text-secondary)',fontSize:10,textTransform:'uppercase' }}>Predicted crossing</th>
                        <th style={{ textAlign:'right',padding:'8px 6px',fontWeight:600,color:'var(--text-secondary)',fontSize:10,textTransform:'uppercase' }}>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ai.forecasts.map(f => (
                        <tr key={f.id} style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                          <td style={{ padding:'8px 6px',color:'var(--text-primary)',fontWeight:500 }}>{f.machineName ?? '—'}</td>
                          <td style={{ padding:'8px 6px',color:'var(--text-secondary)' }}>{f.sensorType}</td>
                          <td style={{ padding:'8px 6px',color:'var(--text-secondary)' }}>
                            {f.predictedFailureAt ? new Date(f.predictedFailureAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding:'8px 6px',textAlign:'right',color:'var(--accent)',fontWeight:700 }}>{f.confidence}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent detections */}
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 12px' }}>🔍 Recent detections (last 25)</h2>
              {ai.detections.length === 0 ? (
                <p style={{ fontSize:13,color:'var(--text-muted)',fontStyle:'italic',margin:0 }}>No detections yet for this org.</p>
              ) : (
                <div className="space-y-2">
                  {ai.detections.map(d => (
                    <div key={d.id} style={{
                      borderLeft:`4px solid ${sevColors[d.severity] ?? '#9ca3af'}`,
                      background:'var(--bg-card)',
                      border:'1px solid var(--border)',
                      borderRadius:8,
                      padding:'10px 12px',
                    }}>
                      <div className="flex items-start justify-between gap-2">
                        <div style={{ flex:1,minWidth:0 }}>
                          <div className="flex items-center gap-2 flex-wrap" style={{ fontSize:11 }}>
                            <span style={{ fontWeight:700,color:sevColors[d.severity] ?? '#9ca3af',textTransform:'uppercase' }}>{d.severity}</span>
                            <span style={{ color:'var(--text-muted)' }}>·</span>
                            <span style={{ color:'var(--text-secondary)',fontWeight:600 }}>{d.machineName ?? 'Unknown'}</span>
                            <span style={{ color:'var(--text-muted)' }}>·</span>
                            <span style={{ color:'var(--text-secondary)' }}>{d.sensorType}</span>
                            <span style={{ color:'var(--text-muted)' }}>·</span>
                            <span style={{ color:'var(--text-secondary)' }}>{d.modelUsed}</span>
                            <span style={{ color:'var(--text-muted)' }}>·</span>
                            <span style={{ color:'var(--text-secondary)' }}>{new Date(d.detectedAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize:13,color:'var(--text-primary)',marginTop:4 }}>{d.message}</div>
                          {d.recommendation && (
                            <div style={{ fontSize:12,color:'var(--text-secondary)',marginTop:2,fontStyle:'italic' }}>→ {d.recommendation}</div>
                          )}
                        </div>
                        <span style={{
                          fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:4,
                          background: fbColors[d.feedback] + '22',
                          color: fbColors[d.feedback],
                          flexShrink: 0,
                        }}>{d.feedback}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ BILLING TAB ═══════════════ */}
      {activeTab==='billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 14px' }}>💳 Billing Summary</h2>
            {[
              ['Plan',         org.plan],
              ['Status',       org.subscriptionStatus??'—'],
              ['Period End',   fmtDate(org.currentPeriodEnd)],
              ['Trial End',    fmtDate(org.trialEndsAt)],
              ['Cancel at PE', org.cancelAtPeriodEnd?'Yes':'No'],
              ['Stripe Cust',  org.stripeCustomerId ? org.stripeCustomerId.slice(0,24)+'…' : '—'],
              ['Stripe Sub',   org.stripeSubscriptionId ? org.stripeSubscriptionId.slice(0,24)+'…' : '—'],
            ].map(([k,v])=>(
              <div key={k as string} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
                <span style={{ color:'var(--text-secondary)' }}>{k}</span>
                <span style={{ color:'var(--text-primary)',fontWeight:600 }}>{v as string}</span>
              </div>
            ))}
            <div style={{ marginTop:16,display:'flex',gap:10 }}>
              <Link href={`/admin/billing/${org.id}`} style={{ flex:1,padding:'10px',borderRadius:8,background:'var(--accent)',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700,textAlign:'center' }}>
                Full Billing Control →
              </Link>
            </div>
          </div>

          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,padding:22 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'0 0 14px' }}>🔄 Quick Plan Change</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
              {PLANS.map(p=>(
                <label key={p} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:8,cursor:'pointer',
                  border:editPlan===p?`2px solid ${PLAN_COLORS[p]}`:'2px solid var(--border)',
                  background:editPlan===p?PLAN_COLORS[p]+'10':'var(--bg-surface-2)' }}>
                  <input type="radio" name="billingtab-plan" value={p} checked={editPlan===p} onChange={()=>setEditPlan(p)} style={{ accentColor:PLAN_COLORS[p] }} />
                  <span style={{ flex:1,fontSize:13,fontWeight:600,color:editPlan===p?PLAN_COLORS[p]:'var(--text-primary)' }}>{p}</span>
                  {p===org.plan && <span style={{ fontSize:11,color:'#10b981',fontWeight:600 }}>current</span>}
                </label>
              ))}
            </div>
            <button onClick={()=>patchOrg({plan:editPlan},'Plan updated')} disabled={saving||editPlan===org.plan}
              style={{ width:'100%',padding:'10px',borderRadius:8,border:'none',background:editPlan!==org.plan?'var(--accent)':'var(--bg-surface-2)',color:editPlan!==org.plan?'#fff':'var(--text-secondary)',fontWeight:700,fontSize:13,cursor:editPlan!==org.plan?'pointer':'not-allowed' }}>
              {saving?'Saving…':`Apply ${editPlan} Plan`}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ INTEGRATIONS TAB ═══════════════ */}
      {activeTab==='integrations' && (
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>🔌 Integrations ({org.integrations.length})</h2>
            </div>
            <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-surface-2)' }}>
                  {['Type','Name','Status','Connected'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {org.integrations.map((i,idx)=>(
                  <tr key={i.id} style={{ borderBottom:idx<org.integrations.length-1?'1px solid var(--border)':'none' }}>
                    <td style={{ padding:'11px 14px',fontSize:13,fontWeight:700,color:'var(--text-primary)' }}>{i.type}</td>
                    <td style={{ padding:'11px 14px',fontSize:13,color:'var(--text-primary)' }}>{i.name}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <Badge label={i.status} color={i.status==='CONNECTED'?'#10b981':i.status==='ERROR'?'#ef4444':'#6b7280'} />
                    </td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(i.createdAt)}</td>
                  </tr>
                ))}
                {org.integrations.length===0 && <tr><td colSpan={4} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>No integrations configured</td></tr>}
              </tbody>
            </table>
          </div>
          </div>

          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>🪝 Webhooks ({org.webhooks.length})</h2>
            </div>
            <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-surface-2)' }}>
                  {['Name','URL','Active','Failures','Last Triggered'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {org.webhooks.map((w,i)=>(
                  <tr key={w.id} style={{ borderBottom:i<org.webhooks.length-1?'1px solid var(--border)':'none' }}>
                    <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{w.name}</td>
                    <td style={{ padding:'11px 14px',fontSize:11,color:'var(--text-secondary)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{w.url}</td>
                    <td style={{ padding:'11px 14px' }}><Toggle checked={w.isActive} onChange={()=>{}} /></td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:w.failureCount>0?'#ef4444':'var(--text-secondary)',fontWeight:w.failureCount>0?700:400,textAlign:'center' }}>{w.failureCount}</td>
                    <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDateTime(w.lastTriggeredAt)}</td>
                  </tr>
                ))}
                {org.webhooks.length===0 && <tr><td colSpan={5} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>No webhooks configured</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ IDENTITY (SSO/SCIM) TAB ═══════════════ */}
      {activeTab==='identity' && (
        <div style={{ display:'grid',gap:20 }}>
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>🔐 SAML 2.0 Single Sign-On</h2>
              <p style={{ margin:'4px 0 0',fontSize:12,color:'var(--text-secondary)' }}>
                Per-tenant IdP config. Read-only on this dashboard — the customer admin manages it from /settings/sso.
              </p>
            </div>
            <div style={{ padding:'16px 20px',display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:14 }}>
              {!org.ssoConfig ? (
                <div style={{ padding:18,textAlign:'center',color:'var(--text-secondary)',fontSize:13 }}>
                  No SSO configured for this organization.
                </div>
              ) : (
                <>
                  <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
                    <Badge label={org.ssoConfig.enabled ? 'Enabled' : 'Disabled'} color={org.ssoConfig.enabled ? '#10b981' : '#6b7280'} />
                    <Badge label={org.ssoConfig.enforced ? 'Enforced' : 'Optional'} color={org.ssoConfig.enforced ? '#8b5cf6' : '#6b7280'} />
                    <Badge label={`Default role: ${org.ssoConfig.defaultRole}`} color="#6366f1" />
                  </div>
                  <div style={{ display:'grid',gap:8,fontSize:12,color:'var(--text-secondary)' }}>
                    <div><span style={{ fontWeight:600 }}>IdP Entity ID:</span> <code style={{ wordBreak:'break-all' }}>{org.ssoConfig.idpEntityId}</code></div>
                    <div><span style={{ fontWeight:600 }}>IdP SSO URL:</span> <code style={{ wordBreak:'break-all' }}>{org.ssoConfig.idpSsoUrl}</code></div>
                    <div><span style={{ fontWeight:600 }}>Last updated:</span> {fmtDateTime(org.ssoConfig.updatedAt)}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>🔑 SCIM 2.0 Provisioning Tokens ({org.scimTokens.length})</h2>
              <p style={{ margin:'4px 0 0',fontSize:12,color:'var(--text-secondary)' }}>
                Active bearer tokens the customer&rsquo;s IdP uses to provision users via SCIM. Plaintext is never stored.
              </p>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--bg-surface-2)' }}>
                    {['Label','Prefix','Created','Last used'].map(h=>(
                      <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {org.scimTokens.map((t,i)=>(
                    <tr key={t.id} style={{ borderBottom:i<org.scimTokens.length-1?'1px solid var(--border)':'none' }}>
                      <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{t.label}</td>
                      <td style={{ padding:'11px 14px',fontSize:12,fontFamily:'monospace',color:'var(--text-secondary)' }}>{t.prefix}…</td>
                      <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{fmtDate(t.createdAt)}</td>
                      <td style={{ padding:'11px 14px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{t.lastUsedAt ? fmtDateTime(t.lastUsedAt) : '—'}</td>
                    </tr>
                  ))}
                  {org.scimTokens.length===0 && <tr><td colSpan={4} style={{ padding:28,textAlign:'center',color:'var(--text-secondary)' }}>No active SCIM tokens</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ACTIVITY TAB ═══════════════ */}
      {activeTab==='activity' && (
        <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:0 }}>📋 Activity Log ({auditLogs.length} entries)</h2>
          </div>
          <div style={{ padding:'4px 0',maxHeight:600,overflowY:'auto' }}>
            {auditLogs.length===0 ? (
              <div style={{ padding:32,textAlign:'center',color:'var(--text-secondary)' }}>No activity recorded</div>
            ) : auditLogs.map((log,i)=>(
              <div key={log.id} style={{ display:'flex',gap:12,padding:'12px 20px',borderBottom:i<auditLogs.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ width:30,height:30,borderRadius:'50%',background:'var(--bg-surface-2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>
                  {log.action.includes('DELETE')?'🗑️':log.action.includes('CREATE')?'✨':log.action.includes('UPDATE')?'✏️':log.action.includes('LOGIN')?'🔐':'📋'}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:4 }}>
                    <div style={{minWidth:0,flex:'1 1 auto'}}>
                      <span style={{ fontWeight:600,fontSize:13,color:'var(--text-primary)' }}>{log.action}</span>
                      <span style={{ fontSize:12,color:'var(--text-secondary)',marginLeft:8 }}>on {log.entity}{log.entityId?` (${log.entityId.slice(0,8)}…)`:''}</span>
                    </div>
                    <span style={{ fontSize:11,color:'var(--text-secondary)',whiteSpace:'nowrap',marginLeft:12 }}>{fmtDateTime(log.createdAt)}</span>
                  </div>
                  {log.userName && <div style={{ fontSize:11,color:'var(--text-secondary)',marginTop:2 }}>by {log.userName}</div>}
                  {log.changes && (
                    <details style={{ marginTop:4 }}>
                      <summary style={{ fontSize:11,color:'var(--accent)',cursor:'pointer' }}>View changes</summary>
                      <pre style={{ marginTop:4,padding:'6px 10px',borderRadius:6,background:'var(--bg-surface-2)',fontSize:10,color:'var(--text-secondary)',overflow:'auto',maxHeight:100 }}>
                        {JSON.stringify(JSON.parse(log.changes),null,2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}