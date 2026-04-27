import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Returns which payment gateways are currently enabled by the admin
export async function GET() {
  const keys = [
    'payment.stripe.enabled',
    'payment.paypal.enabled',
    'payment.ach.enabled',
    'payment.applepay.enabled',
    'payment.googlepay.enabled',
  ];

  const dbSettings = await db.adminSetting.findMany({
    where: { key: { in: keys } },
  }).catch(() => []);

  const defaults: Record<string, boolean> = {
    'payment.stripe.enabled':   true,
    'payment.paypal.enabled':   true,
    'payment.ach.enabled':      true,
    'payment.applepay.enabled': true,
    'payment.googlepay.enabled':true,
  };

  const gateways: Record<string, boolean> = { ...defaults };
  for (const s of dbSettings) {
    gateways[s.key] = JSON.parse(s.value);
  }

  return NextResponse.json({
    stripe:    gateways['payment.stripe.enabled'],
    paypal:    gateways['payment.paypal.enabled'],
    ach:       gateways['payment.ach.enabled'],
    applePay:  gateways['payment.applepay.enabled'],
    googlePay: gateways['payment.googlepay.enabled'],
  });
}