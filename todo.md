# Content Audit & Fix Tasks

## Issues Found - Docs Page
- [x] Read all pages (docs, guides, blog, customers)

## Fixes Needed

### Docs fixes
- [ ] Fix plan names: docs says "Starter: 3 users / Professional: 10 users" → actual plans are Starter/Growth/Professional (no user limits, machine limits instead)
- [ ] Remove floor plan upload / facility mapping feature (not implemented)
- [ ] Remove iOS App Store / Google Play mobile app references (no native app, web-only)
- [ ] Remove barcode scanning references (not implemented)
- [ ] Remove IoT sensor integration references (not implemented)
- [ ] Remove OEE tracking references (not implemented)
- [ ] Remove purchase orders references (not implemented)
- [ ] Fix API base URL from api.myncel.com/v1 to /api (internal Next.js routes)
- [ ] Fix SMS plan reference: remove "Professional Plan: 50 SMS/month per user" → SMS on Growth+ plans
- [ ] Fix API access plan reference: correct plan gating

### Blog fixes
- [ ] Create missing blog post pages (6 missing: maintenance-kpis, spreadsheet-to-cmms, haccp-records, preventive-vs-predictive, cmms-roi, hydraulic-maintenance)

### Guides fixes
- [ ] ROI calculator: "$49/machine/month" pricing model doesn't match actual plan structure; update to reflect actual plans
- [ ] Equipment Lifespan guide: remove IoT sensor references, replace with general condition monitoring

### Customers page
- [x] Already has a disclaimer banner - content is fine as-is

## Git commit after all fixes
- [ ] Commit and push all changes