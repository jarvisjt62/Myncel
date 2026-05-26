import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSpMetadataXml } from '@/lib/sso/saml';

/**
 * GET /api/auth/saml/[orgSlug]/metadata
 *
 * Returns the SP-side SAML 2.0 metadata XML the customer pastes into
 * their IdP during initial setup. Contains the SP entityID, ACS URL,
 * and supported NameID formats.
 *
 * Public endpoint — IdP admin tools fetch this without auth.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  const org = await db.organization.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const xml = buildSpMetadataXml(params.orgSlug);
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export const dynamic = 'force-dynamic';
