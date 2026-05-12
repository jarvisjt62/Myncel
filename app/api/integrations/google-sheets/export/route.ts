import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * POST /api/integrations/google-sheets/export
 *
 * Creates a new Google Sheet in the authenticated user's Drive and
 * writes the organization's work orders to it. This endpoint demonstrates
 * active use of the https://www.googleapis.com/auth/spreadsheets scope.
 *
 * Request body (optional):
 *   { dataset?: 'work_orders' | 'machines' | 'alerts', title?: string }
 *
 * Response:
 *   { success: true, spreadsheetId, spreadsheetUrl, rowCount }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, organizationId: true },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const dataset = body.dataset || 'work_orders';
    const singleId: string | undefined = body.id; // optional — export a single record
    const idsList: string[] | undefined = Array.isArray(body.ids) && body.ids.length > 0 ? body.ids : undefined;

    // Platform-admin-only override: admin can target any org's data
    const isPlatformAdmin = session.user.email === 'admin@myncel.com';
    const requestedOrgId: string | undefined = body.targetOrgId;
    const dataOrgId = isPlatformAdmin && requestedOrgId ? requestedOrgId : user.organizationId;

    const titleSuffix = singleId ? 'single' : idsList ? `selected-${dataset}` : dataset;
    const title = body.title || `Myncel ${titleSuffix} export — ${new Date().toISOString().slice(0, 10)}`;

    // Find the connected Google Sheets integration.
    // Myncel supports platform-managed integrations: when the admin org has
    // Google Sheets connected and the current org hasn't opted out, we use
    // the admin's integration on behalf of this user.
    let integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: user.organizationId,
          type: 'GOOGLE_SHEETS',
          status: 'CONNECTED',
        },
      }),
      null
    );

    if (!integration) {
      // Fallback to admin org's platform-managed integration
      const adminUser = await safeQuery(
        db.user.findFirst({
          where: { email: 'admin@myncel.com' },
          select: { organizationId: true },
        }),
        null
      );
      if (adminUser?.organizationId && adminUser.organizationId !== user.organizationId) {
        // Check this org hasn't opted out of the platform integration
        const optOut = await safeQuery(
          db.integration.findFirst({
            where: {
              organizationId: user.organizationId,
              type: 'GOOGLE_SHEETS',
              status: 'DISCONNECTED',
            },
          }),
          null
        );
        if (!optOut) {
          integration = await safeQuery(
            db.integration.findFirst({
              where: {
                organizationId: adminUser.organizationId,
                type: 'GOOGLE_SHEETS',
                status: 'CONNECTED',
              },
            }),
            null
          );
        }
      }
    }

    if (!integration || !integration.accessToken) {
      return NextResponse.json(
        { error: 'Google Sheets integration is not connected. Please connect it first in Settings → Integrations.' },
        { status: 400 }
      );
    }

    // Refresh the access token if it has expired
    let accessToken = integration.accessToken;
    if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date()) {
      if (!integration.refreshToken) {
        return NextResponse.json(
          { error: 'Access token expired and no refresh token available. Please reconnect Google Sheets.' },
          { status: 400 }
        );
      }
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: integration.refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.access_token) {
        return NextResponse.json(
          { error: 'Failed to refresh access token. Please reconnect Google Sheets.' },
          { status: 400 }
        );
      }
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000);
      await safeQuery(
        db.integration.update({
          where: { id: integration.id },
          data: { accessToken, tokenExpiresAt: newExpiresAt },
        }),
        null
      );
    }

    // Gather the data to export based on the requested dataset
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (dataset === 'work_orders') {
      const workOrders = await safeQuery(
        db.workOrder.findMany({
          where: {
            organizationId: dataOrgId,
            ...(singleId ? { id: singleId } : idsList ? { id: { in: idsList } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
          include: { machine: { select: { name: true } } },
        }),
        [] as any[]
      );
      headers = ['Work Order', 'Title', 'Machine', 'Priority', 'Status', 'Created', 'Due Date'];
      rows = (workOrders || []).map((wo: any) => [
        wo.woNumber || wo.id,
        wo.title || '',
        wo.machine?.name || '',
        wo.priority || '',
        wo.status || '',
        wo.createdAt ? new Date(wo.createdAt).toISOString().slice(0, 10) : '',
        wo.dueAt ? new Date(wo.dueAt).toISOString().slice(0, 10) : '',
      ]);
    } else if (dataset === 'machines') {
      const machines = await safeQuery(
        db.machine.findMany({
          where: {
            organizationId: dataOrgId,
            ...(singleId ? { id: singleId } : idsList ? { id: { in: idsList } } : {}),
          },
          orderBy: { name: 'asc' },
          take: 500,
        }),
        [] as any[]
      );
      headers = ['Name', 'Category', 'Manufacturer', 'Model', 'Serial', 'Location', 'Status', 'Criticality', 'Year Installed'];
      rows = (machines || []).map((m: any) => [
        m.name || '',
        m.category || '',
        m.manufacturer || '',
        m.model || '',
        m.serialNumber || '',
        m.location || '',
        m.status || '',
        m.criticality || '',
        m.yearInstalled ?? '',
      ]);
    } else if (dataset === 'alerts') {
      const alerts = await safeQuery(
        db.alert.findMany({
          where: {
            organizationId: dataOrgId,
            ...(singleId ? { id: singleId } : idsList ? { id: { in: idsList } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
          include: { machine: { select: { name: true } } },
        }),
        [] as any[]
      );
      headers = ['Title', 'Severity', 'Status', 'Machine', 'Message', 'Created'];
      rows = (alerts || []).map((a: any) => [
        a.title || '',
        a.severity || '',
        a.isResolved ? 'Resolved' : 'Open',
        a.machine?.name || '',
        a.message || '',
        a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : '',
      ]);
    } else if (dataset === 'parts') {
      const parts = await safeQuery(
        db.part.findMany({
          where: {
            organizationId: dataOrgId,
            ...(singleId ? { id: singleId } : idsList ? { id: { in: idsList } } : {}),
          },
          orderBy: { name: 'asc' },
          take: 500,
        }),
        [] as any[]
      );
      headers = ['Name', 'Part Number', 'Quantity', 'Min Quantity', 'Unit Cost', 'Supplier', 'Location'];
      rows = (parts || []).map((p: any) => [
        p.name || '',
        p.partNumber || '',
        p.quantity ?? 0,
        p.minQuantity ?? 0,
        p.unitCost != null ? Number(p.unitCost).toFixed(2) : '',
        p.supplier || '',
        p.location || '',
      ]);
    }

    // === Google Sheets API: create a new spreadsheet ===
    // Uses scope: https://www.googleapis.com/auth/spreadsheets
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: dataset } }],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Google Sheets create failed:', errText);
      return NextResponse.json(
        { error: 'Failed to create Google Sheet', details: errText },
        { status: 500 }
      );
    }

    const sheet = await createRes.json();
    const spreadsheetId = sheet.spreadsheetId;
    const spreadsheetUrl = sheet.spreadsheetUrl;

    // === Google Sheets API: write the data ===
    // Uses scope: https://www.googleapis.com/auth/spreadsheets
    const values = [headers, ...rows];
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        dataset
      )}!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!writeRes.ok) {
      const errText = await writeRes.text();
      console.error('Google Sheets write failed:', errText);
      return NextResponse.json(
        { error: 'Sheet created but failed to write data', spreadsheetUrl, details: errText },
        { status: 500 }
      );
    }

    // === Google Sheets API: format the header row as bold ===
    // Also uses the spreadsheets scope
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheet.sheets?.[0]?.properties?.sheetId || 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
                },
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheet.sheets?.[0]?.properties?.sheetId || 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      }),
    });

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      rowCount: rows.length,
      dataset,
      title,
    });
  } catch (err: any) {
    console.error('Google Sheets export error:', err);
    return NextResponse.json(
      { error: 'Export failed', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
