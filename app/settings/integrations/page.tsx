'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  connected: boolean;
  status?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (e) {
      console.error('Failed to fetch integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/connect`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.open(data.authUrl, '_blank');
        }
        fetchIntegrations();
      }
    } catch (e) {
      console.error('Failed to connect:', e);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    
    try {
      const res = await fetch(`/api/integrations/${integrationId}/disconnect`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchIntegrations();
      }
    } catch (e) {
      console.error('Failed to disconnect:', e);
    }
  };

  const defaultIntegrations: Integration[] = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get work order notifications and alerts in your Slack channels',
      icon: '💬',
      category: 'Communication',
      connected: false,
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync maintenance costs and parts purchases with QuickBooks',
      icon: '💰',
      category: 'Accounting',
      connected: false,
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect Myncel to 5,000+ apps and automate workflows',
      icon: '⚡',
      category: 'Automation',
      connected: false,
    },
    {
      id: 'twilio',
      name: 'SMS Notifications',
      description: 'Send work order alerts via SMS to your team',
      icon: '📱',
      category: 'Communication',
      connected: false,
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      description: 'Send real-time events to your own endpoints',
      icon: '🔗',
      category: 'Developer',
      connected: false,
    },
    {
      id: 'google_sheets',
      name: 'Google Sheets',
      description: 'Export reports and data to Google Sheets automatically',
      icon: '📊',
      category: 'Productivity',
      connected: false,
    },
  ];

  const displayIntegrations = integrations.length > 0 ? integrations : defaultIntegrations;

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[#0a2540]">Integrations</h1>
          <p className="text-[#425466] mt-1">Connect Myncel with your favorite tools</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1">
            <Link href="/settings" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Profile
            </Link>
            <Link href="/settings/security" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Security
            </Link>
            <Link href="/settings/team" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Team
            </Link>
            <Link href="/settings/notifications" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Notifications
            </Link>
            <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">
              Integrations
            </Link>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Connected */}
            {displayIntegrations.filter(i => i.connected).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[#8898aa] uppercase tracking-wide mb-3">Connected</h2>
                <div className="grid gap-4">
                  {displayIntegrations.filter(i => i.connected).map(integration => (
                    <div key={integration.id} className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{integration.icon}</span>
                          <div>
                            <h3 className="font-semibold text-[#0a2540]">{integration.name}</h3>
                            <p className="text-sm text-[#425466]">{integration.description}</p>
                            {integration.status && (
                              <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                {integration.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="px-4 py-2 text-sm border border-[#e6ebf1] rounded-lg text-[#425466] hover:bg-[#f6f9fc] transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available */}
            <div>
              <h2 className="text-sm font-semibold text-[#8898aa] uppercase tracking-wide mb-3">Available Integrations</h2>
              <div className="grid gap-4">
                {displayIntegrations.filter(i => !i.connected).map(integration => (
                  <div key={integration.id} className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{integration.icon}</span>
                        <div>
                          <h3 className="font-semibold text-[#0a2540]">{integration.name}</h3>
                          <p className="text-sm text-[#425466]">{integration.description}</p>
                          <span className="inline-block mt-1 text-xs bg-[#f0f4f8] text-[#425466] px-2 py-0.5 rounded-full">
                            {integration.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(integration.id)}
                        disabled={connecting === integration.id}
                        className="px-4 py-2 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                      >
                        {connecting === integration.id ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API Keys */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-5">
              <h2 className="font-semibold text-[#0a2540] mb-2">API Keys</h2>
              <p className="text-sm text-[#425466] mb-4">Generate API keys to integrate with your own applications.</p>
              <button className="px-4 py-2 text-sm bg-[#0a2540] text-white rounded-lg hover:bg-[#1e3a5f] transition-colors">
                Generate API Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}