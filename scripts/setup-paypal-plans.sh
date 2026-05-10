#!/bin/bash
# ============================================================
# Myncel PayPal Subscription Plans Setup Script
# ============================================================
# Usage:
#   chmod +x scripts/setup-paypal-plans.sh
#   ./scripts/setup-paypal-plans.sh
#
# Prerequisites:
#   Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env.local
#   Or export them before running:
#     export PAYPAL_CLIENT_ID=your_client_id
#     export PAYPAL_CLIENT_SECRET=your_client_secret
#     export PAYPAL_MODE=sandbox   # or "live" for production
# ============================================================

set -e

# Load from .env.local if exists
if [ -f .env.local ]; then
  export $(grep -E '^PAYPAL_' .env.local | xargs)
fi

# Validate credentials
if [ -z "$PAYPAL_CLIENT_ID" ] || [ -z "$PAYPAL_CLIENT_SECRET" ]; then
  echo "❌ Error: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set"
  echo ""
  echo "Either:"
  echo "  1. Add them to .env.local"
  echo "  2. Export them: export PAYPAL_CLIENT_ID=xxx && export PAYPAL_CLIENT_SECRET=xxx"
  exit 1
fi

# Set API base URL
if [ "$PAYPAL_MODE" = "live" ]; then
  API="https://api-m.paypal.com"
  echo "🚀 Using LIVE / PRODUCTION PayPal API"
else
  API="https://api-m.sandbox.paypal.com"
  echo "🧪 Using SANDBOX PayPal API"
fi

echo ""
echo "🔐 Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API/v1/oauth2/token" \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" \
  -d "grant_type=client_credentials")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token. Check your credentials."
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi
echo "✅ Access token obtained"
echo ""

# ─── STEP 1: Create Product ────────────────────────────────
echo "📦 Creating Myncel Product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$API/v1/catalogs/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "PayPal-Request-Id: myncel-product-$(date +%s)" \
  -d '{
    "name": "Myncel CMMS",
    "description": "Computerized Maintenance Management System - Industrial IoT Platform",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PRODUCT_ID" ]; then
  echo "❌ Failed to create product"
  echo "Response: $PRODUCT_RESPONSE"
  exit 1
fi
echo "✅ Product created: $PRODUCT_ID"
echo ""

# ─── Helper function to create a plan ──────────────────────
create_plan() {
  local NAME="$1"
  local PRICE="$2"
  local INTERVAL="$3"
  local DESCRIPTION="$4"

  RESPONSE=$(curl -s -X POST "$API/v1/billing/plans" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "PayPal-Request-Id: myncel-plan-$(echo $NAME | tr ' ' '-' | tr '[:upper:]' '[:lower:]')-$(date +%s%N)" \
    -d "{
      \"product_id\": \"$PRODUCT_ID\",
      \"name\": \"$NAME\",
      \"description\": \"$DESCRIPTION\",
      \"status\": \"ACTIVE\",
      \"billing_cycles\": [{
        \"frequency\": {
          \"interval_unit\": \"$INTERVAL\",
          \"interval_count\": 1
        },
        \"tenure_type\": \"REGULAR\",
        \"sequence\": 1,
        \"total_cycles\": 0,
        \"pricing_scheme\": {
          \"fixed_price\": {
            \"value\": \"$PRICE\",
            \"currency_code\": \"USD\"
          }
        }
      }],
      \"payment_preferences\": {
        \"auto_bill_outstanding\": true,
        \"payment_failure_threshold\": 3
      }
    }")

  echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# ─── STEP 2: Create all Plans ──────────────────────────────
echo "📋 Creating Subscription Plans..."
echo ""

STARTER_MONTHLY=$(create_plan "Starter Monthly" "29" "MONTH" "Up to 5 users, 50 machines")
echo "✅ Starter Monthly:      $STARTER_MONTHLY"

STARTER_YEARLY=$(create_plan "Starter Yearly" "290" "YEAR" "Up to 5 users, 50 machines (2 months free)")
echo "✅ Starter Yearly:       $STARTER_YEARLY"

PRO_MONTHLY=$(create_plan "Professional Monthly" "99" "MONTH" "Up to 25 users, 500 machines")
echo "✅ Professional Monthly: $PRO_MONTHLY"

PRO_YEARLY=$(create_plan "Professional Yearly" "990" "YEAR" "Up to 25 users, 500 machines (2 months free)")
echo "✅ Professional Yearly:  $PRO_YEARLY"

ENTERPRISE_MONTHLY=$(create_plan "Enterprise Monthly" "249" "MONTH" "Unlimited users and machines")
echo "✅ Enterprise Monthly:   $ENTERPRISE_MONTHLY"

ENTERPRISE_YEARLY=$(create_plan "Enterprise Yearly" "2490" "YEAR" "Unlimited users and machines (2 months free)")
echo "✅ Enterprise Yearly:    $ENTERPRISE_YEARLY"

# ─── STEP 3: Print results ─────────────────────────────────
echo ""
echo "============================================================"
echo "🎉 All plans created! Add these to your .env.local:"
echo "============================================================"
echo ""
echo "PAYPAL_PRODUCT_ID=$PRODUCT_ID"
echo ""
echo "NEXT_PUBLIC_PAYPAL_PLAN_STARTER_MONTHLY=$STARTER_MONTHLY"
echo "NEXT_PUBLIC_PAYPAL_PLAN_STARTER_YEARLY=$STARTER_YEARLY"
echo "NEXT_PUBLIC_PAYPAL_PLAN_PRO_MONTHLY=$PRO_MONTHLY"
echo "NEXT_PUBLIC_PAYPAL_PLAN_PRO_YEARLY=$PRO_YEARLY"
echo "NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE_MONTHLY=$ENTERPRISE_MONTHLY"
echo "NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE_YEARLY=$ENTERPRISE_YEARLY"
echo ""
echo "============================================================"
echo ""
echo "📌 View your plans at:"
if [ "$PAYPAL_MODE" = "live" ]; then
  echo "   https://www.paypal.com/billing/plans"
else
  echo "   https://www.sandbox.paypal.com/billing/plans"
fi
echo ""