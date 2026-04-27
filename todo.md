# Myncel — Session Tasks

## Task 1: Admin Billing Panel
- [ ] Add "Billing" section to admin nav in layout.tsx
- [ ] Create app/admin/billing/page.tsx — overview of all orgs billing
- [ ] Create app/admin/billing/[orgId]/page.tsx — per-org billing detail with plan change

## Task 2: Multi-Gateway Payment Support
- [ ] Update BillingClient.tsx to show PayPal + card options
- [ ] Create /api/billing/paypal/route.ts — PayPal checkout session
- [ ] Update checkout UI to allow gateway selection (Stripe, PayPal)
- [ ] Update .env.local.example with PayPal keys

## Task 3: Stripe Environment Config Guide
- [ ] Update .env.local.example with full Stripe + PayPal config
- [ ] Create STRIPE_SETUP.md — step-by-step guide for getting keys
- [ ] Ensure BillingClient shows proper gateway status