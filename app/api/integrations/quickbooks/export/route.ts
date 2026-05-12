import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * POST /api/integrations/quickbooks/export
 *
 * Creates QuickBooks records from Myncel data. Demonstrates active use of the
 * `com.intuit.quickbooks.accounting` scope by reading the connected company
 * and creating one of the following:
 *   - dataset: 'invoices'        -> creates Invoice(s) from completed work orders
 *   - dataset: 'vendors'         -> creates Vendor(s) from Myncel vendor records
 *   - dataset: 'items'           -> creates Item(s) from Myncel parts/inventory
 *
 * Request body (optional):
 *   { dataset?: 'invoices' | 'vendors' | 'items', limit?: number, sandbox?: boolean }
 *
 * Response:
 *   { success: true, dataset, created: number, ids: string[], companyInfo, links }
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
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const dataset: 'invoices' | 'vendors' | 'items' = body.dataset || 'invoices';
    const limit = Math.min(Math.max(parseInt(body.limit) || 10, 1), 50);

    // Find connected QuickBooks integration, with platform-managed fallback
    let integration = await safeQuery(
      db.integration.findFirst({
        where: {
          organizationId: user.organizationId,
          type: 'QUICKBOOKS',
          status: 'CONNECTED',
        },
      }),
      null
    );

    if (!integration) {
      const adminUser = await safeQuery(
        db.user.findFirst({
          where: { email: 'admin@myncel.com' },
          select: { organizationId: true },
        }),
        null
      );
      if (adminUser?.organizationId && adminUser.organizationId !== user.organizationId) {
        const optOut = await safeQuery(
          db.integration.findFirst({
            where: {
              organizationId: user.organizationId,
              type: 'QUICKBOOKS',
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
                type: 'QUICKBOOKS',
                status: 'CONNECTED',
              },
            }),
            null
          );
        }
      }
    }

    if (!integration) {
      return NextResponse.json(
        { error: 'QuickBooks is not connected. Please connect it in Settings → Integrations.' },
        { status: 400 }
      );
    }

    if (!integration.accessToken || !integration.refreshToken) {
      return NextResponse.json(
        { error: 'QuickBooks integration is missing credentials. Please reconnect.' },
        { status: 400 }
      );
    }

    const config = (integration.config as any) || {};
    const realmId: string = config.realmId;
    if (!realmId) {
      return NextResponse.json(
        { error: 'QuickBooks company (realmId) not found on integration. Please reconnect.' },
        { status: 400 }
      );
    }

    // Refresh token if expired (or within 60s of expiry)
    let accessToken = integration.accessToken;
    const expiresAt = integration.tokenExpiresAt ? new Date(integration.tokenExpiresAt) : null;
    if (!expiresAt || expiresAt.getTime() - Date.now() < 60_000) {
      const credentials = Buffer.from(
        `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
      ).toString('base64');

      const refreshRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refreshToken,
        }),
      });

      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.access_token) {
        console.error('QuickBooks token refresh failed:', refreshData);
        return NextResponse.json(
          { error: 'Failed to refresh QuickBooks access token. Please reconnect.' },
          { status: 401 }
        );
      }
      accessToken = refreshData.access_token;
      await safeQuery(
        db.integration.update({
          where: { id: integration.id },
          data: {
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token || integration.refreshToken,
            tokenExpiresAt: new Date(Date.now() + (refreshData.expires_in || 3600) * 1000),
          },
        }),
        null
      );
    }

    // Pick base URL (QuickBooks Online sandbox vs production)
    // If the user didn't explicitly pass body.sandbox, we'll try the configured
    // environment first, then auto-fall back to the other environment if
    // CompanyInfo fails (token mismatch with environment is a common issue).
    const explicitSandbox = typeof body.sandbox === 'boolean';
    const configuredEnv = (integration.config as any)?.environment as 'sandbox' | 'production' | undefined;
    const preferSandbox = explicitSandbox
      ? !!body.sandbox
      : configuredEnv
      ? configuredEnv === 'sandbox'
      : true; // default to sandbox for safety

    const SANDBOX_BASE = 'https://sandbox-quickbooks.api.intuit.com';
    const PROD_BASE = 'https://quickbooks.api.intuit.com';
    const qbHeaders = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // === QuickBooks API: verify connection by reading CompanyInfo ===
    // Try preferred env first, then fall back to the other env on failure.
    const tryCompanyInfo = async (base: string) => {
      const r = await fetch(
        `${base}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=70`,
        { headers: qbHeaders }
      );
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, data, base };
    };

    const firstBase = preferSandbox ? SANDBOX_BASE : PROD_BASE;
    const secondBase = preferSandbox ? PROD_BASE : SANDBOX_BASE;

    let companyCheck = await tryCompanyInfo(firstBase);
    if (!companyCheck.ok) {
      // Retry other env if first attempt failed (common: token issued for one env but we tried the other)
      const fallback = await tryCompanyInfo(secondBase);
      if (fallback.ok) {
        companyCheck = fallback;
        // Persist discovered env on the integration so next call goes direct
        await safeQuery(
          db.integration.update({
            where: { id: integration.id },
            data: {
              config: {
                ...(integration.config as any),
                environment: fallback.base === SANDBOX_BASE ? 'sandbox' : 'production',
              },
            },
          }),
          null
        );
      }
    }

    if (!companyCheck.ok) {
      console.error('QuickBooks CompanyInfo failed (both envs):', companyCheck.data);
      const detail = companyCheck.data?.Fault?.Error?.[0]?.Message || companyCheck.data?.error || 'Unknown QuickBooks error';
      return NextResponse.json(
        {
          error:
            'QuickBooks token is not valid for this company. Please reconnect QuickBooks in Settings → Integrations.',
          detail,
        },
        { status: 502 }
      );
    }

    const companyData = companyCheck.data;
    const qbBase = companyCheck.base;
    const useSandbox = qbBase === SANDBOX_BASE;
    const companyName = companyData?.CompanyInfo?.CompanyName || 'QuickBooks Company';

    // === Gather Myncel data + create QuickBooks entities ===
    const created: { id: string; label: string }[] = [];

    if (dataset === 'invoices') {
      // Pull completed work orders and create Invoices
      const workOrders = await safeQuery(
        db.workOrder.findMany({
          where: {
            organizationId: user.organizationId,
            status: 'COMPLETED',
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            woNumber: true,
            totalCost: true,
            completedAt: true,
          },
        }),
        []
      );

      if (!workOrders || workOrders.length === 0) {
        return NextResponse.json({
          success: true,
          dataset,
          created: 0,
          message: 'No completed work orders available to invoice.',
          companyInfo: { name: companyName, realmId },
        });
      }

      // Ensure we have at least one customer to invoice to.
      const custQueryRes = await fetch(
        `${qbBase}/v3/company/${realmId}/query?query=${encodeURIComponent(
          "select * from Customer maxresults 1"
        )}&minorversion=70`,
        { headers: qbHeaders }
      );
      const custQuery = await custQueryRes.json();
      let customerId: string | undefined =
        custQuery?.QueryResponse?.Customer?.[0]?.Id;

      if (!customerId) {
        // Create a default "Myncel Maintenance" customer
        const newCustRes = await fetch(
          `${qbBase}/v3/company/${realmId}/customer?minorversion=70`,
          {
            method: 'POST',
            headers: qbHeaders,
            body: JSON.stringify({ DisplayName: 'Myncel Maintenance Customer' }),
          }
        );
        const newCust = await newCustRes.json();
        customerId = newCust?.Customer?.Id;
      }

      // Ensure we have a "Services" item
      const itemQueryRes = await fetch(
        `${qbBase}/v3/company/${realmId}/query?query=${encodeURIComponent(
          "select * from Item where Type='Service' maxresults 1"
        )}&minorversion=70`,
        { headers: qbHeaders }
      );
      const itemQuery = await itemQueryRes.json();
      let itemId: string | undefined =
        itemQuery?.QueryResponse?.Item?.[0]?.Id;
      let itemName: string =
        itemQuery?.QueryResponse?.Item?.[0]?.Name || 'Maintenance Service';

      if (!itemId) {
        // Need an income account; fetch one
        const accountRes = await fetch(
          `${qbBase}/v3/company/${realmId}/query?query=${encodeURIComponent(
            "select * from Account where AccountType='Income' maxresults 1"
          )}&minorversion=70`,
          { headers: qbHeaders }
        );
        const accountData = await accountRes.json();
        const incomeAccountId = accountData?.QueryResponse?.Account?.[0]?.Id;
        if (incomeAccountId) {
          const newItemRes = await fetch(
            `${qbBase}/v3/company/${realmId}/item?minorversion=70`,
            {
              method: 'POST',
              headers: qbHeaders,
              body: JSON.stringify({
                Name: 'Maintenance Service',
                Type: 'Service',
                IncomeAccountRef: { value: incomeAccountId },
              }),
            }
          );
          const newItem = await newItemRes.json();
          itemId = newItem?.Item?.Id;
          itemName = newItem?.Item?.Name || 'Maintenance Service';
        }
      }

      if (!customerId || !itemId) {
        return NextResponse.json(
          {
            error:
              'Unable to prepare QuickBooks customer/item for invoicing. Please ensure your QuickBooks company has a default Income account.',
          },
          { status: 500 }
        );
      }

      for (const wo of workOrders) {
        const amount = Number(wo.totalCost || 0) || 1;
        const invoiceBody = {
          CustomerRef: { value: customerId },
          Line: [
            {
              DetailType: 'SalesItemLineDetail',
              Amount: amount,
              Description: `Work Order ${wo.woNumber || wo.id.slice(0, 8)}: ${wo.title}`,
              SalesItemLineDetail: {
                ItemRef: { value: itemId, name: itemName },
                Qty: 1,
                UnitPrice: amount,
              },
            },
          ],
          PrivateNote: `Auto-created by Myncel from work order ${wo.id}`,
        };

        // === QuickBooks API: create Invoice ===
        const invRes = await fetch(
          `${qbBase}/v3/company/${realmId}/invoice?minorversion=70`,
          {
            method: 'POST',
            headers: qbHeaders,
            body: JSON.stringify(invoiceBody),
          }
        );
        const invData = await invRes.json();
        if (invRes.ok && invData?.Invoice?.Id) {
          created.push({
            id: invData.Invoice.Id,
            label: `Invoice #${invData.Invoice.DocNumber || invData.Invoice.Id}`,
          });
        } else {
          console.error('QuickBooks invoice create failed:', invData);
        }
      }
    } else if (dataset === 'vendors') {
      // NOTE: This assumes your Prisma schema has a `vendor` model; adjust as needed.
      const vendors = await safeQuery(
        (db as any).vendor?.findMany?.({
          where: { organizationId: user.organizationId },
          take: limit,
        }) || Promise.resolve([]),
        []
      );

      if (!vendors || vendors.length === 0) {
        return NextResponse.json({
          success: true,
          dataset,
          created: 0,
          message: 'No Myncel vendors available to sync.',
          companyInfo: { name: companyName, realmId },
        });
      }

      for (const v of vendors) {
        const vendorBody: any = {
          DisplayName: v.name || `Vendor ${v.id}`,
          CompanyName: v.name || undefined,
          PrimaryEmailAddr: v.email ? { Address: v.email } : undefined,
          PrimaryPhone: v.phone ? { FreeFormNumber: v.phone } : undefined,
        };
        // === QuickBooks API: create Vendor ===
        const vRes = await fetch(
          `${qbBase}/v3/company/${realmId}/vendor?minorversion=70`,
          {
            method: 'POST',
            headers: qbHeaders,
            body: JSON.stringify(vendorBody),
          }
        );
        const vData = await vRes.json();
        if (vRes.ok && vData?.Vendor?.Id) {
          created.push({ id: vData.Vendor.Id, label: vData.Vendor.DisplayName });
        } else {
          console.error('QuickBooks vendor create failed:', vData);
        }
      }
    } else if (dataset === 'items') {
      // Pull inventory parts and create Items
      const parts = await safeQuery(
        db.part.findMany({
          where: { organizationId: user.organizationId },
          take: limit,
        }),
        [] as any[]
      );

      if (!parts || parts.length === 0) {
        return NextResponse.json({
          success: true,
          dataset,
          created: 0,
          message: 'No Myncel parts available to sync.',
          companyInfo: { name: companyName, realmId },
        });
      }

      // Fetch an income account for all items
      const accountRes = await fetch(
        `${qbBase}/v3/company/${realmId}/query?query=${encodeURIComponent(
          "select * from Account where AccountType='Income' maxresults 1"
        )}&minorversion=70`,
        { headers: qbHeaders }
      );
      const accountData = await accountRes.json();
      const incomeAccountId = accountData?.QueryResponse?.Account?.[0]?.Id;

      if (!incomeAccountId) {
        return NextResponse.json(
          { error: 'No Income account available in QuickBooks to attach items to.' },
          { status: 500 }
        );
      }

      for (const p of parts) {
        const itemBody: any = {
          Name: (p.name || `Part ${p.id}`).slice(0, 100),
          Sku: p.partNumber || undefined,
          Type: 'NonInventory',
          IncomeAccountRef: { value: incomeAccountId },
          UnitPrice: Number(p.unitCost || 0) || undefined,
        };
        // === QuickBooks API: create Item ===
        const iRes = await fetch(
          `${qbBase}/v3/company/${realmId}/item?minorversion=70`,
          {
            method: 'POST',
            headers: qbHeaders,
            body: JSON.stringify(itemBody),
          }
        );
        const iData = await iRes.json();
        if (iRes.ok && iData?.Item?.Id) {
          created.push({ id: iData.Item.Id, label: iData.Item.Name });
        } else {
          console.error('QuickBooks item create failed:', iData);
        }
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported dataset: ${dataset}` },
        { status: 400 }
      );
    }

    // Audit log
    await safeQuery(
      (db as any).activityLog?.create?.({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          type: 'INTEGRATION_EXPORT',
          description: `Exported ${created.length} ${dataset} to QuickBooks (${companyName})`,
          metadata: { integration: 'quickbooks', dataset, count: created.length },
        },
      }) || Promise.resolve(null),
      null
    );

    const qbUiBase = useSandbox
      ? 'https://app.sandbox.qbo.intuit.com'
      : 'https://app.qbo.intuit.com';

    return NextResponse.json({
      success: true,
      dataset,
      created: created.length,
      ids: created.map(c => c.id),
      items: created,
      companyInfo: { name: companyName, realmId },
      links: {
        quickBooksDashboard: `${qbUiBase}/app/homepage`,
        invoices: `${qbUiBase}/app/invoices`,
        vendors: `${qbUiBase}/app/vendors`,
        items: `${qbUiBase}/app/items`,
      },
    });
  } catch (err: any) {
    console.error('QuickBooks export error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to export to QuickBooks' },
      { status: 500 }
    );
  }
}
