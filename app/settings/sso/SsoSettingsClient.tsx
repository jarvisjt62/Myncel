'use client';

/**
 * SSO & SCIM settings page (admin / owner only).
 *
 * Three sections:
 *   1. SAML 2.0 SSO — IdP entity ID, SSO URL, certificate, attribute
 *      mappings, default role, enable/enforce switches.
 *   2. Connection details — copy-paste URLs the customer needs to put
 *      into their IdP (Entity ID, ACS URL, Metadata URL).
 *   3. SCIM 2.0 provisioning — list + mint + revoke bearer tokens.
 *
 * Mobile responsiveness: all forms use grid that collapses to single
 * column under sm: breakpoint; copy-buttons use truncated text.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SsoConfigRow {
  id: string;
  enabled: boolean;
  enforced: boolean;
  idpEntityId: string;
  idpSsoUrl: string;
  idpCertificate: string;
  nameIdFormat: string | null;
  emailAttribute: string | null;
  firstNameAttribute: string | null;
  lastNameAttribute: string | null;
  groupsAttribute: string | null;
  defaultRole: 'OWNER' | 'ADMIN' | 'TECHNICIAN' | 'OPERATOR' | 'EMPLOYEE' | 'MEMBER';
}

interface ScimTokenRow {
  id: string;
  label: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface SpUrls {
  entityId: string;
  acsUrl: string;
  metadataUrl: string;
  loginUrl: string;
  scimBaseUrl: string;
}

interface Props {
  org: { id: string; slug: string; name: string };
  initialConfig: SsoConfigRow | null;
  initialTokens: ScimTokenRow[];
  spUrls: SpUrls;
}

export default function SsoSettingsClient({
  org,
  initialConfig,
  initialTokens,
  spUrls,
}: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<Partial<SsoConfigRow>>(
    initialConfig || {
      enabled: false,
      enforced: false,
      idpEntityId: '',
      idpSsoUrl: '',
      idpCertificate: '',
      nameIdFormat: '',
      emailAttribute: '',
      firstNameAttribute: '',
      lastNameAttribute: '',
      groupsAttribute: '',
      defaultRole: 'MEMBER',
    }
  );
  const [tokens, setTokens] = useState<ScimTokenRow[]>(initialTokens);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState('SCIM token');
  const [newToken, setNewToken] = useState<string | null>(null);

  const saveConfig = async () => {
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      const res = await fetch('/api/sso/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveErr(data.error || 'Failed to save');
      } else {
        setSaveMsg('Saved.');
        setConfig(data.config);
        router.refresh();
      }
    } catch (err: any) {
      setSaveErr(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const mintToken = async () => {
    setNewToken(null);
    try {
      const res = await fetch('/api/sso/scim-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: tokenLabel || 'SCIM token' }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to mint token');
        return;
      }
      setNewToken(data.token);
      setTokens((prev) => [
        {
          id: data.id,
          label: data.label,
          prefix: data.prefix,
          createdAt: data.createdAt,
          lastUsedAt: null,
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err?.message || 'Failed to mint token');
    }
  };

  const revokeToken = async (id: string) => {
    if (!confirm('Revoke this SCIM token? The IdP will stop being able to provision users until you mint a new one.')) return;
    try {
      const res = await fetch(`/api/sso/scim-tokens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
      }
    } catch { /* swallow */ }
  };

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">🔐 SSO &amp; SCIM</h1>
        <p className="mt-1 text-sm text-gray-600">
          Connect <span className="font-semibold">{org.name}</span> to your identity provider (Okta, Azure AD,
          Google Workspace, OneLogin, JumpCloud, …) for SAML 2.0 single sign-on and SCIM 2.0 user
          auto-provisioning. See the Handbook → Integrations chapter for IdP-specific setup.
        </p>
      </header>

      {/* Section 1: SP-side URLs */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Service-Provider URLs</h2>
        <p className="mt-1 text-sm text-gray-600">
          Paste these into your IdP&rsquo;s SAML / SCIM configuration screen.
        </p>
        <dl className="mt-4 divide-y divide-gray-100">
          {[
            ['SP Entity ID / Audience', spUrls.entityId],
            ['ACS / Reply URL', spUrls.acsUrl],
            ['SP Metadata URL (XML)', spUrls.metadataUrl],
            ['Sign-in URL (for IdP-initiated tests)', spUrls.loginUrl],
            ['SCIM 2.0 Base URL', spUrls.scimBaseUrl],
          ].map(([label, url]) => (
            <div key={label} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-700">{label}</dt>
              <dd className="sm:col-span-2 flex items-center gap-2 min-w-0">
                <code className="block flex-1 truncate rounded bg-gray-50 px-2 py-1 text-xs text-gray-800">
                  {url}
                </code>
                <button
                  type="button"
                  onClick={() => copy(url)}
                  className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Copy
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Section 2: SAML config */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">SAML 2.0 Identity Provider</h2>
        <p className="mt-1 text-sm text-gray-600">
          Required to enable single sign-on. Get these three values from your IdP&rsquo;s app
          configuration screen.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="IdP Entity ID (Issuer)">
            <input
              type="text"
              value={config.idpEntityId || ''}
              onChange={(e) => setConfig({ ...config, idpEntityId: e.target.value })}
              placeholder="https://sts.windows.net/<tenant-id>/"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </Field>
          <Field label="IdP Single-Sign-On URL">
            <input
              type="text"
              value={config.idpSsoUrl || ''}
              onChange={(e) => setConfig({ ...config, idpSsoUrl: e.target.value })}
              placeholder="https://login.microsoftonline.com/<tenant-id>/saml2"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </Field>
        </div>

        <Field label="IdP Signing Certificate (PEM, BEGIN CERTIFICATE…)" className="mt-4">
          <textarea
            value={config.idpCertificate || ''}
            onChange={(e) => setConfig({ ...config, idpCertificate: e.target.value })}
            rows={6}
            placeholder="-----BEGIN CERTIFICATE-----\nMIIDdz…\n-----END CERTIFICATE-----"
            className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </Field>

        <details className="mt-5 rounded border border-gray-200 bg-gray-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-800">
            Attribute mappings &amp; advanced (optional)
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Email attribute (default: email)">
              <input
                type="text"
                value={config.emailAttribute || ''}
                onChange={(e) => setConfig({ ...config, emailAttribute: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="First-name attribute">
              <input
                type="text"
                value={config.firstNameAttribute || ''}
                onChange={(e) => setConfig({ ...config, firstNameAttribute: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Last-name attribute">
              <input
                type="text"
                value={config.lastNameAttribute || ''}
                onChange={(e) => setConfig({ ...config, lastNameAttribute: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Groups attribute (default: groups)">
              <input
                type="text"
                value={config.groupsAttribute || ''}
                onChange={(e) => setConfig({ ...config, groupsAttribute: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="NameID format">
              <input
                type="text"
                value={config.nameIdFormat || ''}
                onChange={(e) => setConfig({ ...config, nameIdFormat: e.target.value })}
                placeholder="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Default role for new users">
              <select
                value={config.defaultRole || 'MEMBER'}
                onChange={(e) => setConfig({ ...config, defaultRole: e.target.value as any })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="MEMBER">Member</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="OPERATOR">Operator</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
          </div>
        </details>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            label="Enable SAML SSO"
            description="Allow users in this org to sign in with your IdP."
            checked={Boolean(config.enabled)}
            onChange={(v) => setConfig({ ...config, enabled: v })}
          />
          <Toggle
            label="Enforce SAML SSO"
            description="Block password and Google sign-in for non-owners. Owners can still sign in with a password as a break-glass."
            checked={Boolean(config.enforced)}
            onChange={(v) => setConfig({ ...config, enforced: v })}
            disabled={!config.enabled}
          />
        </div>

        {saveErr && <p className="mt-4 text-sm text-red-600">{saveErr}</p>}
        {saveMsg && <p className="mt-4 text-sm text-green-700">{saveMsg}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveConfig}
            disabled={saving}
            className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save SSO configuration'}
          </button>
        </div>
      </section>

      {/* Section 3: SCIM tokens */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">SCIM 2.0 Provisioning Tokens</h2>
        <p className="mt-1 text-sm text-gray-600">
          Mint a bearer token, paste it into your IdP&rsquo;s SCIM provisioning screen, and the IdP
          will create / update / deactivate users automatically.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={tokenLabel}
            onChange={(e) => setTokenLabel(e.target.value)}
            placeholder="Label (e.g. Okta production)"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={mintToken}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Generate new token
          </button>
        </div>

        {newToken && (
          <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-900">Copy this token now — it won&rsquo;t be shown again.</p>
            <div className="mt-2 flex items-center gap-2 min-w-0">
              <code className="block flex-1 truncate rounded bg-white px-2 py-1 font-mono text-xs text-gray-900">
                {newToken}
              </code>
              <button
                type="button"
                onClick={() => copy(newToken)}
                className="shrink-0 rounded border border-amber-400 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-50"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="mt-5">
          {tokens.length === 0 ? (
            <p className="text-sm text-gray-500">No active SCIM tokens.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tokens.map((t) => (
                <li key={t.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{t.label}</p>
                    <p className="font-mono text-xs text-gray-500 truncate">
                      {t.prefix}…  ·  created {new Date(t.createdAt).toLocaleDateString()}
                      {t.lastUsedAt && (
                        <> · last used {new Date(t.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeToken(t.id)}
                    className="self-start rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 sm:self-auto"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex items-start gap-3 rounded border p-3 text-left transition ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
          : checked
          ? 'border-indigo-300 bg-indigo-50'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-600">{description}</span>
      </span>
    </button>
  );
}
