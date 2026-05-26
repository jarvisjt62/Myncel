import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/scim/v2/ServiceProviderConfig
 *
 * SCIM 2.0 capability descriptor (RFC 7644 §5). IdPs probe this on
 * first connect to figure out what we support. We advertise:
 *   - Bearer token auth
 *   - PATCH operations
 *   - Filter on userName / externalId
 *   - No bulk, no ETag, no change-password
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      patch: { supported: true },
      bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false },
      sort: { supported: false },
      etag: { supported: false },
      authenticationSchemes: [
        {
          name: 'OAuth Bearer Token',
          description: 'Authentication via a static bearer token issued from /settings/sso → SCIM tokens.',
          specUri: 'https://www.rfc-editor.org/info/rfc6750',
          documentationUri: 'https://www.myncel.com/handbook/integrations',
          type: 'oauthbearertoken',
          primary: true,
        },
      ],
      meta: {
        resourceType: 'ServiceProviderConfig',
        location: '/api/scim/v2/ServiceProviderConfig',
      },
    },
    { headers: { 'Content-Type': 'application/scim+json' } }
  );
}

export const dynamic = 'force-dynamic';
