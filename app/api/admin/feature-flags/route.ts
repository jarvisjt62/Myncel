import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Feature flags are stored in the organization's metadata field
    // We use a system-level approach: flags are stored as a JSON file on the server
    // or in the organization settings. For simplicity we use a global config approach.
    const flags = await getFeatureFlags();
    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email || '' },
        select: { organizationId: true, role: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Only ADMIN or OWNER can change feature flags
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { flags } = body;

    if (!flags || typeof flags !== 'object') {
      return NextResponse.json({ error: 'Invalid flags data' }, { status: 400 });
    }

    await saveFeatureFlags(flags);

    return NextResponse.json({ success: true, flags });
  } catch (error) {
    console.error('Error saving feature flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// We store feature flags in a system settings record in the DB using the Integration table
// as a config store, or alternatively use a simple JSON file approach.
// Using a dedicated SystemSetting pattern via Integration type fallback:

const FLAGS_FILE = '/tmp/myncel-feature-flags.json';
const DEFAULT_FLAGS = {
  customersPageEnabled: false,
  changelogEnabled: false,
  changelogNote: '',
};

async function getFeatureFlags(): Promise<typeof DEFAULT_FLAGS> {
  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile(FLAGS_FILE, 'utf8');
    return { ...DEFAULT_FLAGS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

async function saveFeatureFlags(flags: Partial<typeof DEFAULT_FLAGS>): Promise<void> {
  const current = await getFeatureFlags();
  const merged = { ...current, ...flags };
  const fs = await import('fs/promises');
  await fs.writeFile(FLAGS_FILE, JSON.stringify(merged, null, 2), 'utf8');
}