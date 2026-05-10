'use client';

import { useState, useEffect } from 'react';

export interface PlatformSettings {
  // Payment gateways
  paymentStripeEnabled: boolean;
  paymentPaypalEnabled: boolean;
  paymentAchEnabled: boolean;
  paymentApplePayEnabled: boolean;
  paymentGooglePayEnabled: boolean;

  // Features
  featureIotEnabled: boolean;
  featureChatEnabled: boolean;
  featureApiEnabled: boolean;
  featureWebhooksEnabled: boolean;
  featureQrEnabled: boolean;
  featureHmiEnabled: boolean;
  featureReportsEnabled: boolean;
  featurePartsEnabled: boolean;
  featureMaintenanceEnabled: boolean;
  featureIntegrationsEnabled: boolean;

  // Security
  security2faRequired: boolean;
  securityInviteOnlyEnabled: boolean;
  securitySessionTimeout: number;

  // Platform
  platformMaintenanceMode: boolean;
  platformNewSignupsEnabled: boolean;
  platformTrialDays: number;
  platformMaxOrgsPerUser: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  paymentStripeEnabled: true,
  paymentPaypalEnabled: true,
  paymentAchEnabled: true,
  paymentApplePayEnabled: true,
  paymentGooglePayEnabled: true,
  featureIotEnabled: true,
  featureChatEnabled: true,
  featureApiEnabled: true,
  featureWebhooksEnabled: true,
  featureQrEnabled: true,
  featureHmiEnabled: true,
  featureReportsEnabled: true,
  featurePartsEnabled: true,
  featureMaintenanceEnabled: true,
  featureIntegrationsEnabled: true,
  security2faRequired: false,
  securityInviteOnlyEnabled: false,
  securitySessionTimeout: 24,
  platformMaintenanceMode: false,
  platformNewSignupsEnabled: true,
  platformTrialDays: 14,
  platformMaxOrgsPerUser: 5,
};

// Map from API key names to camelCase property names
const KEY_MAP: Record<string, keyof PlatformSettings> = {
  'payment.stripe.enabled': 'paymentStripeEnabled',
  'payment.paypal.enabled': 'paymentPaypalEnabled',
  'payment.ach.enabled': 'paymentAchEnabled',
  'payment.applepay.enabled': 'paymentApplePayEnabled',
  'payment.googlepay.enabled': 'paymentGooglePayEnabled',
  'feature.iot.enabled': 'featureIotEnabled',
  'feature.chat.enabled': 'featureChatEnabled',
  'feature.api.enabled': 'featureApiEnabled',
  'feature.webhooks.enabled': 'featureWebhooksEnabled',
  'feature.qr.enabled': 'featureQrEnabled',
  'feature.hmi.enabled': 'featureHmiEnabled',
  'feature.reports.enabled': 'featureReportsEnabled',
  'feature.parts.enabled': 'featurePartsEnabled',
  'feature.maintenance.enabled': 'featureMaintenanceEnabled',
  'feature.integrations.enabled': 'featureIntegrationsEnabled',
  'security.2fa.required': 'security2faRequired',
  'security.inviteOnly.enabled': 'securityInviteOnlyEnabled',
  'security.sessionTimeout': 'securitySessionTimeout',
  'platform.maintenanceMode': 'platformMaintenanceMode',
  'platform.newSignups.enabled': 'platformNewSignupsEnabled',
  'platform.trialDays': 'platformTrialDays',
  'platform.maxOrgsPerUser': 'platformMaxOrgsPerUser',
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data?.settings) {
          const mapped: Partial<PlatformSettings> = {};
          for (const [key, val] of Object.entries(data.settings)) {
            const propName = KEY_MAP[key];
            if (propName) {
              // Admin gets { value, group, label, fromDb }, public gets flat values
              const value = typeof val === 'object' && val !== null && 'value' in val
                ? (val as any).value
                : val;
              (mapped as any)[propName] = value;
            }
          }
          setSettings(prev => ({ ...prev, ...mapped }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}