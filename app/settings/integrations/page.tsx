'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import PlanGate from '@/app/components/PlanGate';
import { IntegrationCardSkeleton } from '@/app/components/LoadingSkeleton';
import { invalidateCache, setCached } from '@/app/lib/client-cache';
import Link from 'next/link';
import ScopedExportModal, { ScopeDataset } from '@/app/components/ScopedExportModal';

interface IntegrationData {
  id: string;
  type: string;
  name: string;
  status: string;
  connectedAt?: string;
  config?: Record<string, any>;
  apiKey?: string;
  webhookUrl?: string;
  platformInherited?: boolean;
  inheritedFrom?: string;
  fromNumber?: string;
  hasApiKey?: boolean;
  disabledPlatformInheritance?: boolean;
  adminConnected?: boolean;
}

type ModalType =
  | { kind: 'twilio' }
  | { kind: 'zapier'; apiKey: string; webhookUrl: string }
  | { kind: 'oauth'; integration: string; name: string }
  | { kind: 'webhooks' }
  | { kind: 'pagerduty' }
  | { kind: 'ms_teams' }
  | null;

const INTEGRATION_META: Record<string, { icon: string; name: string; description: string; category: string }> = {
  slack:         { icon: '💬', name: 'Slack',           description: 'Get work order notifications and alerts in your Slack channels', category: 'Communication' },
  quickbooks:    { icon: '💰', name: 'QuickBooks',      description: 'Sync maintenance costs and parts purchases with QuickBooks', category: 'Accounting' },
  zapier:        { icon: '⚡', name: 'Zapier',          description: 'Connect Myncel to 5,000+ apps and automate workflows', category: 'Automation' },
  twilio:        { icon: '📱', name: 'SMS Notifications', description: 'Send work order alerts via SMS to your team using Twilio', category: 'Communication' },
  webhooks:      { icon: '🔗', name: 'Webhooks',        description: 'Send real-time events to your own endpoints', category: 'Developer' },
  google_sheets: { icon: '📊', name: 'Google Sheets',   description: 'Export reports and data to Google Sheets automatically', category: 'Productivity' },
  pagerduty:     { icon: '🚨', name: 'PagerDuty',       description: 'Page on-call engineers for breakdowns and overdue PMs via PagerDuty Events API v2', category: 'Communication' },
  ms_teams:      { icon: '👥', name: 'Microsoft Teams', description: 'Get adaptive-card alerts in any Teams channel via Incoming Webhook', category: 'Communication' },
};

const ALL_IDS = ['slack', 'quickbooks', 'zapier', 'twilio', 'webhooks', 'google_sheets', 'pagerduty', 'ms_teams'];

function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Record<string, IntegrationData>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [twilioForm, setTwilioForm] = useState({ accountSid: '', authToken: '', fromNumber: '' });
  const [twilioError, setTwilioError] = useState('');
  const [twilioSaving, setTwilioSaving] = useState(false);
  // PagerDuty connect form
  const [pdForm, setPdForm] = useState({ routingKey: '', serviceName: 'Myncel Alerts' });
  const [pdError, setPdError] = useState('');
  const [pdSaving, setPdSaving] = useState(false);
  // Microsoft Teams connect form
  const [teamsForm, setTeamsForm] = useState({ webhookUrl: '', channelName: 'Myncel Alerts' });
  const [teamsError, setTeamsError] = useState('');
  const [teamsSaving, setTeamsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<
    | null
    | {
        integration: string;
        title: string;
        message: string;
        url?: string;
        details?: string;
      }
  >(null);

  // Scoped export modal state — admin picks org + records for each integration action
  const [scopeModal, setScopeModal] = useState<
    | null
    | {
        integration: 'google_sheets' | 'quickbooks' | 'slack';
        title: string;
        description?: string;
        datasets: ScopeDataset[];
        qbDataset?: 'invoices' | 'items' | 'vendors'; // QB-specific mapping
        confirmLabel: string;
      }
  >(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);  };

  const fetchIntegrations = useCallback(async (_useCache = false) => {
    // Integration status changes (connect/disconnect/toggle) must be reflected
    // immediately in the UI. We deliberately bypass fetchWithCache's
    // stale-while-revalidate path here because that returns stale data on
    // mount (e.g. after sign-out → sign-in within the same browser session)
    // without ever updating React state when the background revalidate completes.
    // Always fetch fresh data and update state directly.
    try {
      // Defensively clear any cached data so other places that use fetchWithCache
      // ('integrations' key) get the same fresh data we just fetched.
      invalidateCache('integrations');

      const res = await fetch('/api/integrations', { cache: 'no-store' });
      if (!res.ok) {
        console.error('[integrations] fetch failed with status:', res.status);
        setIntegrations({});
        return;
      }

      const json = await res.json();
      const map: Record<string, IntegrationData> = {};
      (json.integrations || []).forEach((i: any) => {
        map[i.id] = {
          id: i.integrationId || i.id,
          type: i.id,
          name: i.name,
          status: i.status || (i.connected ? 'CONNECTED' : 'PENDING'),
          disabledPlatformInheritance: i.disabledPlatformInheritance || false,
          adminConnected: i.adminConnected || false,
          connectedAt: i.connectedAt,
          config: i.config,
          apiKey: i.apiKey,
          webhookUrl: i.webhookUrl,
          platformInherited: i.platformInherited || false,
          inheritedFrom: i.inheritedFrom,
          fromNumber: i.fromNumber,
          hasApiKey: i.hasApiKey,
        };
      });
      console.log('[integrations] fetched statuses:', Object.fromEntries(
        Object.entries(map).map(([k, v]) => [k, v.status])
      ));
      // Seed the shared cache with the fresh data so other consumers see it too
      setCached('integrations', map);
      setIntegrations(map);
    } catch (e) {
      console.error('Failed to fetch integrations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle OAuth callback success/error from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success) {
      const name = success.replace('_connected', '').replace(/_/g, ' ');
      showToast('success', `${name.charAt(0).toUpperCase() + name.slice(1)} connected successfully!`);
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations');
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        // Slack errors
        slack_denied: 'Slack connection was cancelled.',
        slack_invalid: 'Slack callback was missing required parameters.',
        slack_state_invalid: 'Slack OAuth state was invalid. Please try again.',
        slack_state_expired: 'Slack OAuth session expired. Please try again.',
        slack_state_mismatch: 'Slack OAuth state mismatch. Please try again.',
        slack_not_found: 'Slack integration not found. Please try again.',
        slack_token_failed: 'Slack token exchange failed. Please check your Slack app configuration and ensure the redirect URI is registered.',
        slack_invalid_client: 'Slack OAuth credentials are invalid. Please verify your SLACK_CLIENT_ID and SLACK_CLIENT_SECRET are correct.',
        slack_invalid_code: 'Slack authorization code was invalid or already used. Please try connecting again.',
        slack_redirect_uri: 'Slack redirect URI mismatch. Please add https://www.myncel.com/api/integrations/slack/callback to your Slack App Redirect URLs.',
        slack_error: 'An error occurred connecting Slack. Please try again.',
        // Google errors
        google_denied: 'Google connection was cancelled.',
        google_invalid: 'Google callback was missing required parameters.',
        google_state_invalid: 'Google OAuth state was invalid. Please try again.',
        google_state_expired: 'Google OAuth session expired. Please try again.',
        google_state_mismatch: 'Google OAuth state mismatch. Please try again.',
        google_not_found: 'Google integration not found. Please try again.',
        google_invalid_client: 'Google OAuth credentials are invalid. Please verify your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct, and that the OAuth consent screen is configured.',
        google_token_failed: 'Google token exchange failed. Please check your Google Cloud project configuration.',
        google_error: 'An error occurred connecting Google Sheets. Please try again.',
        // QuickBooks errors
        quickbooks_denied: 'QuickBooks connection was cancelled.',
        quickbooks_invalid: 'QuickBooks callback was missing required parameters.',
        quickbooks_state_invalid: 'QuickBooks OAuth state was invalid. Please try again.',
        quickbooks_state_expired: 'QuickBooks OAuth session expired. Please try again.',
        quickbooks_state_mismatch: 'QuickBooks OAuth state mismatch. Please try again.',
        quickbooks_not_found: 'QuickBooks integration not found. Please try again.',
        quickbooks_token_failed: 'QuickBooks token exchange failed. Please verify your Intuit app is properly configured and the redirect URI is registered.',
        quickbooks_error: 'An error occurred connecting QuickBooks. Please try again.',
      };
      const msg = errorMessages[error] || `Connection error: ${error}`;
      showToast('error', msg);
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations');
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const isDisabledPlatform = (id: string) => integrations[id]?.status === 'PLATFORM_DISABLED';
  const isConnected = (id: string) => integrations[id]?.status === 'CONNECTED' || integrations[id]?.status === 'PLATFORM_INHERITED';
  const isPlatformManaged = (id: string) => integrations[id]?.status === 'PLATFORM_INHERITED' || integrations[id]?.status === 'PLATFORM_DISABLED';

  const handleReenable = async (id: string) => {
    if (!confirm(`Re-enable ${INTEGRATION_META[id]?.name || id}?`)) return;
    setWorking(id);
    try {
      const res = await fetch(`/api/integrations/${id}/reenable`, { method: 'POST' });
      if (res.ok) {
        showToast('success', `${INTEGRATION_META[id]?.name || id} re-enabled.`);
        invalidateCache('integrations');
        fetchIntegrations(false);
      } else {
        const data = await res.json();
        if (data.useConnectFlow) {
          showToast('error', `Use the Connect button to reconnect ${INTEGRATION_META[id]?.name || id}.`);
        } else {
          showToast('error', data.error || 'Failed to re-enable');
        }
      }
    } catch {
      showToast('error', 'Re-enable failed.');
    } finally {
      setWorking(null);
    }
  };

  const handleConnect = async (id: string) => {
    if (id === 'twilio') {
      // First check if Twilio is platform-managed from cached data
      const twilioData = integrations['twilio'];
      const looksLikePlatformManaged = twilioData?.adminConnected || twilioData?.platformInherited || twilioData?.status === 'PLATFORM_INHERITED' || twilioData?.status === 'PLATFORM_DISABLED';

      if (looksLikePlatformManaged) {
        // Platform-managed path: enable without credentials
        setWorking(id);
        try {
          const res = await fetch(`/api/integrations/${id}/reenable`, { method: 'POST' });
          if (res.ok) {
            showToast('success', 'SMS Notifications enabled! The platform admin has already configured Twilio.');
            invalidateCache('integrations');
            fetchIntegrations(false);
          } else {
            const data = await res.json();
            showToast('error', data.error || 'Failed to enable SMS');
          }
        } catch {
          showToast('error', 'Failed to enable SMS Notifications.');
        } finally {
          setWorking(null);
        }
        return;
      }

      // If local data says PENDING, do a server-side check first by calling connect with no body.
      // The server will tell us if it's platform-managed before we show the form.
      setWorking(id);
      try {
        const probeRes = await fetch('/api/integrations/twilio/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // empty — server will handle platform-managed case
        });
        const probeData = await probeRes.json();

        if (probeRes.ok && probeData.platformManaged) {
          // Server confirmed platform-managed and auto-enabled
          showToast('success', probeData.message || 'SMS Notifications enabled!');
          invalidateCache('integrations');
          fetchIntegrations(false);
          return;
        }

        if (!probeRes.ok && probeData.platformManaged) {
          // Server says platform-managed but admin hasn't configured yet
          showToast('error', probeData.error || 'Ask your platform admin to configure Twilio first.');
          return;
        }
      } catch {
        // Probe failed — fall through to show the form (admin org scenario)
      } finally {
        setWorking(null);
      }

      // Only show the credentials form if this is the admin org or server didn't say platform-managed
      setTwilioForm({ accountSid: '', authToken: '', fromNumber: '' });
      setTwilioError('');
      setModal({ kind: 'twilio' });
      return;
    }
    if (id === 'webhooks') { setModal({ kind: 'webhooks' }); return; }

    if (id === 'pagerduty') {
      setPdForm({ routingKey: '', serviceName: 'Myncel Alerts' });
      setPdError('');
      setModal({ kind: 'pagerduty' });
      return;
    }

    if (id === 'ms_teams') {
      setTeamsForm({ webhookUrl: '', channelName: 'Myncel Alerts' });
      setTeamsError('');
      setModal({ kind: 'ms_teams' });
      return;
    }

    setWorking(id);
    try {
      const res = await fetch(`/api/integrations/${id}/connect`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === 'api_key') {
          setModal({ kind: 'zapier', apiKey: data.apiKey, webhookUrl: data.webhookUrl });
          invalidateCache('integrations'); fetchIntegrations(false);
        } else if (res.redirected || data.authUrl) {
          window.location.href = data.authUrl || res.url;
        } else if (data.error) {
          if (data.message) setModal({ kind: 'oauth', integration: id, name: INTEGRATION_META[id]?.name || id });
          else showToast('error', data.error);
        }
      } else {
        const data = await res.json();
        if (data.message) setModal({ kind: 'oauth', integration: id, name: INTEGRATION_META[id]?.name || id });
        else showToast('error', data.error || 'Failed to connect');
      }
    } catch { showToast('error', 'Connection failed. Please try again.'); }
    finally { setWorking(null); }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm(`Disconnect ${INTEGRATION_META[id]?.name || id}? This will disable related notifications.`)) return;
    setWorking(id);
    try {
      const integ = integrations[id];
      if (!integ?.id) { showToast('error', 'Integration not found'); return; }
      const res = await fetch(`/api/integrations/${id}/disconnect`, { method: 'POST' });
      if (res.ok) { showToast('success', `${INTEGRATION_META[id]?.name || id} disconnected.`); invalidateCache('integrations'); fetchIntegrations(false); }
      else { const data = await res.json(); showToast('error', data.error || 'Failed to disconnect'); }
    } catch { showToast('error', 'Disconnect failed.'); }
    finally { setWorking(null); }
  };

  // Handle exporting data to an integration (Google Sheets, QuickBooks, Slack)
  const handleExport = async (
    integrationId: 'google_sheets' | 'quickbooks' | 'slack',
    payload: Record<string, any> = {}
  ) => {
    const endpointMap: Record<string, string> = {
      google_sheets: '/api/integrations/google-sheets/export',
      quickbooks: '/api/integrations/quickbooks/export',
      slack: '/api/integrations/slack/send',
    };
    const titleMap: Record<string, string> = {
      google_sheets: 'Google Sheets',
      quickbooks: 'QuickBooks',
      slack: 'Slack',
    };
    setExporting(integrationId);
    try {
      const res = await fetch(endpointMap[integrationId], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.error || `Failed to export to ${titleMap[integrationId]}`);
        return;
      }

      if (integrationId === 'google_sheets') {
        setExportResult({
          integration: 'google_sheets',
          title: '✅ Exported to Google Sheets',
          message: `Created spreadsheet "${data.title}" with ${data.rowCount} rows of ${data.dataset?.replace('_', ' ')}.`,
          url: data.spreadsheetUrl,
          details: `Spreadsheet ID: ${data.spreadsheetId}`,
        });
        showToast('success', `Exported ${data.rowCount} rows to Google Sheets`);
        // Auto-open the new sheet in a new tab
        if (data.spreadsheetUrl && typeof window !== 'undefined') {
          window.open(data.spreadsheetUrl, '_blank', 'noopener');
        }
      } else if (integrationId === 'quickbooks') {
        setExportResult({
          integration: 'quickbooks',
          title: '✅ Exported to QuickBooks',
          message:
            data.created > 0
              ? `Created ${data.created} ${data.dataset} in ${data.companyInfo?.name || 'QuickBooks'}.`
              : data.message || 'Nothing to export.',
          url:
            data.links?.[
              data.dataset === 'invoices'
                ? 'invoices'
                : data.dataset === 'vendors'
                ? 'vendors'
                : 'items'
            ] || data.links?.quickBooksDashboard,
          details: data.ids?.length ? `IDs: ${data.ids.join(', ')}` : undefined,
        });
        showToast('success', `Exported ${data.created} ${data.dataset} to QuickBooks`);
      } else if (integrationId === 'slack') {
        setExportResult({
          integration: 'slack',
          title: '✅ Sent to Slack',
          message: `Maintenance digest posted to ${data.channel}${data.team ? ` in ${data.team}` : ''}.`,
          details: data.ts ? `Message timestamp: ${data.ts}` : undefined,
        });
        showToast('success', `Sent digest to Slack (${data.channel})`);
      }
    } catch (err) {
      showToast('error', `Export to ${titleMap[integrationId]} failed. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  const handleTwilioSave = async () => {
    setTwilioError('');
    if (!twilioForm.accountSid || !twilioForm.authToken || !twilioForm.fromNumber) {
      setTwilioError('All fields are required.'); return;
    }
    if (!/^\+\d{10,15}$/.test(twilioForm.fromNumber)) {
      setTwilioError('From Number must be in E.164 format, e.g. +12125551234'); return;
    }
    setTwilioSaving(true);
    try {
      const res = await fetch('/api/integrations/twilio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: twilioForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setModal(null);
        // If platform-managed, show a more informative message
        const msg = data.platformManaged
          ? 'SMS Notifications enabled! Your platform admin has already configured Twilio — no credentials needed.'
          : 'SMS / Twilio connected successfully!';
        showToast('success', msg);
        invalidateCache('integrations');
        fetchIntegrations(false);
      } else {
        // If the server says it's platform-managed but admin hasn't set it up, close the form and show a clear message
        if (data.platformManaged) {
          setModal(null);
          showToast('error', data.error || 'SMS is platform-managed. Ask your admin to configure Twilio first.');
        } else {
          setTwilioError(data.error || 'Failed to save configuration.');
        }
      }
    } catch { setTwilioError('Failed to save. Please try again.'); }
    finally { setTwilioSaving(false); }
  };

  /* ── PagerDuty connect / test ─────────────────────────────────────── */
  const handlePagerDutySave = async () => {
    setPdError('');
    const key = pdForm.routingKey.trim();
    if (!/^[a-fA-F0-9]{32}$/.test(key)) {
      setPdError('Integration Key must be a 32-character hex string from PagerDuty → Service → Integrations → Events API V2.');
      return;
    }
    setPdSaving(true);
    try {
      const res = await fetch('/api/integrations/pagerduty/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routingKey: key, serviceName: pdForm.serviceName.trim() || 'Myncel Alerts' }),
      });
      const data = await res.json();
      if (res.ok) {
        setModal(null);
        showToast('success', data.message || 'PagerDuty connected. Test incident triggered + resolved on your service.');
        invalidateCache('integrations');
        fetchIntegrations(false);
      } else {
        setPdError(data.error || 'Failed to connect PagerDuty.');
      }
    } catch { setPdError('Connection failed. Please try again.'); }
    finally { setPdSaving(false); }
  };

  const handlePagerDutyTest = async () => {
    setExporting('pagerduty');
    try {
      const res = await fetch('/api/integrations/pagerduty/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) showToast('success', 'Test incident sent to PagerDuty (auto-resolves in 5s).');
      else showToast('error', data.error || 'Test failed.');
    } catch { showToast('error', 'Test failed. Please try again.'); }
    finally { setExporting(null); }
  };

  /* ── Microsoft Teams connect / test ───────────────────────────────── */
  const handleTeamsSave = async () => {
    setTeamsError('');
    const url = teamsForm.webhookUrl.trim();
    if (!/^https:\/\/[^/]+\.webhook\.office\.com\//.test(url)) {
      setTeamsError('Webhook URL must look like https://<tenant>.webhook.office.com/webhookb2/... — copy it from Teams → Channel → Connectors → Incoming Webhook → Configure.');
      return;
    }
    setTeamsSaving(true);
    try {
      const res = await fetch('/api/integrations/teams/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url, channelName: teamsForm.channelName.trim() || 'Myncel Alerts' }),
      });
      const data = await res.json();
      if (res.ok) {
        setModal(null);
        showToast('success', data.message || 'Microsoft Teams connected. Confirmation card posted to your channel.');
        invalidateCache('integrations');
        fetchIntegrations(false);
      } else {
        setTeamsError(data.error || 'Failed to connect Microsoft Teams.');
      }
    } catch { setTeamsError('Connection failed. Please try again.'); }
    finally { setTeamsSaving(false); }
  };

  const handleTeamsTest = async () => {
    setExporting('ms_teams');
    try {
      const res = await fetch('/api/integrations/teams/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) showToast('success', 'Test card posted to your Teams channel.');
      else showToast('error', data.error || 'Test failed.');
    } catch { showToast('error', 'Test failed. Please try again.'); }
    finally { setExporting(null); }
  };


  const connectedIds = ALL_IDS.filter(isConnected);
  const disabledPlatformIds = ALL_IDS.filter(isDisabledPlatform);
  // Platform-managed but not yet enabled by this org (admin has it, org hasn't opted in or out)
  const platformAvailableIds = ALL_IDS.filter(id => {
    if (isConnected(id) || isDisabledPlatform(id)) return false;
    const data = integrations[id];
    // Show as platform-available if admin has it connected but this org hasn't enabled it
    // Check multiple indicators: adminConnected flag, platformInherited flag, or PLATFORM_INHERITED status
    const isPlatformAvailable = data?.adminConnected || data?.platformInherited || data?.status === 'PLATFORM_INHERITED';
    return isPlatformAvailable && data?.status !== 'PLATFORM_INHERITED';
  });
  // Truly available (no platform management, org needs own credentials)
  const availableIds = ALL_IDS.filter(id => !isConnected(id) && !isDisabledPlatform(id) && !isPlatformManaged(id) && !platformAvailableIds.includes(id));

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Export Result Modal */}
      {exportResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 modal-safe-pad" onClick={() => setExportResult(null)}>
          <div
            className="rounded-2xl border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {exportResult.title}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {exportResult.message}
            </p>
            {exportResult.details && (
              <p className="text-xs mb-4 font-mono p-2 rounded" style={{ background: 'var(--bg-muted, #f3f4f6)', color: 'var(--text-muted)' }}>
                {exportResult.details}
              </p>
            )}
            <div className="flex items-center gap-2 justify-end">
              {exportResult.url && (
                <a
                  href={exportResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors"
                  style={{ background: '#635bff' }}
                >
                  Open ↗
                </a>
              )}
              <button
                onClick={() => setExportResult(null)}
                className="px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Integrations</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Connect Myncel with your favorite tools to automate notifications and workflows.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <IntegrationCardSkeleton />
          <IntegrationCardSkeleton />
          <IntegrationCardSkeleton />
        </div>
      ) : (
        <>
          {/* Connected */}
          {connectedIds.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Connected ({connectedIds.length})
              </h3>
              <div className="grid gap-3">
                {connectedIds.map(id => {
                  const meta = INTEGRATION_META[id];
                  const data = integrations[id];
                  const isPlatform = data?.status === 'PLATFORM_INHERITED';
                  return (
                    <div key={id} className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{meta.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{meta.name}</h4>
                              {!isPlatform && (
                                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  Connected
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
                            {isPlatform && data?.fromNumber && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                From number: {data.fromNumber}
                              </p>
                            )}
                            {isPlatform && data?.hasApiKey && id === 'zapier' && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                API Key configured • Manage via Admin
                              </p>
                            )}
                            {isPlatform && id === 'webhooks' && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                Webhook endpoints available • Manage via Admin
                              </p>
                            )}
                            {data?.connectedAt && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {isPlatform ? 'Configured' : 'Connected'} {new Date(data.connectedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {isPlatform ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Enable/Disable toggle for platform-managed integrations */}
                            <button
                              onClick={() => handleDisconnect(id)}
                              disabled={working === id}
                              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 bg-[#635bff]"
                              title="Disable this integration for your organization"
                            >
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6 shadow-sm" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                            {/* Export / Action buttons for integrations that support it */}
                            {id === 'google_sheets' && (
                              <div className="relative inline-block">
                                <details className="inline-block">
                                  <summary
                                    className="list-none cursor-pointer px-3 py-2 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
                                    style={{ background: '#0f9d58', color: 'white' }}
                                    title="Export data to Google Sheets"
                                  >
                                    {exporting === 'google_sheets' ? (
                                      <>Exporting…</>
                                    ) : (
                                      <>📊 Export to Sheets ▾</>
                                    )}
                                  </summary>
                                  <div className="absolute right-0 mt-1 w-56 rounded-lg shadow-lg border z-10" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                    <button
                                      onClick={(e) => {
                                        (e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open');
                                        setScopeModal({
                                          integration: 'google_sheets',
                                          title: 'Export Work Orders to Google Sheets',
                                          description: 'Select the organization and which work orders to include in the new spreadsheet.',
                                          datasets: ['work_orders'],
                                          confirmLabel: 'Create spreadsheet',
                                        });
                                      }}
                                      disabled={exporting === 'google_sheets'}
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-50 border-b flex items-center gap-2"
                                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                    >
                                      <span>🔧</span>
                                      <div>
                                        <div className="font-medium">Work Orders</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Export all maintenance work</div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        (e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open');
                                        setScopeModal({
                                          integration: 'google_sheets',
                                          title: 'Export Machines to Google Sheets',
                                          description: 'Select the organization and which equipment to include.',
                                          datasets: ['machines'],
                                          confirmLabel: 'Create spreadsheet',
                                        });
                                      }}
                                      disabled={exporting === 'google_sheets'}
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-50 border-b flex items-center gap-2"
                                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                    >
                                      <span>⚙️</span>
                                      <div>
                                        <div className="font-medium">Machines</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Equipment registry</div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        (e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open');
                                        setScopeModal({
                                          integration: 'google_sheets',
                                          title: 'Export Alerts to Google Sheets',
                                          description: 'Select the organization and which alerts to include.',
                                          datasets: ['alerts'],
                                          confirmLabel: 'Create spreadsheet',
                                        });
                                      }}
                                      disabled={exporting === 'google_sheets'}
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-50 flex items-center gap-2"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      <span>🚨</span>
                                      <div>
                                        <div className="font-medium">Alerts</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Critical & warning alerts</div>
                                      </div>
                                    </button>
                                  </div>
                                </details>
                              </div>
                            )}
                            {id === 'quickbooks' && (
                              <div className="relative inline-block">
                                <details className="inline-block">
                                  <summary
                                    className="list-none cursor-pointer px-3 py-2 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
                                    style={{ background: '#2ca01c', color: 'white' }}
                                    title="Export data to QuickBooks"
                                  >
                                    {exporting === 'quickbooks' ? (
                                      <>Exporting…</>
                                    ) : (
                                      <>💰 Export to QB ▾</>
                                    )}
                                  </summary>
                                  <div className="absolute right-0 mt-1 w-56 rounded-lg shadow-lg border z-10" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                    <button
                                      onClick={(e) => {
                                        (e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open');
                                        setScopeModal({
                                          integration: 'quickbooks',
                                          title: 'Create QuickBooks Invoices',
                                          description: 'Pick the organization and which completed work orders to invoice in QuickBooks.',
                                          datasets: ['work_orders'],
                                          qbDataset: 'invoices',
                                          confirmLabel: 'Create invoices',
                                        });
                                      }}
                                      disabled={exporting === 'quickbooks'}
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-50 border-b flex items-center gap-2"
                                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                    >
                                      <span>🧾</span>
                                      <div>
                                        <div className="font-medium">Create Invoices</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>From completed work orders</div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        (e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open');
                                        setScopeModal({
                                          integration: 'quickbooks',
                                          title: 'Sync Parts → QuickBooks Items',
                                          description: 'Pick the organization and which inventory parts to sync as QuickBooks items.',
                                          datasets: ['parts'],
                                          qbDataset: 'items',
                                          confirmLabel: 'Sync items',
                                        });
                                      }}
                                      disabled={exporting === 'quickbooks'}
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-50 border-b flex items-center gap-2"
                                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                    >
                                      <span>📦</span>
                                      <div>
                                        <div className="font-medium">Sync Items</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>From Myncel parts inventory</div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        (e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open');
                                        setScopeModal({
                                          integration: 'quickbooks',
                                          title: 'Sync Vendors → QuickBooks',
                                          description: 'Pick the organization whose vendor records you want to sync to QuickBooks.',
                                          datasets: ['vendors'],
                                          qbDataset: 'vendors',
                                          confirmLabel: 'Sync vendors',
                                        });
                                      }}
                                      disabled={exporting === 'quickbooks'}
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-50 flex items-center gap-2"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      <span>🏢</span>
                                      <div>
                                        <div className="font-medium">Sync Vendors</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>From Myncel vendor records</div>
                                      </div>
                                    </button>
                                  </div>
                                </details>
                              </div>
                            )}
                            {id === 'slack' && (
                              <button
                                onClick={() => setScopeModal({
                                  integration: 'slack',
                                  title: 'Send Maintenance Digest to Slack',
                                  description: 'Pick the organization whose data to summarize in the Slack digest. Optionally filter to specific work orders or alerts.',
                                  datasets: ['work_orders', 'alerts'],
                                  confirmLabel: 'Send digest',
                                })}
                                disabled={exporting === 'slack'}
                                className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                                style={{ background: '#4a154b', color: 'white' }}
                                title="Send a maintenance digest to your Slack channel"
                              >
                                {exporting === 'slack' ? 'Sending…' : '💬 Send Digest'}
                              </button>
                            )}
                            {id === 'pagerduty' && (
                              <button
                                onClick={handlePagerDutyTest}
                                disabled={exporting === 'pagerduty'}
                                className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                                style={{ background: '#06ac38', color: 'white' }}
                                title="Trigger a one-shot test incident in PagerDuty (auto-resolves)"
                              >
                                {exporting === 'pagerduty' ? 'Sending…' : '🚨 Test Page'}
                              </button>
                            )}
                            {id === 'ms_teams' && (
                              <button
                                onClick={handleTeamsTest}
                                disabled={exporting === 'ms_teams'}
                                className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                                style={{ background: '#4b53bc', color: 'white' }}
                                title="Post a test adaptive card to your Teams channel"
                              >
                                {exporting === 'ms_teams' ? 'Sending…' : '👥 Test Card'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDisconnect(id)}
                              disabled={working === id}
                              className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
                            >
                              {working === id ? 'Working…' : 'Disconnect'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disabled Platform Integrations */}
          {disabledPlatformIds.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Disabled Platform Integrations ({disabledPlatformIds.length})
              </h3>
              <div className="grid gap-3">
                {disabledPlatformIds.map(id => {
                  const meta = INTEGRATION_META[id];
                  const data = integrations[id];
                  return (
                    <div key={id} className="rounded-xl border p-5 opacity-75" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl grayscale">{meta.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{meta.name}</h4>
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                                Disabled by your org
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
                            {data?.hasApiKey && id === 'zapier' && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                API Key configured • Manage via Admin
                              </p>
                            )}
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              Admin has this integration enabled. Toggle to re-enable for your organization.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                            Disabled
                          </span>
                          {/* Enable/Disable toggle — currently disabled, click to enable */}
                          <button
                            onClick={() => handleReenable(id)}
                            disabled={working === id}
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 bg-gray-300"
                            title="Re-enable this platform integration for your organization"
                          >
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1 shadow-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Platform-Managed — Available to Enable */}
          {platformAvailableIds.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Platform-Managed ({platformAvailableIds.length})
              </h3>
              <div className="grid gap-3">
                {platformAvailableIds.map(id => {
                  const meta = INTEGRATION_META[id];
                  const data = integrations[id];
                  return (
                    <div key={id} className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{meta.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{meta.name}</h4>
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                                Platform-Managed
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
                            {data?.fromNumber && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                From number: {data.fromNumber} (configured by admin)
                              </p>
                            )}
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              Your platform admin has already configured this integration. Click Enable to activate it for your organization.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConnect(id)}
                          disabled={working === id}
                          className="px-4 py-2 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          {working === id ? 'Enabling…' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Available Integrations
            </h3>
            <div className="grid gap-3">
              {availableIds.map(id => {
                const meta = INTEGRATION_META[id];
                return (
                  <div key={id} className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{meta.icon}</span>
                        <div>
                          <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{meta.name}</h4>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                            {meta.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(id)}
                        disabled={working === id}
                        className="px-4 py-2 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        {working === id ? 'Connecting…' : id === 'webhooks' ? 'Manage' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Webhooks section */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Webhook Endpoints</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Configure custom endpoints to receive real-time Myncel events</p>
              </div>
              <Link href="/settings/webhooks" className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors" style={{ background: '#0a2540' }}>
                Manage Webhooks →
              </Link>
            </div>
            <div className="rounded-lg p-4 border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>Events available:</p>
              <div className="flex flex-wrap gap-2">
                {['work_order.created', 'work_order.completed', 'alert.triggered', 'machine.status_changed', 'pm.overdue'].map(ev => (
                  <span key={ev} className="text-xs font-mono px-2 py-1 rounded border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{ev}</span>
                ))}
              </div>
            </div>
          </div>

          {/* REST API */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>REST API</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Use the Myncel REST API to build custom integrations. Base URL:{' '}
              <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                https://www.myncel.com/api
              </code>
            </p>
            <div className="flex gap-3">
              <Link href="/docs/api" className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                API Documentation
              </Link>
              <button onClick={() => handleConnect('zapier')} className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors" style={{ background: '#0a2540' }}>
                Generate API Key
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 modal-safe-pad" onClick={() => setModal(null)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>

            {/* Twilio */}
            {modal.kind === 'twilio' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">📱</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connect SMS Notifications</h2>
                    
                  </div>
                </div>
                <p className="text-sm mb-5 rounded-lg p-3 border" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  You'll need a{' '}
                  <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline">Twilio account</a>
                  {' '}to send SMS. Enter your credentials below — they are stored securely.
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'Account SID', key: 'accountSid', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
                    { label: 'Auth Token', key: 'authToken', type: 'password', placeholder: 'Your Twilio auth token' },
                    { label: 'From Number', key: 'fromNumber', type: 'tel', placeholder: '+12125551234' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={(twilioForm as any)[f.key]}
                        onChange={e => setTwilioForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  ))}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>From Number must be in E.164 format, e.g. +12125551234</p>
                  {twilioError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{twilioError}</div>}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleTwilioSave} disabled={twilioSaving}
                    className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
                    {twilioSaving ? 'Saving…' : 'Connect SMS'}
                  </button>
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Zapier */}
            {modal.kind === 'zapier' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Zapier Connected</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your API key is ready</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'API Key', value: modal.apiKey },
                    { label: 'Webhook URL', value: modal.webhookUrl },
                  ].map(item => (
                    <div key={item.label}>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</label>
                      <div className="flex gap-2">
                        <code className="flex-1 rounded-lg px-3 py-2.5 text-xs font-mono break-all" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                          {item.value}
                        </code>
                        <button onClick={() => { navigator.clipboard.writeText(item.value); showToast('success', 'Copied!'); }}
                          className="px-3 py-2 rounded-lg text-sm flex-shrink-0" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                          📋
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Save your API key now.</strong> Use it in the Myncel Zapier app to authenticate.
                  </div>
                </div>
                <button onClick={() => setModal(null)}
                  className="w-full mt-6 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors">
                  Done
                </button>
              </div>
            )}

            {/* OAuth not configured */}
            {modal.kind === 'oauth' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{INTEGRATION_META[modal.integration]?.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connect {modal.name}</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>OAuth configuration required</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-5">
                  <p className="font-semibold mb-1">Environment variables not set</p>
                  <p>To enable {modal.name} OAuth, add these to your environment:</p>
                  <ul className="mt-2 space-y-1 font-mono text-xs">
                    <li>{modal.integration.toUpperCase().replace('-', '_')}_CLIENT_ID</li>
                    <li>{modal.integration.toUpperCase().replace('-', '_')}_CLIENT_SECRET</li>
                  </ul>
                </div>
                <button onClick={() => setModal(null)}
                  className="w-full rounded-lg text-sm py-2.5 transition-colors"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                  Close
                </button>
              </div>
            )}

            {/* PagerDuty connect */}
            {modal.kind === 'pagerduty' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">🚨</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connect PagerDuty</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Page on-call engineers via Events API v2</p>
                  </div>
                </div>
                <div className="text-sm mb-5 rounded-lg p-3 border space-y-2" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  <p>To get your <strong>Integration Key</strong>:</p>
                  <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                    <li>Open <a href="https://pagerduty.com" target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline">PagerDuty</a> → <strong>Services</strong> → pick or create the service that should handle Myncel alerts.</li>
                    <li>Open the service → <strong>Integrations</strong> tab → <strong>+ Add a new integration</strong>.</li>
                    <li>Choose <strong>Events API V2</strong> as the Integration Type → <strong>Add Integration</strong>.</li>
                    <li>Copy the <strong>Integration Key</strong> (a 32-character hex string) and paste it below.</li>
                  </ol>
                  <p className="text-xs">When you click Connect, Myncel will trigger + auto-resolve a single test incident on this service so you can verify wiring in your timeline.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Integration Key (Routing Key)</label>
                    <input
                      type="text"
                      value={pdForm.routingKey}
                      onChange={e => setPdForm(prev => ({ ...prev, routingKey: e.target.value }))}
                      placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                      maxLength={32}
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>32 hex characters — found in PagerDuty service → Integrations.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Service Label (optional)</label>
                    <input
                      type="text"
                      value={pdForm.serviceName}
                      onChange={e => setPdForm(prev => ({ ...prev, serviceName: e.target.value }))}
                      placeholder="Myncel Alerts"
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Shown in incident summaries — purely cosmetic.</p>
                  </div>
                  {pdError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{pdError}</div>}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handlePagerDutySave} disabled={pdSaving}
                    className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
                    {pdSaving ? 'Connecting…' : 'Connect PagerDuty'}
                  </button>
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Microsoft Teams connect */}
            {modal.kind === 'ms_teams' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">👥</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connect Microsoft Teams</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Adaptive-card alerts via Incoming Webhook</p>
                  </div>
                </div>
                <div className="text-sm mb-5 rounded-lg p-3 border space-y-2" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  <p>To get a <strong>Webhook URL</strong>:</p>
                  <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                    <li>Open Microsoft Teams → pick the <strong>channel</strong> that should receive Myncel alerts.</li>
                    <li>Click the channel <strong>•••</strong> menu → <strong>Connectors</strong> (or <strong>Workflows</strong> on newer tenants).</li>
                    <li>Find <strong>Incoming Webhook</strong> → <strong>Configure</strong> → give it a name (e.g. "Myncel") and optionally upload an icon → <strong>Create</strong>.</li>
                    <li>Copy the URL that begins with <code className="text-[#635bff]">https://&lt;tenant&gt;.webhook.office.com/...</code> and paste it below.</li>
                  </ol>
                  <p className="text-xs">When you click Connect, Myncel will post a single confirmation adaptive card to that channel so you can verify wiring.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Webhook URL</label>
                    <textarea
                      value={teamsForm.webhookUrl}
                      onChange={e => setTeamsForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://yourtenant.webhook.office.com/webhookb2/..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Channel Label (optional)</label>
                    <input
                      type="text"
                      value={teamsForm.channelName}
                      onChange={e => setTeamsForm(prev => ({ ...prev, channelName: e.target.value }))}
                      placeholder="Myncel Alerts"
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  {teamsError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{teamsError}</div>}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleTeamsSave} disabled={teamsSaving}
                    className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
                    {teamsSaving ? 'Connecting…' : 'Connect Teams'}
                  </button>
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Webhooks info */}
            {modal.kind === 'webhooks' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🔗</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Webhook Endpoints</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Real-time event delivery</p>
                  </div>
                </div>
                <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                  Webhooks let you receive real-time HTTP POST notifications when events happen in Myncel.
                </p>
                <div className="rounded-lg p-4 border mb-5" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Available Events</p>
                  <div className="space-y-1">
                    {[
                      { event: 'work_order.created',     desc: 'A new work order is opened' },
                      { event: 'work_order.completed',   desc: 'A work order is marked done' },
                      { event: 'alert.triggered',        desc: 'An equipment alert fires' },
                      { event: 'machine.status_changed', desc: 'Equipment status changes' },
                      { event: 'pm.overdue',             desc: 'A preventive maintenance task is overdue' },
                    ].map(e => (
                      <div key={e.event} className="flex items-start gap-2">
                        <code className="text-xs font-mono text-[#635bff] flex-shrink-0">{e.event}</code>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— {e.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href="/settings/webhooks" onClick={() => setModal(null)}
                    className="flex-1 text-center bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors">
                    Manage Webhooks →
                  </Link>
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoped Export Modal — admin picks org + records for each integration action */}
      {scopeModal && (
        <ScopedExportModal
          open
          mode="admin"
          title={scopeModal.title}
          description={scopeModal.description}
          datasets={scopeModal.datasets}
          confirmLabel={scopeModal.confirmLabel}
          onClose={() => setScopeModal(null)}
          onConfirm={async ({ targetOrgId, targetOrgName, dataset, ids, allSelected }) => {
            const integration = scopeModal.integration;
            const payload: Record<string, any> = { targetOrgId };
            if (integration === 'quickbooks') {
              payload.dataset = scopeModal.qbDataset || 'invoices';
            } else if (integration === 'slack') {
              payload.mode = 'digest';
            } else {
              payload.dataset = dataset;
            }
            if (!allSelected && ids && ids.length > 0) {
              payload.ids = ids;
            }
            await handleExport(integration, payload);
            setScopeModal(null);
          }}
        />
      )}
    </div>
  );
}

export default function WrappedPage() {
  return (
    <PlanGate featureKey="feature.integrations.slack" featureName="Integrations" requiredPlan="STARTER">
      <IntegrationsPage />
    </PlanGate>
  );
}
