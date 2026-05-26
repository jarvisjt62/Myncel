# Myncel CMMS — Task Tracker

## ✅ Completed (recent)

- [x] **QR-label printable sheets** (multi-per-page) — 9 templates: Avery 5160/5163/5164 (Letter) + L7160/L7163/L7165/L7167 (A4) + thermal 50×80 + 100×150. Per-machine quantity, skip-first-N slots for partial-sheet reuse, sheet preview at 60%, pixel-perfect print via CSS Grid in mm units. Handbook updated. Committed `fee3244`.
- [x] **PagerDuty native integration** (Events API v2) — trigger / ack / resolve, severity-aware, auto-resolve on alert clear. Connect modal in /settings/integrations + handbook step-by-step. Committed `c919cd5`.
- [x] **Microsoft Teams native integration** (Adaptive Cards v1.4) — Incoming Webhook URL, severity → colour, confirmation card on connect. Connect modal + handbook. Committed `c919cd5`.
- [x] **Saved & scheduled reports** — 6 datasets (Work Orders, Alerts, Machines, Parts, Downtime, PM Compliance), on-demand CSV download, run+email, daily/weekly/monthly schedule with timezone-aware DST-safe nextRun, pause/resume, edit, delete. Vercel cron every 15 min. Mobile responsive. Handbook rewritten + Roadmap updated. Committed `0e184d3`.
- [x] **Multi-step approval workflows** — `ApprovalPolicy` + `ApprovalRequest` engine with PRE_START / PRE_CLOSE / VENDOR_QUOTE triggers, per-step permission OR named-user gates, requireAll flag, full step-walking + rollback, audit trail. Hooked into WO PATCH route — transitions to IN_PROGRESS / COMPLETED park the WO in new PENDING_APPROVAL status. `/approvals` user queue page (My Queue + All tabs, Approve/Reject/Cancel). `/settings/approvals` policy editor with up-to-10 ordered steps, priority/type/cost match criteria, pause/resume. 4 new permission keys seeded. Email notifications to approvers + requester. Mobile responsive (max-w-2xl modal, modal-safe-pad, flex-wrap actions). Handbook updated + Roadmap line removed.

## 🔧 Postponed (do not resume without explicit user request)

- [ ] **Samsung S24 Ultra status-bar overlap** — 3 attempts failed (v1 body class, v2 html class + display-mode standalone, v3 inline style + force-pt-safe-32 !important). User said postpone.

## 🎯 Next phase (in order)

- [ ] **4-level location hierarchy** — Site → Building → Floor → Room (instead of single `location` string). Migration + filters + breadcrumb UI. Update Equipment chapter.
- [ ] **Tabbed equipment detail page** — separate Documents / Parts / Timeline / Telemetry / Schedules tabs. In-browser DWG / P&ID preview. Update Equipment chapter.

## 🚀 Big bets (after the above)

- [ ] **Full mobile offline editing with sync queue** — Capacitor + IndexedDB queue + conflict resolution. Open WOs, complete checklists, attach photos offline → auto-sync on reconnect.
- [ ] **SAML 2.0 SSO + SCIM 2.0** — Okta, Azure AD / Entra, OneLogin, JumpCloud. Auto-provisioning + de-provisioning.
- [ ] **OBD-II / J1939 / NMEA 2000 fleet & marine connectors** — vehicles, heavy trucks, vessels.
- [ ] **AI Settings panel per machine** — per-machine threshold tuning, model selection, alert sensitivity.

## 📜 Standing rules (every shipped feature must satisfy)

1. Verify mobile responsiveness — mobile web (landscape + portrait) AND mobile apps (Android + iOS).
2. Update `lib/handbook/content.ts` — REMOVE shipped item from Roadmap chapter, INSERT detailed step-by-step content into the relevant chapter matching the existing `body[]` / `bullets[]` / `steps[]` / `callout` style.
