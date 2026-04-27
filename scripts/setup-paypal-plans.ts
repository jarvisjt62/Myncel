/**
 * PayPal Subscription Plans Setup Script
 * 
 * This script creates the Product and Subscription Plans in PayPal for Myncel.
 * 
 * Prerequisites:
 * 1. Get your PayPal Access Token from: https://developer.paypal.com/dashboard/
 * 2. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env
 * 3. Run: npx ts-node scripts/setup-paypal-plans.ts
 * 
 * For sandbox testing, use: https://api-m.sandbox.paypal.com
 * For production, use: https://api-m.paypal.com
 */

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function createProduct(accessToken: string) {
  const response = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `myncel-product-${Date.now()}`,
    },
    body: JSON.stringify({
      name: 'Myncel CMMS',
      description: 'Computerized Maintenance Management System - Industrial IoT Platform',
      type: 'SERVICE',
      category: 'SOFTWARE',
      image_url: 'https://myncel.com/logo.png',
      home_url: 'https://myncel.com',
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to create product: ${JSON.stringify(data)}`);
  }
  console.log('✅ Product created:', data.id);
  return data.id;
}

async function createPlan(
  accessToken: string, 
  productId: string, 
  name: string, 
  price: string, 
  interval: 'MONTH' | 'YEAR',
  description: string
) {
  const response = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `myncel-plan-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: name,
      description: description,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: {
          interval_unit: interval,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: price,
            currency_code: 'USD',
          },
        },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to create plan ${name}: ${JSON.stringify(data)}`);
  }
  console.log(`✅ Plan "${name}" created: ${data.id} - $${price}/${interval.toLowerCase()}`);
  return data.id;
}

async function main() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ Error: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in .env');
    console.error('');
    console.error('Get these from: https://developer.paypal.com/dashboard/applications/sandbox');
    process.exit(1);
  }

  console.log(`🔐 Getting access token from PayPal ${process.env.PAYPAL_MODE === 'live' ? 'PRODUCTION' : 'SANDBOX'}...`);
  const accessToken = await getAccessToken(clientId, clientSecret);
  console.log('✅ Access token obtained\n');

  console.log('📦 Creating Myncel Product...');
  const productId = await createProduct(accessToken);
  console.log('');

  console.log('📋 Creating Subscription Plans...\n');
  
  // Starter Plan - Monthly
  const starterMonthlyId = await createPlan(
    accessToken, productId,
    'Starter Plan - Monthly',
    '29',
    'MONTH',
    'Starter plan for small teams - Up to 5 users, 50 machines'
  );

  // Starter Plan - Yearly
  const starterYearlyId = await createPlan(
    accessToken, productId,
    'Starter Plan - Yearly',
    '290',
    'YEAR',
    'Starter plan for small teams - Up to 5 users, 50 machines (2 months free)'
  );

  // Professional Plan - Monthly
  const proMonthlyId = await createPlan(
    accessToken, productId,
    'Professional Plan - Monthly',
    '99',
    'MONTH',
    'Professional plan for growing teams - Up to 25 users, 500 machines'
  );

  // Professional Plan - Yearly
  const proYearlyId = await createPlan(
    accessToken, productId,
    'Professional Plan - Yearly',
    '990',
    'YEAR',
    'Professional plan for growing teams - Up to 25 users, 500 machines (2 months free)'
  );

  // Enterprise Plan - Monthly
  const enterpriseMonthlyId = await createPlan(
    accessToken, productId,
    'Enterprise Plan - Monthly',
    '249',
    'MONTH',
    'Enterprise plan for large organizations - Unlimited users, unlimited machines'
  );

  // Enterprise Plan - Yearly
  const enterpriseYearlyId = await createPlan(
    accessToken, productId,
    'Enterprise Plan - Yearly',
    '2490',
    'YEAR',
    'Enterprise plan for large organizations - Unlimited users, unlimited machines (2 months free)'
  );

  console.log('\n🎉 All plans created successfully!\n');
  console.log('='.repeat(60));
  console.log('Add these Plan IDs to your .env file:\n');
  console.log(`PAYPAL_PRODUCT_ID=${productId}`);
  console.log(`PAYPAL_PLAN_STARTER_MONTHLY=${starterMonthlyId}`);
  console.log(`PAYPAL_PLAN_STARTER_YEARLY=${starterYearlyId}`);
  console.log(`PAYPAL_PLAN_PRO_MONTHLY=${proMonthlyId}`);
  console.log(`PAYPAL_PLAN_PRO_YEARLY=${proYearlyId}`);
  console.log(`PAYPAL_PLAN_ENTERPRISE_MONTHLY=${enterpriseMonthlyId}`);
  console.log(`PAYPAL_PLAN_ENTERPRISE_YEARLY=${enterpriseYearlyId}`);
  console.log('='.repeat(60));
}

main().catch(console.error);