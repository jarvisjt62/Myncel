/**
 * /pricing — Server Component wrapper.
 *
 * Resolves the visitor's currency from edge geo headers
 * (`x-vercel-ip-country`) at request time, then hands it to
 * <PricingClient /> which renders the full page with all
 * interactive state (annual toggle, currency selector override,
 * FAQ accordion, etc.).
 *
 * Phase 1 of the regional-pricing initiative — see
 * docs/stripe-regional-pricing-roadmap.md for context.
 */

import PricingClient from './PricingClient';
import { getInitialPricingContext } from '../../lib/pricing/server';

export default async function PricingPage() {
  const ctx = await getInitialPricingContext();
  return (
    <PricingClient
      initialCountry={ctx.country}
      initialCurrency={ctx.currency}
    />
  );
}
