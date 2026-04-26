import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// OAuth configuration for each integration
const OAUTH_CONFIG: Record<string, {
  authUrl: string;
  tokenUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  scope: string;
  callbackUrl: string;
}> = {
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scope: 'chat:write,channels:read,groups:read,im:read',
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/integrations/slack/callback`
  },
  quickbooks: {
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    scope: 'com.intuit.quickbooks.accounting',
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/integrations/quickbooks/callback`
  },
  google_sheets: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/integrations/google-sheets/callback`
  }
};

// GET - Initiate OAuth flow
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationId = params.id.toLowerCase();
    const oauthConfig = OAUTH_CONFIG[integrationId];

    if (!oauthConfig) {
      // For non-OAuth integrations (like Twilio, Zapier), return config requirements
      if (integrationId === 'twilio') {
        return NextResponse.json({
          type: 'config',
          fields: [
            { name: 'accountSid', label: 'Account SID', type: 'text', required: true },
            { name: 'authToken', label: 'Auth Token', type: 'password', required: true },
            { name: 'fromNumber', label: 'From Number', type: 'tel', required: true, placeholder: '+1234567890' }
          ]
        });
      }

      if (integrationId === 'zapier') {
        // Generate API key for Zapier
        const user = await safeQuery(
          db.user.findUnique({
            where: { email: session.user.email || '' },
            select: { organizationId: true }
          }),
          null
        );

        if (!user?.organizationId) {
          return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        const apiKey = generateApiKey();
        
        await safeQuery(
          db.integration.upsert({
            where: {
              organizationId_type: {
                organizationId: user.organizationId,
                type: 'ZAPIER'
              }
            },
            create: {
              type: 'ZAPIER',
              name: 'Zapier',
              apiKey,
              status: 'CONNECTED',
              connectedAt: new Date(),
              organization: { connect: { id: user.organizationId } }
            },
            update: {
              apiKey,
              status: 'CONNECTED',
              connectedAt: new Date()
            }
          }),
          null
        );

        return NextResponse.json({
          type: 'api_key',
          apiKey,
          webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/zapier`,
          instructions: 'Use this API key in your Zapier integration.'
        });
      }

      return NextResponse.json({ error: 'Unknown integration type' }, { status: 400 });
    }

    // Check if OAuth credentials are configured
    if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
      return NextResponse.json({
        error: 'Integration not configured',
        message: `Please set ${integrationId.toUpperCase()}_CLIENT_ID and ${integrationId.toUpperCase()}_CLIENT_SECRET environment variables.`
      }, { status: 503 });
    }

    // Get user's organization
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true }
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      orgId: user.organizationId,
      integration: integrationId,
      timestamp: Date.now()
    })).toString('base64');

    // Build OAuth URL
    const authUrl = new URL(oauthConfig.authUrl);
    authUrl.searchParams.set('client_id', oauthConfig.clientId);
    authUrl.searchParams.set('redirect_uri', oauthConfig.callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oauthConfig.scope);
    authUrl.searchParams.set('state', state);

    // Store state in database for verification
    await safeQuery(
      db.integration.upsert({
        where: {
          organizationId_type: {
            organizationId: user.organizationId,
            type: integrationId.toUpperCase() as any
          }
        },
        create: {
          type: integrationId.toUpperCase() as any,
          name: integrationId.charAt(0).toUpperCase() + integrationId.slice(1),
          status: 'PENDING',
          config: { state },
          organization: { connect: { id: user.organizationId } }
        },
        update: {
          config: { state }
        }
      }),
      null
    );

    // Return the auth URL as JSON so the client can redirect (avoids CORS issues)
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save configuration for non-OAuth integrations
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationId = params.id.toUpperCase();
    const body = await req.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: 'Configuration is required' }, { status: 400 });
    }

    // Get user's organization
    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true }
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Validate configuration based on integration type
    const validation = validateConfig(params.id.toLowerCase(), config);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Save configuration
    const integration = await safeQuery(
      db.integration.upsert({
        where: {
          organizationId_type: {
            organizationId: user.organizationId,
            type: integrationId as any
          }
        },
        create: {
          type: integrationId as any,
          name: params.id.charAt(0).toUpperCase() + params.id.slice(1),
          status: 'CONNECTED',
          connectedAt: new Date(),
          config,
          organization: { connect: { id: user.organizationId } }
        },
        update: {
          status: 'CONNECTED',
          connectedAt: new Date(),
          config
        }
      }),
      null
    );

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        type: integration.type,
        status: integration.status,
        connectedAt: integration.connectedAt
      }
    });
  } catch (error) {
    console.error('Error saving integration config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateApiKey(): string {
  const prefix = 'myncel_';
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + key;
}

function validateConfig(type: string, config: Record<string, any>): { valid: boolean; error?: string } {
  switch (type) {
    case 'twilio':
      if (!config.accountSid || !config.authToken || !config.fromNumber) {
        return { valid: false, error: 'Account SID, Auth Token, and From Number are required' };
      }
      if (!config.fromNumber.match(/^\+\d{10,15}$/)) {
        return { valid: false, error: 'From Number must be in E.164 format (e.g., +1234567890)' };
      }
      break;
    default:
      break;
  }
  return { valid: true };
}