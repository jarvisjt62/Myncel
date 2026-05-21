'use client';

import { useState, useEffect } from 'react';
import { NotificationSkeleton } from '@/app/components/LoadingSkeleton';
import { fetchWithCache, invalidateCache } from '@/app/lib/client-cache';

// Full international country code list (E.164)
const COUNTRY_CODES = [
  { code: '+1',    flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+7',    flag: '🇷🇺', name: 'Russia / Kazakhstan' },
  { code: '+20',   flag: '🇪🇬', name: 'Egypt' },
  { code: '+27',   flag: '🇿🇦', name: 'South Africa' },
  { code: '+30',   flag: '🇬🇷', name: 'Greece' },
  { code: '+31',   flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32',   flag: '🇧🇪', name: 'Belgium' },
  { code: '+33',   flag: '🇫🇷', name: 'France' },
  { code: '+34',   flag: '🇪🇸', name: 'Spain' },
  { code: '+36',   flag: '🇭🇺', name: 'Hungary' },
  { code: '+39',   flag: '🇮🇹', name: 'Italy' },
  { code: '+40',   flag: '🇷🇴', name: 'Romania' },
  { code: '+41',   flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',   flag: '🇦🇹', name: 'Austria' },
  { code: '+44',   flag: '🇬🇧', name: 'UK' },
  { code: '+45',   flag: '🇩🇰', name: 'Denmark' },
  { code: '+46',   flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',   flag: '🇳🇴', name: 'Norway' },
  { code: '+48',   flag: '🇵🇱', name: 'Poland' },
  { code: '+49',   flag: '🇩🇪', name: 'Germany' },
  { code: '+51',   flag: '🇵🇪', name: 'Peru' },
  { code: '+52',   flag: '🇲🇽', name: 'Mexico' },
  { code: '+54',   flag: '🇦🇷', name: 'Argentina' },
  { code: '+55',   flag: '🇧🇷', name: 'Brazil' },
  { code: '+56',   flag: '🇨🇱', name: 'Chile' },
  { code: '+57',   flag: '🇨🇴', name: 'Colombia' },
  { code: '+58',   flag: '🇻🇪', name: 'Venezuela' },
  { code: '+60',   flag: '🇲🇾', name: 'Malaysia' },
  { code: '+61',   flag: '🇦🇺', name: 'Australia' },
  { code: '+62',   flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',   flag: '🇵🇭', name: 'Philippines' },
  { code: '+65',   flag: '🇸🇬', name: 'Singapore' },
  { code: '+66',   flag: '🇹🇭', name: 'Thailand' },
  { code: '+81',   flag: '🇯🇵', name: 'Japan' },
  { code: '+82',   flag: '🇰🇷', name: 'South Korea' },
  { code: '+84',   flag: '🇻🇳', name: 'Vietnam' },
  { code: '+86',   flag: '🇨🇳', name: 'China' },
  { code: '+90',   flag: '🇹🇷', name: 'Turkey' },
  { code: '+91',   flag: '🇮🇳', name: 'India' },
  { code: '+92',   flag: '🇵🇰', name: 'Pakistan' },
  { code: '+93',   flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+94',   flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+95',   flag: '🇲🇲', name: 'Myanmar' },
  { code: '+98',   flag: '🇮🇷', name: 'Iran' },
  { code: '+212',  flag: '🇲🇦', name: 'Morocco' },
  { code: '+213',  flag: '🇩🇿', name: 'Algeria' },
  { code: '+216',  flag: '🇹🇳', name: 'Tunisia' },
  { code: '+218',  flag: '🇱🇾', name: 'Libya' },
  { code: '+220',  flag: '🇬🇲', name: 'Gambia' },
  { code: '+221',  flag: '🇸🇳', name: 'Senegal' },
  { code: '+222',  flag: '🇲🇷', name: 'Mauritania' },
  { code: '+223',  flag: '🇲🇱', name: 'Mali' },
  { code: '+224',  flag: '🇬🇳', name: 'Guinea' },
  { code: '+225',  flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+226',  flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+227',  flag: '🇳🇪', name: 'Niger' },
  { code: '+228',  flag: '🇹🇬', name: 'Togo' },
  { code: '+229',  flag: '🇧🇯', name: 'Benin' },
  { code: '+230',  flag: '🇲🇺', name: 'Mauritius' },
  { code: '+231',  flag: '🇱🇷', name: 'Liberia' },
  { code: '+232',  flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '+233',  flag: '🇬🇭', name: 'Ghana' },
  { code: '+234',  flag: '🇳🇬', name: 'Nigeria' },
  { code: '+235',  flag: '🇹🇩', name: 'Chad' },
  { code: '+236',  flag: '🇨🇫', name: 'Central African Rep.' },
  { code: '+237',  flag: '🇨🇲', name: 'Cameroon' },
  { code: '+238',  flag: '🇨🇻', name: 'Cape Verde' },
  { code: '+240',  flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: '+241',  flag: '🇬🇦', name: 'Gabon' },
  { code: '+242',  flag: '🇨🇬', name: 'Congo' },
  { code: '+243',  flag: '🇨🇩', name: 'DR Congo' },
  { code: '+244',  flag: '🇦🇴', name: 'Angola' },
  { code: '+245',  flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: '+248',  flag: '🇸🇨', name: 'Seychelles' },
  { code: '+249',  flag: '🇸🇩', name: 'Sudan' },
  { code: '+250',  flag: '🇷🇼', name: 'Rwanda' },
  { code: '+251',  flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+252',  flag: '🇸🇴', name: 'Somalia' },
  { code: '+253',  flag: '🇩🇯', name: 'Djibouti' },
  { code: '+254',  flag: '🇰🇪', name: 'Kenya' },
  { code: '+255',  flag: '🇹🇿', name: 'Tanzania' },
  { code: '+256',  flag: '🇺🇬', name: 'Uganda' },
  { code: '+257',  flag: '🇧🇮', name: 'Burundi' },
  { code: '+258',  flag: '🇲🇿', name: 'Mozambique' },
  { code: '+260',  flag: '🇿🇲', name: 'Zambia' },
  { code: '+261',  flag: '🇲🇬', name: 'Madagascar' },
  { code: '+263',  flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+264',  flag: '🇳🇦', name: 'Namibia' },
  { code: '+265',  flag: '🇲🇼', name: 'Malawi' },
  { code: '+266',  flag: '🇱🇸', name: 'Lesotho' },
  { code: '+267',  flag: '🇧🇼', name: 'Botswana' },
  { code: '+268',  flag: '🇸🇿', name: 'Eswatini' },
  { code: '+269',  flag: '🇰🇲', name: 'Comoros' },
  { code: '+290',  flag: '🇸🇭', name: 'Saint Helena' },
  { code: '+297',  flag: '🇦🇼', name: 'Aruba' },
  { code: '+298',  flag: '🇫🇴', name: 'Faroe Islands' },
  { code: '+299',  flag: '🇬🇱', name: 'Greenland' },
  { code: '+351',  flag: '🇵🇹', name: 'Portugal' },
  { code: '+352',  flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+353',  flag: '🇮🇪', name: 'Ireland' },
  { code: '+354',  flag: '🇮🇸', name: 'Iceland' },
  { code: '+355',  flag: '🇦🇱', name: 'Albania' },
  { code: '+356',  flag: '🇲🇹', name: 'Malta' },
  { code: '+357',  flag: '🇨🇾', name: 'Cyprus' },
  { code: '+358',  flag: '🇫🇮', name: 'Finland' },
  { code: '+359',  flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+370',  flag: '🇱🇹', name: 'Lithuania' },
  { code: '+371',  flag: '🇱🇻', name: 'Latvia' },
  { code: '+372',  flag: '🇪🇪', name: 'Estonia' },
  { code: '+373',  flag: '🇲🇩', name: 'Moldova' },
  { code: '+374',  flag: '🇦🇲', name: 'Armenia' },
  { code: '+375',  flag: '🇧🇾', name: 'Belarus' },
  { code: '+376',  flag: '🇦🇩', name: 'Andorra' },
  { code: '+380',  flag: '🇺🇦', name: 'Ukraine' },
  { code: '+381',  flag: '🇷🇸', name: 'Serbia' },
  { code: '+382',  flag: '🇲🇪', name: 'Montenegro' },
  { code: '+385',  flag: '🇭🇷', name: 'Croatia' },
  { code: '+386',  flag: '🇸🇮', name: 'Slovenia' },
  { code: '+387',  flag: '🇧🇦', name: 'Bosnia & Herzegovina' },
  { code: '+389',  flag: '🇲🇰', name: 'North Macedonia' },
  { code: '+420',  flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+421',  flag: '🇸🇰', name: 'Slovakia' },
  { code: '+423',  flag: '🇱🇮', name: 'Liechtenstein' },
  { code: '+500',  flag: '🇫🇰', name: 'Falkland Islands' },
  { code: '+502',  flag: '🇬🇹', name: 'Guatemala' },
  { code: '+503',  flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504',  flag: '🇭🇳', name: 'Honduras' },
  { code: '+505',  flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+506',  flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507',  flag: '🇵🇦', name: 'Panama' },
  { code: '+509',  flag: '🇭🇹', name: 'Haiti' },
  { code: '+590',  flag: '🇬🇵', name: 'Guadeloupe' },
  { code: '+591',  flag: '🇧🇴', name: 'Bolivia' },
  { code: '+592',  flag: '🇬🇾', name: 'Guyana' },
  { code: '+593',  flag: '🇪🇨', name: 'Ecuador' },
  { code: '+595',  flag: '🇵🇾', name: 'Paraguay' },
  { code: '+597',  flag: '🇸🇷', name: 'Suriname' },
  { code: '+598',  flag: '🇺🇾', name: 'Uruguay' },
  { code: '+599',  flag: '🇨🇼', name: 'Curaçao' },
  { code: '+670',  flag: '🇹🇱', name: 'Timor-Leste' },
  { code: '+673',  flag: '🇧🇳', name: 'Brunei' },
  { code: '+675',  flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: '+676',  flag: '🇹🇴', name: 'Tonga' },
  { code: '+677',  flag: '🇸🇧', name: 'Solomon Islands' },
  { code: '+678',  flag: '🇻🇺', name: 'Vanuatu' },
  { code: '+679',  flag: '🇫🇯', name: 'Fiji' },
  { code: '+680',  flag: '🇵🇼', name: 'Palau' },
  { code: '+682',  flag: '🇨🇰', name: 'Cook Islands' },
  { code: '+685',  flag: '🇼🇸', name: 'Samoa' },
  { code: '+686',  flag: '🇰🇮', name: 'Kiribati' },
  { code: '+688',  flag: '🇹🇻', name: 'Tuvalu' },
  { code: '+689',  flag: '🇵🇫', name: 'French Polynesia' },
  { code: '+690',  flag: '🇹🇰', name: 'Tokelau' },
  { code: '+691',  flag: '🇫🇲', name: 'Micronesia' },
  { code: '+692',  flag: '🇲🇭', name: 'Marshall Islands' },
  { code: '+850',  flag: '🇰🇵', name: 'North Korea' },
  { code: '+852',  flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+853',  flag: '🇲🇴', name: 'Macau' },
  { code: '+855',  flag: '🇰🇭', name: 'Cambodia' },
  { code: '+856',  flag: '🇱🇦', name: 'Laos' },
  { code: '+880',  flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+886',  flag: '🇹🇼', name: 'Taiwan' },
  { code: '+960',  flag: '🇲🇻', name: 'Maldives' },
  { code: '+961',  flag: '🇱🇧', name: 'Lebanon' },
  { code: '+962',  flag: '🇯🇴', name: 'Jordan' },
  { code: '+963',  flag: '🇸🇾', name: 'Syria' },
  { code: '+964',  flag: '🇮🇶', name: 'Iraq' },
  { code: '+965',  flag: '🇰🇼', name: 'Kuwait' },
  { code: '+966',  flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+967',  flag: '🇾🇪', name: 'Yemen' },
  { code: '+968',  flag: '🇴🇲', name: 'Oman' },
  { code: '+970',  flag: '🇵🇸', name: 'Palestine' },
  { code: '+971',  flag: '🇦🇪', name: 'UAE' },
  { code: '+972',  flag: '🇮🇱', name: 'Israel' },
  { code: '+973',  flag: '🇧🇭', name: 'Bahrain' },
  { code: '+974',  flag: '🇶🇦', name: 'Qatar' },
  { code: '+975',  flag: '🇧🇹', name: 'Bhutan' },
  { code: '+976',  flag: '🇲🇳', name: 'Mongolia' },
  { code: '+977',  flag: '🇳🇵', name: 'Nepal' },
  { code: '+992',  flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+993',  flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+994',  flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+995',  flag: '🇬🇪', name: 'Georgia' },
  { code: '+996',  flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+998',  flag: '🇺🇿', name: 'Uzbekistan' },
];

/** Normalise any phone input to E.164. Strips spaces/dashes/parens.
 *  If the number already starts with + it is returned as-is (after stripping whitespace).
 *  If it starts with 00 that is treated as the international prefix.
 *  Otherwise the supplied countryCode is prepended, stripping a leading 0 if present. */
function toE164(raw: string, countryCode: string): string {
  let n = raw.trim().replace(/[\s()\-\.]/g, '');
  if (n.startsWith('+')) return n;
  if (n.startsWith('00')) return '+' + n.slice(2);
  if (n.startsWith('0')) n = n.slice(1);
  return countryCode + n;
}

/** Given a full E.164 number, try to find the matching country-code entry. */
function splitE164(e164: string): { code: string; local: string } {
  // Try longest prefix first
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (e164.startsWith(c.code)) {
      return { code: c.code, local: e164.slice(c.code.length) };
    }
  }
  return { code: '+1', local: e164.replace(/^\+/, '') };
}

interface NotificationSettings {
  emailWorkOrders: boolean;
  emailAlerts: boolean;
  emailReports: boolean;
  emailDigest: string;
  smsEnabled: boolean;
  smsWorkOrders: boolean;
  smsAlerts: boolean;
  smsCriticalOnly: boolean;
  phoneNumber: string;
  slackEnabled: boolean;
  slackWorkOrders: boolean;
  slackAlerts: boolean;
  slackChannel: string;
  // Push channels
  pushEnabled: boolean;
  pushWorkOrders: boolean;
  pushAlerts: boolean;
  pushEmergency: boolean;
  pushMaintenance: boolean;
  pushParts: boolean;
  pushRemoteSupport: boolean;
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
}

interface Capabilities {
  email: boolean;
  slack: boolean;
  sms: boolean;
  smsPlatformManaged?: boolean;
  slackPlatformManaged?: boolean;
}

function Toggle({ checked, onChange, disabled }: { 
  checked: boolean; 
  onChange?: () => void; 
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-[#635bff]' : 'bg-gray-200'
        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailWorkOrders: true, emailAlerts: true, emailReports: true, emailDigest: 'WEEKLY',
    smsEnabled: false, smsWorkOrders: false, smsAlerts: false, smsCriticalOnly: true, phoneNumber: '',
    slackEnabled: false, slackWorkOrders: false, slackAlerts: false, slackChannel: '',
    pushEnabled: true, pushWorkOrders: true, pushAlerts: true, pushEmergency: true,
    pushMaintenance: true, pushParts: true, pushRemoteSupport: true,
    quietHoursEnabled: false, quietHoursStart: '22:00', quietHoursEnd: '07:00',
    quietHoursTimezone: 'America/New_York',
  });
  // Country code selector state — split from the local number
  const [countryCode, setCountryCode] = useState('+1');
  const [localNumber, setLocalNumber] = useState('');
  const [capabilities, setCapabilities] = useState<Capabilities>({ email: true, slack: false, sms: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async (useCache = true) => {
    try {
      const data = await fetchWithCache(
        'notifications',
        async () => {
          const res = await fetch('/api/settings/notifications');
          if (res.ok) {
            const json = await res.json();
            return {
              settings: json.settings,
              capabilities: json.capabilities,
              isAdmin: json.isAdmin,
            };
          }
          return {};
        },
        { staleWhileRevalidate: useCache }
      );
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
        // Split stored E.164 number back into country code + local number
        if (data.settings.phoneNumber) {
          const { code, local } = splitE164(data.settings.phoneNumber);
          setCountryCode(code);
          setLocalNumber(local);
        }
      }
      if (data.capabilities) setCapabilities(data.capabilities);
      if (data.isAdmin !== undefined) setIsAdmin(data.isAdmin);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    // Build the full E.164 number from country code + local number
    const fullE164 = localNumber.trim() ? toE164(localNumber, countryCode) : '';

    // Validate: if SMS is enabled, phone number must be provided
    if (settings.smsEnabled && !fullE164) {
      setSaveError('Please select your country and enter your phone number to receive SMS alerts.');
      return;
    }
    // Validate E.164 format
    if (fullE164 && !/^\+\d{7,15}$/.test(fullE164)) {
      setSaveError('Phone number looks invalid. Please enter only digits after selecting your country code.');
      return;
    }

    setSaveError('');
    setSaving(true);
    try {
      const payload = {
        ...settings,
        phoneNumber: fullE164 || null,
      };
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        invalidateCache('notifications');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || 'Failed to save notification settings.');
      }
    } catch (e) {
      console.error('Failed to save:', e);
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return <NotificationSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isAdmin 
            ? 'Configure notification settings for the entire platform.'
            : 'Configure your organization\'s notification preferences.'
          }
        </p>
      </div>

      {/* Email */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>📧 Email Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'emailWorkOrders' as const, label: 'Work Order Updates', desc: 'Get notified when work orders are assigned or completed' },
            { key: 'emailAlerts' as const,     label: 'Alerts',             desc: 'Critical alerts and maintenance reminders' },
            { key: 'emailReports' as const,    label: 'Reports',            desc: 'Summary of maintenance activity and metrics' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
              <Toggle 
                checked={settings[item.key] as boolean} 
                onChange={() => toggle(item.key)}
              />
            </div>
          ))}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email Digest Frequency</label>
            <select
              value={settings.emailDigest}
              onChange={e => setSettings(prev => ({ ...prev, emailDigest: e.target.value }))}
              className="w-full max-w-xs rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="NEVER">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* SMS */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>📱 SMS Notifications</h3>
          {!capabilities.sms && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">SMS unavailable</span>
          )}
        </div>
        <div className="space-y-4">
          {/* SMS Opt-in Consent Block */}
          <div className="rounded-lg border p-4" style={{ background: 'var(--bg-page, #f6f9fc)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>📲 Enable SMS Text Message Notifications</p>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              By enabling SMS notifications and entering your phone number below, you agree to receive automated text messages from <strong>Myncel</strong> at the number provided. Messages may include work order updates, critical equipment alerts, and maintenance reminders.
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Message frequency varies based on your settings. Message and data rates may apply. Reply <strong>HELP</strong> for help. Reply <strong>STOP</strong> at any time to unsubscribe and stop receiving SMS messages.
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted, #8898aa)' }}>
              By enabling SMS, you consent to receiving text messages as described above. This consent is separate from our{' '}
              <a href="/privacy" className="underline" style={{ color: 'var(--color-primary, #635bff)' }}>Privacy Policy</a>{' '}
              and{' '}
              <a href="/terms" className="underline" style={{ color: 'var(--color-primary, #635bff)' }}>Terms of Service</a>.
            </p>
            {capabilities.smsPlatformManaged && (
              <div className="mt-3 rounded-lg px-3 py-2 text-xs flex items-start gap-2" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                <span className="flex-shrink-0 mt-0.5">ℹ️</span>
                <span>SMS is powered by your platform admin's Twilio configuration. No additional credentials needed — just toggle on and enter your phone number.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                I agree to receive SMS text message notifications from Myncel
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Toggle on to opt in to SMS alerts. Reply STOP to unsubscribe at any time.
              </p>
            </div>
            <Toggle
              checked={settings.smsEnabled}
              onChange={() => {
                const newVal = !settings.smsEnabled;
                setSettings(prev => ({
                  ...prev,
                  smsEnabled: newVal,
                  // When opting in, also enable SMS work orders and alerts automatically
                  smsWorkOrders: newVal ? true : prev.smsWorkOrders,
                  smsAlerts: newVal ? true : prev.smsAlerts,
                }));
              }}
              disabled={!capabilities.sms}
            />
          </div>

          {settings.smsEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Mobile Phone Number</label>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Select your country then enter your number without the leading 0. Standard messaging rates apply.
                </p>
                <div className="flex gap-2 max-w-sm">
                  {/* Country code dropdown */}
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    className="rounded-lg px-2 py-2 text-sm focus:outline-none flex-shrink-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', minWidth: '140px' }}
                  >
                    {/* Render alphabetically by country name so users can scan quickly */}
                    {[...COUNTRY_CODES]
                      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                      .map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.code})
                        </option>
                      ))}
                  </select>
                  {/* Local number input */}
                  <input
                    type="tel"
                    value={localNumber}
                    onChange={e => setLocalNumber(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                    placeholder="801 234 5678"
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
                {localNumber.trim() && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Will be saved as: <strong>{toE164(localNumber, countryCode)}</strong>
                  </p>
                )}
                {settings.smsEnabled && !localNumber.trim() && (
                  <p className="text-xs mt-1.5" style={{ color: '#dc2626' }}>
                    ⚠️ Phone number is required to receive SMS alerts.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Work Order SMS Alerts</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Receive a text message when work orders are assigned or updated</p>
                </div>
                <Toggle
                  checked={settings.smsWorkOrders}
                  onChange={() => toggle('smsWorkOrders')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Equipment Alert SMS</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Receive a text message for equipment alerts and overdue maintenance</p>
                </div>
                <Toggle
                  checked={settings.smsAlerts}
                  onChange={() => toggle('smsAlerts')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Critical Alerts Only</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Only send SMS for CRITICAL and HIGH priority equipment alerts (filters the alerts above)</p>
                </div>
                <Toggle
                  checked={settings.smsCriticalOnly}
                  onChange={() => toggle('smsCriticalOnly')}
                />
              </div>

              {/* What you'll receive box */}
              <div className="rounded-lg border p-4 mt-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-page, #f6f9fc)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Example SMS messages you may receive:</p>
                <div className="space-y-2">
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                    [Myncel] Work Order #142 assigned to you: "Replace conveyor belt — Machine CNC-03". Reply STOP to unsubscribe.
                  </div>
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#fff3e0', color: '#e65100' }}>
                    [Myncel] CRITICAL ALERT: Temperature on Boiler #2 exceeded threshold (185°F). Check dashboard immediately. Reply STOP to opt out.
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted, #8898aa)' }}>
                  Msg frequency varies. Msg &amp; data rates may apply. Text HELP to (844) 994-1183 for help. Text STOP to unsubscribe.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slack */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>💬 Slack Notifications</h3>
          {!capabilities.slack && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Slack unavailable</span>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable Slack</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Post notifications to a Slack channel</p>
            </div>
            <Toggle 
              checked={settings.slackEnabled} 
              onChange={() => toggle('slackEnabled')} 
              disabled={!capabilities.slack}
            />
          </div>
          {settings.slackEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Work Order Notifications</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Post work order updates to Slack</p>
                </div>
                <Toggle 
                  checked={settings.slackWorkOrders} 
                  onChange={() => toggle('slackWorkOrders')}
                />
              </div>
              {!capabilities.slackPlatformManaged && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Slack Channel</label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Enter the Slack channel for your organization's notifications</p>
                  <input
                    type="text"
                    value={settings.slackChannel || ''}
                    onChange={e => setSettings(prev => ({ ...prev, slackChannel: e.target.value }))}
                    placeholder="#maintenance"
                    className="w-full max-w-xs rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Push notifications */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>📱 Push Notifications</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Mobile + Web</span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Push notifications are delivered to the Myncel mobile app on iOS and Android, and to web browsers that have granted notification permission. Emergency alerts always bypass quiet hours.
        </p>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable push notifications</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Master switch — turn off to silence all push notifications.</p>
          </div>
          <Toggle checked={settings.pushEnabled} onChange={() => toggle('pushEnabled')} />
        </div>

        {settings.pushEnabled && (
          <div className="mt-3 space-y-2">
            {[
              { key: 'pushWorkOrders' as const,    label: 'Work Order Updates',     desc: 'Assignments, completions, and overdue work orders' },
              { key: 'pushMaintenance' as const,   label: 'Maintenance Reminders',  desc: 'Scheduled tasks coming due and overdue' },
              { key: 'pushAlerts' as const,        label: 'Equipment Alerts',       desc: 'Sensor thresholds, breakdowns, and other machine alerts' },
              { key: 'pushParts' as const,         label: 'Low / Out of Stock Parts', desc: 'Inventory dropped to or below the reorder point' },
              { key: 'pushRemoteSupport' as const, label: 'Remote Support Reminders', desc: 'Notifications when a remote session is starting soon' },
              { key: 'pushEmergency' as const,     label: 'Emergency Alerts',       desc: 'Urgent broadcasts from your administrators (always bypass quiet hours)' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
                <Toggle
                  checked={settings[item.key]}
                  onChange={() => toggle(item.key)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiet hours */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>🌙 Quiet Hours</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Silence non-emergency push notifications during a daily window — for example, overnight. Emergency alerts always come through.
        </p>

        <div className="flex items-center justify-between p-3 rounded-lg mb-3" style={{ background: 'var(--surface-2)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable quiet hours</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Hold all non-emergency pushes during the window below.</p>
          </div>
          <Toggle checked={settings.quietHoursEnabled} onChange={() => toggle('quietHoursEnabled')} />
        </div>

        {settings.quietHoursEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Start</label>
              <input
                type="time"
                value={settings.quietHoursStart}
                onChange={e => setSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>End</label>
              <input
                type="time"
                value={settings.quietHoursEnd}
                onChange={e => setSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Time zone</label>
              <select
                value={settings.quietHoursTimezone}
                onChange={e => setSettings(prev => ({ ...prev, quietHoursTimezone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="America/New_York">Eastern (New York)</option>
                <option value="America/Chicago">Central (Chicago)</option>
                <option value="America/Denver">Mountain (Denver)</option>
                <option value="America/Phoenix">Mountain — no DST (Phoenix)</option>
                <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                <option value="America/Anchorage">Alaska</option>
                <option value="Pacific/Honolulu">Hawaii</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
            <div className="sm:col-span-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              💡 Window can wrap midnight (e.g. 22:00 → 07:00). Emergency broadcasts from your administrators will always come through.
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-4">
        {saveError && <span className="text-sm text-red-600">⚠️ {saveError}</span>}
        {saved && <span className="text-sm text-emerald-600">✓ Settings saved successfully!</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#635bff] text-white rounded-lg font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors text-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}