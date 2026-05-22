# Handbook Match-Reality Audit & Patch Plan

**Branch:** `handbook/match-reality`
**Approach:** Surgical edits to ~10 sections + add new "Roadmap" chapter at end.

## Sections being rewritten (real UI vs phantom UI)

### Equipment chapter

**Section 2 — "How to add a single machine"**
- ❌ Old claim: "click Equipment → '+ Add Equipment' button → pick template → Site → Building → Cell/Line/Room"
- ✅ New (matches real UI):
  - Open `/dashboard` → click **Equipment** tab in sidebar
  - Click the **+ Add Machine** button → opens "Add New Machine" modal
  - Fields: Machine Name *, Serial Number, Year Installed, Manufacturer, Model, Location (free-text, e.g. "Plant 1 — Bay A — Line 3"), Notes
  - Click **+ Create Machine**

**Section 3 — "Bulk-importing equipment"**
- ❌ Old claim: CSV importer + named importers for SAP/Maximo/Limble/UpKeep/eMaint/Fiix/MaintainX/Hippo + `POST /api/equipment/bulk` API
- ✅ New: Move to Roadmap (Coming Soon). Replace with "For now, bulk creation is via the public REST API — see /api/docs for the Machine endpoints" + link.

**Section 4 — "QR codes and asset tagging"**
- ❌ Old claim: 50×50mm + "sheet of 24"
- ✅ New: Three sizes — Small (50×50mm), Medium (80×60mm), Large (100×80mm). Path: `/equipment/qr-labels`. The QR encodes the machine's deep-link URL.

**Section 7 — "IoT sensor retrofit"**
- ❌ Old: "Edge Gateway auto-registers in 30–60 seconds. Plug in. Speaks LoRaWAN/BLE/Zigbee."
- ✅ New (matches actual flow): "Download the Myncel Edge Gateway from `/docs/edge-gateway` or `/dashboard/gateway-setup`. It runs on a Raspberry Pi, an industrial PC, or an ESP32 microcontroller. Authenticate it by creating a per-machine **Gateway Token** (Equipment → click machine → 'Create Gateway Token' → copy once → paste into your YAML config under `device_token:`). Then run the agent."

**Section 8 — "Direct PLC / SCADA integration"**
- ✅ Mostly correct. Tighten to point at `/docs/edge-gateway/{modbus,opcua,mqtt,mtconnect,bacnet,siemens-s7,rockwell-ethernet-ip,beckhoff-ads}` — all 8 protocol docs DO exist with copy-pasteable YAML configs.
- Remove: SNMP (handbook says supported; not in `/docs/edge-gateway/`).

**Sections 9-13 — Worked examples (Haas / Cummins / Atlas Copco / Hospital / Forklift)**
- Keep the equipment + protocol details (those are real-world accurate).
- ❌ Old steps: "Equipment → machine → Connections → '+ Add Modbus TCP'" (no such tab)
- ✅ New steps: Pattern is always:
  1. Add machine in Myncel (`+ Add Machine` modal)
  2. Click into the machine → **Create Gateway Token**, copy it
  3. Download the Edge Gateway package from `/dashboard/gateway-setup` or `/docs/edge-gateway`
  4. Open the YAML config → paste the token → add a connector block (Modbus / OPC UA / MQTT / etc.) using the example at `/docs/edge-gateway/<protocol>`
  5. Run the agent (`python3 myncel-edge-gateway.py` on a Pi or industrial PC; or flash the ESP32 sketch)
  6. Within 30–60 seconds, live values appear in the machine's page
  7. Create PM schedules at `/admin/schedules` (or **Schedules** sidebar tab)
- ❌ "AI Settings → baseline window" → drop. Replace with "create a Predictive PM in **Schedules** with task type PREDICTIVE; the AI auto-baselines from incoming data."
- ❌ "Toyota I_Site / Crown InfoLink importer" → move to Roadmap. Replace with "Add each forklift manually or via the public REST API. For runtime hours, log them weekly via the mobile app or PM checklist."
- ❌ "Compressor pack predictive model toggle" → drop, replace with task-type=PREDICTIVE + the 3 sensor inputs.

**Section 14 — "Organizing equipment with locations and groups"**
- ❌ Old: "Org → Site → Building → Cell/Line/Floor/Room hierarchy + cross-cutting groups + scoped users"
- ✅ New: "Location is a free-text field today. Use a consistent format like 'Site → Building → Line' (e.g. 'Plant 1 — Bay A — Line 3'). Filtering and search work across the location text. A formal hierarchy with sites/buildings/cells is on our roadmap."
- Drop the "groups with rule-based auto-population" claim.

**Section 15 — "The equipment record"**
- ❌ Old: "Tabs: Overview / Work Orders / Schedules / Connections / Documents / Parts / Timeline. DWG preview."
- ✅ New: "Click any machine to open its detail panel. Today the panel shows: machine info, image, edit form, gateway tokens (Create / Revoke), and a list of recent work orders + schedules. A dedicated tabbed machine page with Documents, Parts, and full Timeline is on the roadmap."

### Work Orders chapter

**Section 6 — "Approval workflows"**
- ❌ Drop section. Move to Roadmap. (Not in schema.)

**Section 8 — "Recurring and templated work orders"**
- ❌ Old: "Define a WO template, set frequency..."
- ✅ New: "Recurring work is handled by **Schedules** (sidebar). Create a Maintenance Schedule with a frequency (DAILY / WEEKLY / BIWEEKLY / MONTHLY / QUARTERLY / BIANNUAL / ANNUAL / CUSTOM / BY_HOURS) and the system auto-generates a WO each time it falls due. Standalone reusable WO templates without a schedule are on the roadmap."

### Team & Roles chapter

**Section 4 — "Single sign-on (SSO) and SCIM provisioning"**
- ❌ Old: "Configure SAML in Settings → Security → SSO. SCIM v2 supported."
- ✅ New: "SSO/SAML and SCIM 2.0 provisioning are on the roadmap. Today, sign-in is via email + password (with optional 2FA) or Google OAuth. See the Roadmap chapter for status."

### Alerts & Notifications chapter

**Section 1 — "Notification channels"**
- ✅ Mostly OK. Keep EMAIL, SMS, PUSH, SLACK, WEBHOOKS. Remove Microsoft Teams (move to Roadmap).

### Integrations chapter

**Section 1 — "Communication tools"**
- ❌ Old: "Slack & Microsoft Teams"
- ✅ New: "Slack is supported today (`/settings/integrations` → Slack). Microsoft Teams is on the roadmap; you can use a Teams Incoming Webhook via our generic Webhooks integration in the meantime."

**Section 2 — "On-call paging (PagerDuty / Opsgenie)"**
- ❌ Old: dedicated integrations
- ✅ New: "On-call paging via PagerDuty Events API or Opsgenie Webhooks is on the roadmap. Today you can route critical alerts to PagerDuty or Opsgenie via our generic Webhooks integration — both accept a JSON POST."

### Mobile App chapter

**Section 4 — "Working offline"**
- ❌ Old: "Fully offline. Sync indicator. 4 GB extended cache."
- ✅ New: "Today the mobile app requires a network connection to fetch and submit data. Offline mode with automatic sync is on the roadmap (top priority for v1.1). The handbook itself IS available offline once you've opened the app — see Profile → 📖 Handbook (offline)."

## New chapter: 13. Roadmap (Coming Soon)

Brand new chapter at the end (just before Glossary, or after Troubleshooting). Lists in clear sections:
- Equipment & onboarding: CSV bulk import, named importers (SAP/Maximo/Limble/UpKeep/eMaint/Fiix/MaintainX/Hippo), telematics importers (Toyota I_Site, Crown InfoLink, Geotab, Samsara), 4-level location hierarchy, machine groups
- Equipment record: tabbed detail page, full Timeline, Documents tab, DWG/P&ID viewer
- Work orders: standalone templates, multi-step approval workflows
- Predictive: AI Settings UI with baseline window + per-machine model selection, ISO 10816 threshold defaults
- Integrations: Microsoft Teams (native), PagerDuty (Events API), Opsgenie, SAML SSO, SCIM 2.0 provisioning
- Mobile: offline mode + sync queue + indicator, extended offline cache
- Other: emergency broadcasts (already partially in `/settings/emergency-broadcast`)

Each item has: title, what it does, target release ("Q3 2026" / "v1.1" / "TBD"). Honest dates only.

## Verification before commit

1. Re-run TS typecheck on `lib/handbook/content.ts`
2. Re-bundle `myncel-mobile/src/handbook/content.json`
3. Verify chapter count, section count
4. Push + Vercel auto-deploys

## Estimated edit size

- ~150 lines changed in `lib/handbook/content.ts` (out of 1111)
- New Roadmap chapter: ~80 new lines
- Net: ~+0 line change overall (some removals, some additions)
