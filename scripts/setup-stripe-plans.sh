#!/bin/bash
# ============================================================
# Myncel Stripe Subscription Plans Setup Script
# ============================================================
# Usage:
#   chmod +x scripts/setup-stripe-plans.sh
#   ./scripts/setup-stripe-plans.sh
#
# Prerequisites:
#   Set STRIPE_SECRET_KEY in your .env.local
#   Or export it before running:
#     export STRIPE_SECRET_KEY=sk_live_xxx
# ============================================================

set -e

# Load from .env.local if exists
if [ -f .env.local ]; then
  export $(grep -E '^STRIPE_SECRET_KEY' .env.local | xargs)
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ Error: STRIPE_SECRET_KEY must be set"
  echo ""
  echo "Either:"
  echo "  1. Add STRIPE_SECRET_KEY=sk_live_xxx to .env.local"
  echo "  2. Export it: export STRIPE_SECRET_KEY=sk_live_xxx"
  exit 1
fi

STRIPE_API="https://api.stripe.com/v1"
AUTH="-u $STRIPE_SECRET_KEY:"

echo "🔐 Using Stripe API key: ${STRIPE_SECRET_KEY:0:12}..."
echo ""

# ─── Helper: create price ──────────────────────────────────
create_price() {
  local NICKNAME="$1"
  local AMOUNT="$2"     # in cents
  local INTERVAL="$3"   # month or year
  local PRODUCT_ID="$4"

  RESPONSE=$(curl -s -X POST "$STRIPE_API/prices" \
    $AUTH \
    -d "nickname=$NICKNAME" \
    -d "unit_amount=$AMOUNT" \
    -d "currency=usd" \
    -d "recurring[interval]=$INTERVAL" \
    -d "product=$PRODUCT_ID")

  echo $RESPONSE | grep -o '"id": *"[^"]*"' | head -1 | grep -o '"[^"]*"$' | tr -d '"'
}

# ─── STEP 1: Create Stripe Product ────────────────────────
echo "📦 Creating Myncel CMMS Product on Stripe..."
PRODUCT_RESPONSE=$(curl -s -X POST "$STRIPE_API/products" \
  $AUTH \
  -d "name=Myncel CMMS" \
  -d "description=Computerized Maintenance Management System - Industrial IoT Platform" \
  -d "metadata[app]=myncel")

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | grep -o '"id": *"[^"]*"' | head -1 | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$PRODUCT_ID" ]; then
  echo "❌ Failed to create Stripe product"
  echo "Response: $PRODUCT_RESPONSE"
  exit 1
fi
echo "✅ Product created: $PRODUCT_ID"
echo ""

# ─── STEP 2: Create all prices ────────────────────────────
echo "💰 Creating Stripe prices..."
echo ""

# Starter: $49/mo, $39/mo billed yearly ($468/yr)
STARTER_MONTHLY=$(create_price "Starter Monthly" "4900" "month" "$PRODUCT_ID")
echo "✅ Starter Monthly (\$49/mo):          $STARTER_MONTHLY"

STARTER_YEARLY=$(create_price "Starter Yearly" "46800" "year" "$PRODUCT_ID")
echo "✅ Starter Yearly (\$468/yr = \$39/mo): $STARTER_YEARLY"

# Growth: $99/mo, $79/mo billed yearly ($948/yr)
GROWTH_MONTHLY=$(create_price "Growth Monthly" "9900" "month" "$PRODUCT_ID")
echo "✅ Growth Monthly (\$99/mo):            $GROWTH_MONTHLY"

GROWTH_YEARLY=$(create_price "Growth Yearly" "94800" "year" "$PRODUCT_ID")
echo "✅ Growth Yearly (\$948/yr = \$79/mo):  $GROWTH_YEARLY"

# Professional: $249/mo, $199/mo billed yearly ($2388/yr)
PROFESSIONAL_MONTHLY=$(create_price "Professional Monthly" "24900" "month" "$PRODUCT_ID")
echo "✅ Professional Monthly (\$249/mo):     $PROFESSIONAL_MONTHLY"

PROFESSIONAL_YEARLY=$(create_price "Professional Yearly" "238800" "year" "$PRODUCT_ID")
echo "✅ Professional Yearly (\$2388/yr = \$199/mo): $PROFESSIONAL_YEARLY"

echo ""
echo "============================================================"
echo "🎉 All Stripe prices created! Add these to your Vercel"
echo "   Environment Variables and .env.local:"
echo "============================================================"
echo ""
echo "STRIPE_PRODUCT_ID=$PRODUCT_ID"
echo ""
echo "STRIPE_STARTER_MONTHLY_PRICE_ID=$STARTER_MONTHLY"
echo "STRIPE_STARTER_YEARLY_PRICE_ID=$STARTER_YEARLY"
echo "STRIPE_GROWTH_MONTHLY_PRICE_ID=$GROWTH_MONTHLY"
echo "STRIPE_GROWTH_YEARLY_PRICE_ID=$GROWTH_YEARLY"
echo "STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=$PROFESSIONAL_MONTHLY"
echo "STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=$PROFESSIONAL_YEARLY"
echo ""
echo "============================================================"
echo ""
echo "📌 View your prices at: https://dashboard.stripe.com/prices"
echo ""