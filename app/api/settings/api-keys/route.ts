import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Generate a secure API key
function generateApiKey(prefix = 'mnc'): string {
  const random = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${random}`;
}

// GET — list all API keys for the org
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await db.integration.findMany({
      where: {
        organizationId: session.user.organizationId,
        type: 'ZAPIER',
      },
      select: {
        id: true,
        name: true,
        status: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true,
        config: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask the key — only show first 12 + last 4 chars
    const maskedKeys = keys.map(k => ({
      ...k,
      apiKeyMasked: k.apiKey
        ? `${k.apiKey.slice(0, 16)}...${k.apiKey.slice(-4)}`
        : null,
      apiKeyFull: k.apiKey, // included so UI can copy once
      lastUsed: (k.config as any)?.lastUsed || null,
      usageCount: (k.config as any)?.usageCount || 0,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error('GET api-keys error:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST — create a new API key
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    // Check key limit (max 10 keys per org)
    const count = await db.integration.count({
      where: { organizationId: session.user.organizationId, type: 'ZAPIER' },
    });
    if (count >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 API keys allowed per organization' },
        { status: 400 }
      );
    }

    const newKey = generateApiKey(type === 'IOT' ? 'mnc_iot' : 'mnc');

    const integration = await db.integration.create({
      data: {
        type: 'ZAPIER',
        name: name.trim(),
        status: 'CONNECTED',
        apiKey: newKey,
        organizationId: session.user.organizationId,
        config: {
          keyType: type || 'GENERAL',
          createdAt: new Date().toISOString(),
          usageCount: 0,
          lastUsed: null,
        },
      },
    });

    return NextResponse.json({
      id: integration.id,
      name: integration.name,
      apiKey: newKey,
      status: integration.status,
      createdAt: integration.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('POST api-keys error:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

// PATCH — rotate (regenerate) an existing key
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, name } = body;

    // Verify ownership
    const existing = await db.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (action === 'rotate') {
      const newKey = generateApiKey('mnc');
      const updated = await db.integration.update({
        where: { id },
        data: {
          apiKey: newKey,
          updatedAt: new Date(),
          config: {
            ...(existing.config as object || {}),
            rotatedAt: new Date().toISOString(),
            usageCount: 0,
          },
        },
      });
      return NextResponse.json({ id: updated.id, apiKey: newKey, message: 'Key rotated successfully' });
    }

    if (action === 'rename' && name) {
      const updated = await db.integration.update({
        where: { id },
        data: { name: name.trim() },
      });
      return NextResponse.json({ id: updated.id, name: updated.name });
    }

    if (action === 'disable') {
      const updated = await db.integration.update({
        where: { id },
        data: { status: existing.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' },
      });
      return NextResponse.json({ id: updated.id, status: updated.status });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH api-keys error:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

// DELETE — revoke an API key
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // Verify ownership before deleting
    const existing = await db.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await db.integration.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    console.error('DELETE api-keys error:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}