// Platform-wide admin settings — defaults used when no DB record exists
export const DEFAULT_SETTINGS: Record<string, { value: any; group: string; label: string }> = {
  // Payment Gateways
  'payment.stripe.enabled':   { value: true,  group: 'payment',  label: 'Stripe (Credit/Debit Card)' },
  'payment.paypal.enabled':   { value: true,  group: 'payment',  label: 'PayPal' },
  'payment.ach.enabled':      { value: true,  group: 'payment',  label: 'ACH Bank Transfer' },
  'payment.applepay.enabled': { value: true,  group: 'payment',  label: 'Apple Pay' },
  'payment.googlepay.enabled':{ value: true,  group: 'payment',  label: 'Google Pay' },

  // Platform Features
  'feature.iot.enabled':          { value: true,  group: 'feature', label: 'IoT Sensor Integration' },
  'feature.chat.enabled':         { value: true,  group: 'feature', label: 'Live Chat Support' },
  'feature.api.enabled':          { value: true,  group: 'feature', label: 'Public API Access' },
  'feature.webhooks.enabled':     { value: true,  group: 'feature', label: 'Webhooks' },
  'feature.qr.enabled':           { value: true,  group: 'feature', label: 'QR Code Labels' },
  'feature.hmi.enabled':          { value: true,  group: 'feature', label: 'HMI Monitor' },
  'feature.reports.enabled':      { value: true,  group: 'feature', label: 'Reports & Analytics' },
  'feature.parts.enabled':        { value: true,  group: 'feature', label: 'Parts Inventory' },
  'feature.maintenance.enabled':  { value: true,  group: 'feature', label: 'Preventive Maintenance' },
  'feature.integrations.enabled': { value: true,  group: 'feature', label: 'Third-Party Integrations' },

  // Security
  'security.2fa.required':       { value: false, group: 'security', label: 'Require 2FA for all users' },
  'security.inviteOnly.enabled': { value: false, group: 'security', label: 'Invite-only registration' },
  'security.sessionTimeout':     { value: 24,    group: 'security', label: 'Session timeout (hours)' },

  // Platform
  'platform.maintenanceMode':    { value: false, group: 'platform', label: 'Maintenance Mode' },
  'platform.newSignups.enabled': { value: true,  group: 'platform', label: 'Allow new sign-ups' },
  'platform.trialDays':          { value: 14,    group: 'platform', label: 'Trial period (days)' },
  'platform.maxOrgsPerUser':     { value: 5,     group: 'platform', label: 'Max orgs per user' },
};