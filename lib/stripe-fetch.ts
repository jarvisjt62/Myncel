/**
 * Direct Stripe API client using fetch instead of the Stripe SDK
 * This bypasses the SDK's connection handling which may be causing issues
 * in Vercel serverless functions
 */

const STRIPE_BASE_URL = 'https://api.stripe.com/v1';

let cachedApiKey: string | null = null;

function getApiKey(): string {
  if (!cachedApiKey) {
    cachedApiKey = process.env.STRIPE_SECRET_KEY || '';
  }
  if (!cachedApiKey || cachedApiKey === 'sk_test_placeholder') {
    throw new Error('Stripe API key not configured');
  }
  return cachedApiKey;
}

interface StripeFetchOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Record<string, any>;
  idempotencyKey?: string;
}

async function stripeFetch<T>({ method = 'GET', path, body, idempotencyKey }: StripeFetchOptions): Promise<T> {
  const apiKey = getApiKey();
  const url = `${STRIPE_BASE_URL}${path}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Stripe-Version': '2024-11-20.acacia',
  };
  
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  
  let fetchOptions: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };
  
  if (body && method === 'POST') {
    // Convert body to x-www-form-urlencoded format
    const formBody = Object.entries(body)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => {
        if (typeof v === 'object') {
          // Handle nested objects like metadata
          return Object.entries(v)
            .map(([nk, nv]) => `${k}[${nk}]=${encodeURIComponent(String(nv))}`)
            .join('&');
        }
        return `${k}=${encodeURIComponent(String(v))}`;
      })
      .join('&');
    fetchOptions.body = formBody;
  }
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API error: ${error.error?.message || JSON.stringify(error)}`);
  }
  
  return response.json();
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || '';
      const isRetryable = 
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('EPIPE') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('network');
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(`[Stripe-Fetch] ${operationName} failed after ${attempt} attempts:`, errorMessage);
        throw error;
      }
      
      const delay = Math.pow(2, attempt - 1) * 500;
      console.warn(`[Stripe-Fetch] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Export specific API methods
export const stripeFetchApi = {
  async createCheckoutSession(params: {
    customer: string;
    payment_method_types: string[];
    line_items: Array<{ price: string; quantity: number }>;
    mode: string;
    success_url: string;
    cancel_url: string;
    subscription_data?: { metadata: Record<string, string> };
    allow_promotion_codes?: boolean;
    metadata?: Record<string, string>;
  }) {
    return withRetry(
      () => stripeFetch<any>({
        method: 'POST',
        path: '/checkout/sessions',
        body: {
          customer: params.customer,
          'payment_method_types[]': params.payment_method_types[0],
          'line_items[0][price]': params.line_items[0].price,
          'line_items[0][quantity]': params.line_items[0].quantity,
          mode: params.mode,
          success_url: params.success_url,
          cancel_url: params.cancel_url,
          'subscription_data[metadata][organizationId]': params.subscription_data?.metadata?.organizationId,
          'subscription_data[metadata][planId]': params.subscription_data?.metadata?.planId,
          allow_promotion_codes: params.allow_promotion_codes || false,
          'metadata[organizationId]': params.metadata?.organizationId,
          'metadata[planId]': params.metadata?.planId,
          'metadata[billingInterval]': params.metadata?.billingInterval,
        },
        idempotencyKey: `checkout-${params.customer}-${Date.now()}`,
      }),
      'createCheckoutSession'
    );
  },
  
  async createCustomer(params: { email: string; name: string; metadata: Record<string, string> }) {
    return withRetry(
      () => stripeFetch<any>({
        method: 'POST',
        path: '/customers',
        body: {
          email: params.email,
          name: params.name,
          'metadata[organizationId]': params.metadata.organizationId,
          'metadata[userId]': params.metadata.userId,
        },
      }),
      'createCustomer'
    );
  },
  
  async listPrices(limit: number = 100) {
    return withRetry(
      () => stripeFetch<any>({
        method: 'GET',
        path: `/prices?active=true&limit=${limit}`,
      }),
      'listPrices'
    );
  },
  
  async listProducts(limit: number = 10) {
    return withRetry(
      () => stripeFetch<any>({
        method: 'GET',
        path: `/products?limit=${limit}`,
      }),
      'listProducts'
    );
  },
  
  async createProduct(params: { name: string; description: string; metadata: Record<string, string> }) {
    return withRetry(
      () => stripeFetch<any>({
        method: 'POST',
        path: '/products',
        body: {
          name: params.name,
          description: params.description,
          'metadata[app]': params.metadata.app,
        },
      }),
      'createProduct'
    );
  },
  
  async createPrice(params: {
    product: string;
    unit_amount: number;
    currency: string;
    recurring: { interval: string };
    nickname: string;
    metadata: Record<string, string>;
  }) {
    return withRetry(
      () => stripeFetch<any>({
        method: 'POST',
        path: '/prices',
        body: {
          product: params.product,
          unit_amount: params.unit_amount,
          currency: params.currency,
          'recurring[interval]': params.recurring.interval,
          nickname: params.nickname,
          'metadata[planId]': params.metadata.planId,
          'metadata[interval]': params.metadata.interval,
          'metadata[app]': params.metadata.app,
        },
      }),
      'createPrice'
    );
  },
  
  async createBillingPortalSession(params: { customer: string; return_url: string }) {
    return withRetry(
      () => stripeFetch<any>({
        method: 'POST',
        path: '/billing_portal/sessions',
        body: {
          customer: params.customer,
          return_url: params.return_url,
        },
      }),
      'createBillingPortalSession'
    );
  },
  
  async retrieveBalance() {
    return withRetry(
      () => stripeFetch<any>({
        method: 'GET',
        path: '/balance',
      }),
      'retrieveBalance'
    );
  },
};