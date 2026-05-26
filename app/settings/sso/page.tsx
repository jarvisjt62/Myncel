import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import SsoSettingsClient from './SsoSettingsClient';

export const dynamic = 'force-dynamic';

export default async function SsoSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const orgId = (session?.user as any)?.organizationId;
  if (!session || !orgId) redirect('/signin');
  if (role !== 'OWNER' && role !== 'ADMIN') redirect('/settings');

  const [org, cfg, tokens] = await Promise.all([
    db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, slug: true, name: true },
    }),
    db.ssoConfig.findUnique({ where: { organizationId: orgId } }),
    db.scimToken.findMany({
      where: { organizationId: orgId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
  ]);

  if (!org) redirect('/signin');

  // Compute the SP-side URLs the customer needs to plug into the IdP.
  const baseUrl =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://www.myncel.com';
  const trimmed = baseUrl.replace(/\/+$/, '');
  const spUrls = {
    entityId: `${trimmed}/api/auth/saml/${org.slug}/metadata`,
    acsUrl: `${trimmed}/api/auth/saml/${org.slug}/callback`,
    metadataUrl: `${trimmed}/api/auth/saml/${org.slug}/metadata`,
    loginUrl: `${trimmed}/api/auth/saml/${org.slug}/login`,
    scimBaseUrl: `${trimmed}/api/scim/v2`,
  };

  return (
    <SsoSettingsClient
      org={org}
      initialConfig={cfg}
      initialTokens={tokens.map((t) => ({
        ...t,
        lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
      }))}
      spUrls={spUrls}
    />
  );
}
