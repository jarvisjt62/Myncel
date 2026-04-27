# 💳 Myncel Payment Gateway Setup Guide

This guide walks you through configuring all supported payment gateways so the **"Demo Mode"** warning disappears and real payments are enabled.

---

## Supported Payment Methods

| Method | Gateway | Status |
|--------|---------|--------|
| Credit / Debit Card (Visa, MC, Amex, Discover) | Stripe | ✅ Ready |
| Apple Pay | Stripe | ✅ Ready (auto) |
| Google Pay | Stripe | ✅ Ready (auto) |
| PayPal | PayPal SDK | ✅ Ready |
| ACH Bank Transfer | Stripe | ✅ Ready (enable in dashboard) |
| Wire / Invoice | Manual | ✅ Built-in (contact sales flow) |

---

## 1. Stripe Setup (Cards, Apple Pay, Google Pay, ACH)

Stripe handles credit cards, Apple Pay, Google Pay, and ACH bank transfers all in one integration.

### Step 1 — Create a Stripe Account
1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete the business verification
3. For testing, you don't need to complete verification — use **test mode**

### Step 2 — Get API Keys
1. Open [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Click **"Reveal test secret key"** and copy the **Secret key** (starts with `sk_test_` or `sk_live_`)

Add to your environment:
```env
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

### Step 3 — Create Products & Prices

Go to [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products) and create the following:

#### Option A — Stripe Dashboard (Recommended for production)

Create 3 products:
- **Myncel Starter** — $49/month + $39/month (annual)
- **Myncel Growth** — $99/month + $79/month (annual)  
- **Myncel Professional** — $249/month + $199/month (annual)

For each product:
1. Click **"Add product"**
2. Set the name (e.g., "Myncel Growth")
3. Add a **recurring price** at the monthly rate
4. Add a second **recurring price** at the annual rate × 12 (e.g., $79 × 12 = $948/year)
5. Copy the **Price ID** (starts with `price_`)

#### Option B — Stripe CLI (Faster for development)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Create Starter plan
stripe products create --name "Myncel Starter"
stripe prices create \
  --product prod_XXXX \
  --unit-amount 4900 \
  --currency usd \
  --recurring[interval]=month \
  --nickname "Starter Monthly"

# Repeat for each plan/interval combination
```

Add the Price IDs to your environment:
```env
STRIPE_PRICE_STARTER_MONTHLY=price_1...
STRIPE_PRICE_STARTER_YEARLY=price_1...
STRIPE_PRICE_GROWTH_MONTHLY=price_1...
STRIPE_PRICE_GROWTH_YEARLY=price_1...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_1...
```

### Step 4 — Configure Webhooks

Webhooks allow Stripe to notify Myncel when payments succeed or fail.

#### For Local Development:
```bash
# Install Stripe CLI and login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret it shows (whsec_...)
```

#### For Production (Vercel):
1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
5. Click **"Add endpoint"** and copy the **Signing secret** (starts with `whsec_`)

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 5 — Enable Apple Pay & Google Pay
These are automatically enabled through Stripe's Payment Element — no extra keys needed.

For **Apple Pay in production**:
1. Go to [https://dashboard.stripe.com/settings/payment_methods](https://dashboard.stripe.com/settings/payment_methods)
2. Enable **Apple Pay**
3. Stripe will ask you to verify your domain (Myncel handles this automatically via the `/.well-known/apple-developer-merchantid-domain-association` route)

### Step 6 — Enable ACH Bank Transfers
1. Go to Stripe Dashboard → **Settings → Payment methods**
2. Enable **ACH Direct Debit**
3. No code changes needed — it's already integrated into the checkout flow

---

## 2. PayPal Setup

### Step 1 — Create a PayPal Developer Account
1. Go to [https://developer.paypal.com](https://developer.paypal.com)
2. Log in with your PayPal business account (or create one)

### Step 2 — Create an App
1. Go to **My Apps & Credentials**
2. Choose **Sandbox** tab for testing, **Live** for production
3. Click **"Create App"**
4. Name it "Myncel" and click **Create**
5. Copy the **Client ID** and **Secret Key**

```env
PAYPAL_CLIENT_ID=AYour_Client_ID_Here
PAYPAL_CLIENT_SECRET=EYour_Secret_Here
PAYPAL_MODE=sandbox   # Change to "live" for production
```

### Step 3 — (Optional) Create Subscription Plans
For recurring PayPal subscriptions (instead of one-time payments):

1. Go to [https://developer.paypal.com/dashboard/products](https://developer.paypal.com/dashboard/products)
2. Create products matching your Myncel plans
3. Create billing plans for each product at each price point
4. Copy the **Plan IDs** (start with `P-`)

```env
PAYPAL_PLAN_STARTER_MONTHLY=P-...
PAYPAL_PLAN_STARTER_YEARLY=P-...
PAYPAL_PLAN_GROWTH_MONTHLY=P-...
PAYPAL_PLAN_GROWTH_YEARLY=P-...
PAYPAL_PLAN_PROFESSIONAL_MONTHLY=P-...
PAYPAL_PLAN_PROFESSIONAL_YEARLY=P-...
```

> **Note:** If PayPal plan IDs are not set, Myncel automatically falls back to one-time PayPal orders. This still works but won't auto-renew — you'd need to handle renewals via PayPal IPN webhooks.

### Step 4 — PayPal Webhooks (for production)
1. In the PayPal Developer Dashboard, go to your app
2. Scroll to **Webhooks** → **Add Webhook**
3. Set URL: `https://your-domain.com/api/webhooks/paypal`
4. Select: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `PAYMENT.SALE.COMPLETED`

---

## 3. Deploying to Vercel

### Add Environment Variables in Vercel
1. Go to your Vercel project → **Settings → Environment Variables**
2. Add each variable from the list above
3. Set scope to **Production** and **Preview** as needed

### Quick copy-paste for Vercel CLI:
```bash
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_STARTER_MONTHLY
vercel env add STRIPE_PRICE_STARTER_YEARLY
vercel env add STRIPE_PRICE_GROWTH_MONTHLY
vercel env add STRIPE_PRICE_GROWTH_YEARLY
vercel env add STRIPE_PRICE_PROFESSIONAL_MONTHLY
vercel env add STRIPE_PRICE_PROFESSIONAL_YEARLY
vercel env add PAYPAL_CLIENT_ID
vercel env add PAYPAL_CLIENT_SECRET
vercel env add PAYPAL_MODE
```

---

## 4. Test Your Setup

### Test Stripe (Card Payments)
Use these test card numbers in checkout:
- ✅ **Success**: `4242 4242 4242 4242` — any future expiry, any CVC
- ❌ **Declined**: `4000 0000 0000 0002`
- 🔄 **3D Secure**: `4000 0025 0000 3155`

### Test PayPal (Sandbox)
1. Go to PayPal Developer → **Sandbox Accounts**
2. Use the pre-created sandbox buyer account to log in during checkout

### Verify Webhooks Are Working
```bash
# Watch your server logs while triggering a test event
stripe trigger checkout.session.completed
```

---

## 5. Verification Checklist

After setup, verify:

- [ ] `STRIPE_SECRET_KEY` is set → Demo Mode warning disappears
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set → Stripe checkout loads
- [ ] All 6 price IDs are set → Correct prices shown in checkout
- [ ] `STRIPE_WEBHOOK_SECRET` is set → Subscription updates reflected in DB
- [ ] `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` are set → PayPal option appears
- [ ] Test a Stripe checkout with card `4242 4242 4242 4242`
- [ ] Test a PayPal checkout using sandbox account
- [ ] Confirm subscription shows "Active" in `/settings/billing` after payment
- [ ] Confirm admin `/admin/billing` shows correct org plan

---

## 6. Going Live Checklist

Before switching to live keys:

- [ ] Complete Stripe business verification
- [ ] Complete PayPal business account verification
- [ ] Replace `sk_test_` with `sk_live_` keys
- [ ] Replace `pk_test_` with `pk_live_` keys
- [ ] Create live Stripe products & prices (separate from test)
- [ ] Set `PAYPAL_MODE=live`
- [ ] Update Stripe webhook endpoint to production URL
- [ ] Update PayPal webhook endpoint to production URL
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Test one live transaction with a real card (then refund it)

---

## Need Help?

- **Stripe docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **PayPal docs**: [https://developer.paypal.com/docs](https://developer.paypal.com/docs)
- **Myncel support**: billing@myncel.com