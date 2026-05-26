import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/scim/v2/ResourceTypes
 *
 * SCIM 2.0 resource catalogue (RFC 7644 §6). Lists the resource types
 * we expose. We only ship User today; Group support is on the roadmap.
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: 1,
      Resources: [
        {
          schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
          id: 'User',
          name: 'User',
          endpoint: '/Users',
          description: 'Myncel user (auto-provisioned via SCIM).',
          schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
          meta: {
            resourceType: 'ResourceType',
            location: '/api/scim/v2/ResourceTypes/User',
          },
        },
      ],
    },
    { headers: { 'Content-Type': 'application/scim+json' } }
  );
}

export const dynamic = 'force-dynamic';
