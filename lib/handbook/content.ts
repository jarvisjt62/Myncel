/**
 * lib/handbook/content.ts
 *
 * Single source of truth for the Myncel User Handbook.
 *
 * Each chapter has:
 *   - slug: URL slug (/handbook/[slug])
 *   - title: chapter heading
 *   - emoji: icon for sidebar/cards
 *   - summary: one-paragraph description (used on overview + cards)
 *   - sections: array of subsections, each with heading + body paragraphs
 *
 * Bodies use plain paragraphs and bullet lists (rendered with markdown-lite
 * renderer in app/handbook/[slug]/page.tsx). Keep facts grounded — this is
 * also the source the AI assistant pulls from, the exported PDF/DOCX, and
 * the native handbook screen in the iOS / Android app.
 */

export interface HandbookSection {
  heading: string;
  body: string[];
  bullets?: string[];
  steps?: string[];
  callout?: { type: 'tip' | 'warning' | 'info'; text: string };
}

export interface HandbookChapter {
  slug: string;
  emoji: string;
  title: string;
  summary: string;
  sections: HandbookSection[];
}

export const HANDBOOK_CHAPTERS: HandbookChapter[] = [
  // ------------------------------------------------------------------
  // 1. WELCOME / GETTING STARTED
  // ------------------------------------------------------------------
  {
    slug: 'getting-started',
    emoji: '🚀',
    title: 'Getting Started',
    summary:
      'A guided tour for first-time users — from creating your workspace to running your first work order. Designed to be read in under fifteen minutes.',
    sections: [
      {
        heading: 'What Myncel is (and is not)',
        body: [
          'Myncel is a modern Computerized Maintenance Management System (CMMS) built for facilities, plants, and field operations that need to keep physical equipment running. It tracks every asset, every work order, every spare part, every inspection, and every alert in one place — accessible from a browser, a phone, or a tablet, online or offline.',
          'Myncel is not a hardware vendor. We are an open platform. You can use any sensor, any PLC, any SCADA system that speaks one of the standard industrial protocols (MQTT, Modbus TCP, OPC-UA, Ethernet/IP, REST/Webhook). If you do not have sensors yet, manual logging works perfectly well and is included on every plan.',
          'Myncel is sold business-to-business: every account belongs to a company, hospital, hotel, fleet operator, property manager, or similar organization. Workspaces are created on the web by an authorized administrator; individual technicians, operators, and managers are then invited into that workspace by their employer.',
        ],
      },
      {
        heading: 'Creating your account (the free trial flow)',
        body: [
          'If your organization is brand new to Myncel, the person who signs up first becomes the workspace owner / Admin. Visit www.myncel.com and click the "Start free trial" button in the top right (it appears on every marketing page). You will be taken to a short sign-up form that asks for: your work email, a password, your full name, and your organization name. That is everything we need to spin up your workspace.',
          'After you submit the form you are signed in immediately and dropped onto the dashboard. There is nothing to install, no credit card required, and no sales call to schedule. Your workspace starts on a 30-day free trial of the Professional plan, which means every feature is unlocked from minute one — IoT, integrations, API keys, webhooks, work orders, schedules, reports, and the mobile app — so you can evaluate the product end-to-end without artificial limits.',
          'You will also receive a welcome email with a link you can bookmark. If you ever need to come back later, sign in at www.myncel.com/signin with the same email and password you just used.',
        ],
        callout: {
          type: 'tip',
          text: 'Use a real work email when you sign up. Myncel is a B2B product; trial accounts created with personal emails (gmail, hotmail, yahoo) still work but they cannot be migrated onto a paid corporate plan later without re-inviting your team.',
        },
      },
      {
        heading: 'Signing in (existing users)',
        body: [
          'Open www.myncel.com/signin (or click "Sign in" in the top-right of any Myncel page). Enter the email and password you used when the account was created. After a successful sign-in you land on the dashboard.',
          'If your workspace administrator has enabled Google sign-in for your organization, you can also click "Continue with Google" and use your Google Workspace account. This is the same as signing in with email — you end up in the same workspace either way; pick whichever is easier.',
          'If you forgot your password, click the "Forgot password?" link below the password field. We email you a one-time reset link that is valid for 30 minutes. Open it on the same device, choose a new password, and you are back in.',
        ],
        callout: {
          type: 'info',
          text: 'SAML 2.0 SSO and SCIM 2.0 auto-provisioning are now shipped. Compatible with Okta, Azure AD / Entra ID, Google Workspace, OneLogin, JumpCloud, Ping, and any standards-compliant IdP. See the Integrations chapter ("Single sign-on (SSO) and SCIM provisioning") for the full setup walkthrough. The previously listed roadmap item has shipped.',
        },
      },
      {
        heading: 'Joining as a teammate (you got an invite email)',
        body: [
          'If your manager already has a Myncel workspace and they invited you, the flow is even simpler. You will receive an email titled "You have been invited to join [Organization] on Myncel" with a single button: "Accept invitation". Click it.',
          'The invitation link drops you on a short form that is pre-filled with your email and your assigned role (Admin / Manager / Technician / Operator / Viewer). Pick a password, confirm your name, click "Accept invitation", and you are signed in — no separate sign-up step.',
          'Your manager does not need to share a password with you, and you do not need to remember an org code. The invitation link itself contains everything Myncel needs to put you in the right workspace with the right permissions. Bookmark www.myncel.com/signin so you can come back any time with the email + password you just chose.',
        ],
        callout: {
          type: 'warning',
          text: 'Invitation links expire after 7 days for security. If yours has expired, ask your manager to re-send it from Settings → Team → "Resend invitation" on your row.',
        },
      },
      {
        heading: 'Securing your account (2FA and password best practices)',
        body: [
          'Once you are signed in, take 60 seconds to harden your account. Open Settings → Security and you will see two-factor authentication (2FA) toggles. Myncel supports any standard TOTP authenticator app — Google Authenticator, 1Password, Authy, Microsoft Authenticator, Bitwarden — so you can use whichever you already have on your phone.',
          'Click "Enable 2FA". Myncel shows a QR code; scan it with your authenticator app, then type back the 6-digit code the app produces to confirm. After that, every sign-in will ask for your password plus the current 6-digit code. This is the single most effective thing you can do to keep your maintenance data safe — it is what blocks 99% of credential-theft attacks.',
          'Myncel also remembers up to 10 recovery codes the moment you enable 2FA. Print them or save them in your password manager — if you ever lose your phone, those codes are how you get back in. We cannot reset 2FA for you (that would defeat the point); recovery codes are the supported path.',
          'On the password side: Myncel enforces a minimum of 8 characters but we strongly recommend a passphrase generated by your password manager. Passwords can be changed any time at Settings → Security → "Change password".',
        ],
      },
      {
        heading: 'How the 30-day free trial works',
        body: [
          'When you create a brand-new workspace, the trial clock starts. For 30 days you have full Professional-plan access — every feature unlocked, no quotas, every protocol connector, the mobile app, AI alerts, and unlimited work orders.',
          'You can see exactly how many trial days remain at any time at Settings → Billing — there is a clearly-labeled banner at the top of that page. We also email you reminders at 7 days, 3 days, and 1 day before the trial ends so it never sneaks up on you.',
          'On day 31 the trial ends. Your data does not disappear and is never deleted — it just goes into read-only mode (the "Trial Expired" state). You can still sign in, view every work order, every machine, every report. You simply cannot create new ones until you pick a paid plan. Picking a plan from Settings → Billing instantly unlocks editing again, with all your historical data intact.',
        ],
      },
      {
        heading: 'The 30-second mental model',
        body: [
          'Three concepts cover ninety percent of daily Myncel usage. Spend a minute on each and the rest of the product will feel intuitive.',
        ],
        bullets: [
          'Equipment — the physical things you maintain (CNC machines, generators, HVAC units, forklifts, pumps, UPS systems, autoclaves, etc.). Each piece of equipment has a permanent record with its history, documents, and connected sensors.',
          'Work Orders — every unit of work performed on equipment. A work order has a status (Open → In Progress → Completed), a priority, a type (Corrective / Preventive / Inspection / Safety / Project), an assignee, parts, labor time, and an audit trail.',
          'Schedules & Alerts — the engines that automatically create work orders. A Schedule is time-or-usage based ("every 30 days", "every 500 hours"). An Alert is condition-based and is fired by sensors, the AI engine, or a manual report.',
        ],
      },
      {
        heading: 'Your first 10 minutes — recommended path',
        body: [
          'If you are evaluating Myncel for your team, the fastest path to "I get it" is the following sequence. Do not worry about getting things perfect; you can always edit or delete later.',
        ],
        steps: [
          'Sign in and confirm your organization name, time zone, and primary facility address are correct (Settings → Profile / Settings → Team).',
          'Add three to five real machines — even quickly, with just a name and location. Use Equipment → "+ Add Machine".',
          'Pick one of those machines and create a sample preventive-maintenance schedule (e.g. "Lubrication, every 14 days"). Use /admin/schedules → "+ New Schedule".',
          'Create a sample work order on that same machine ("Replace air filter") and assign it to yourself.',
          'Mark it In Progress, add 15 minutes of labor and a part, then mark it Completed.',
          'Open Reports → MTTR and you will see your first data point. Repeat with another machine to see the dashboard come alive.',
        ],
        callout: {
          type: 'tip',
          text: 'You will get the most realistic picture of Myncel by using your real equipment list, even just five rows of it. Demo data is okay for a 5-minute click-through, but the moment you put your own machine names in, the product clicks.',
        },
      },
      {
        heading: 'Roles you will meet',
        body: [
          'Myncel ships with five built-in roles. The role you pick when you invite someone determines what they can see and do. Detailed permissions live in the Team & Roles chapter, but here is the short version.',
        ],
        bullets: [
          'Admin — full access including billing, user management, integrations, and emergency broadcasts. Usually the maintenance manager or facility director.',
          'Manager — full operational access; can configure schedules, approve work orders, and view all reports, but cannot change the bill or remove other admins.',
          'Technician — sees and works on assigned work orders, logs time and parts, and completes checklists. The day-to-day power user.',
          'Operator — sees the machines they run and reports issues. Read-only on most other things.',
          'Viewer — read-only across the workspace. Useful for executives, auditors, and external stakeholders.',
        ],
      },
      {
        heading: 'Where to go next',
        body: [
          'If you are a maintenance manager or facility owner, read the Equipment chapter next — that is where 90% of your setup time will be spent. If you are a technician who has just been invited, jump straight to the Mobile App chapter so you can install Myncel on your phone before your next shift.',
        ],
      },
    ],
  },
  // ------------------------------------------------------------------
  // 2. EQUIPMENT & MACHINES (the deep-dive chapter)
  // ------------------------------------------------------------------
  {
    slug: 'equipment',
    emoji: '⚙️',
    title: 'Equipment & Machines',
    summary:
      'Everything about adding, organizing, and connecting your equipment to Myncel — from a one-line manual entry through full IoT retrofits to direct PLC and SCADA integration. Includes five fully worked examples.',
    sections: [
      {
        heading: 'Equipment categories Myncel supports',
        body: [
          'Myncel is industry-agnostic. The following categories are the ones we have first-class templates for, but you can always pick "Custom" and define your own. A template pre-fills recommended preventive-maintenance intervals, common sensor types, expected failure modes, and a starter checklist.',
        ],
        bullets: [
          'CNC machine tools — mills, lathes, machining centers, swiss-style lathes, plasma / waterjet / laser cutters, EDM machines.',
          'Presses & forming — hydraulic and pneumatic presses, stamping presses, injection-molding machines, blow-molders, extruders.',
          'Air & fluid handling — air compressors (rotary screw, reciprocating, scroll), vacuum pumps, hydraulic power units, dryers, chillers.',
          'Material handling — conveyors (belt, roller, chain), AGVs, AS/RS, hoists, cranes, palletizers.',
          'Welding & fabrication — robotic welding cells, MIG / TIG stations, press brakes, shears.',
          'Rotating equipment — pumps, motors, gearboxes, fans, blowers, agitators, mixers.',
          'HVAC & building services — chillers, cooling towers, AHUs, boilers, heat pumps, exhaust fans.',
          'Electrical — generators, ATS, switchgear, transformers, UPS systems, PDUs.',
          'Mobile assets — forklifts, scissor lifts, telehandlers, sweepers, yard trucks, fleet vehicles.',
          'Healthcare equipment — autoclaves, sterilizers, refrigerators / freezers, imaging systems (non-clinical maintenance side), dialysis chairs.',
          'Hospitality & property — kitchen equipment, ice makers, dishwashers, laundry, elevators, escalators, pool systems.',
          'Process & utility — boilers, heat exchangers, water-treatment skids, RO systems, dust collectors, scrubbers.',
          'Telecom & data center — racks, CRAC / CRAH units, generators, UPS, fire-suppression panels.',
          'Custom — anything not listed above. Pick "Custom" and define the asset class yourself.',
        ],
      },
      {
        heading: 'How to add a single machine (the 60-second flow)',
        body: [
          'Adding a machine to Myncel takes well under a minute. The only required field is the machine name — everything else can be filled in later as you have time. To reach the Equipment screen, sign in and click the Equipment tab in the left sidebar of your dashboard.',
        ],
        steps: [
          'In the left sidebar of /dashboard click Equipment.',
          'Click the "+ Add Machine" button. The "Add New Machine" modal opens.',
          'Enter the Machine Name (required) — e.g. "CNC Mill #3" or "Genset-Bldg-A".',
          'Optionally fill in: Serial Number, Year Installed, Manufacturer, Model, Category (CNC, Compressor, Generator, Pump, …), Status (Operational / Maintenance / Breakdown / Retired), Criticality (Low / Medium / High / Critical), Location (free text — we recommend the format "Site — Building — Line", e.g. "Plant 1 — Bay A — Line 3"), and Notes.',
          'Click "+ Create Machine". The new machine appears in your equipment list immediately, ready to receive work orders, schedules, and sensor data.',
          'After creation, click into the machine to upload a photo (Machine Image area), create gateway tokens for sensor data, attach work orders, and review history.',
        ],
        callout: {
          type: 'tip',
          text: 'Use a consistent naming pattern such as "[Type]-[Cell]-[#]" (e.g. "MILL-A-03") or "[Building]-[Type]-[#]" (e.g. "WHA-CONV-12"). Consistent names make work orders, reports, alerts, and search dramatically easier once your fleet grows past 20 machines.',
        },
      },
      {
        heading: 'Bulk-importing your existing equipment list',
        body: [
          'If you already have an asset list in a spreadsheet, an old CMMS export, or a SAP / Maximo extract, you do not have to retype every row by hand. Myncel exposes a public REST API that accepts JSON over HTTPS — point a small script at it and your fleet is in within minutes.',
        ],
        steps: [
          'Open /api/docs to view the OpenAPI spec for the Machine endpoints (POST /api/machines).',
          'Generate a personal API key in /settings/api-keys.',
          'Convert your spreadsheet to JSON (one machine per object) using your tool of choice — Excel "Save as JSON", a 10-line Python script, or any AI assistant.',
          'POST each row to /api/machines with header Authorization: Bearer <api-key>. Required field is name; everything else (serialNumber, manufacturer, model, category, criticality, location, yearInstalled, notes) is optional.',
          'Verify in /dashboard → Equipment that all machines arrived. Edit individual records inline or in bulk by re-issuing PUT requests.',
        ],
        bullets: [
          'The public API is rate-limited (60 requests/minute per key). For a 500-machine import that means roughly 9 minutes of polite throughput — fine for a one-time migration.',
          'Common starter script: 25 lines of Python with `requests`. We can share a template — ask in /support and a human will reply with one tailored to your CSV columns.',
          'Migrating from SAP PM / IBM Maximo / Limble / UpKeep / eMaint / Fiix / MaintainX / Hippo with automatic column mapping is on the roadmap (see the Roadmap chapter).',
        ],
        callout: {
          type: 'info',
          text: 'A spreadsheet-style CSV importer with column-mapping UI is the next item on our equipment-onboarding roadmap. It will live at /equipment → "Import" once shipped. Until then, the public API is the supported path.',
        },
      },
      {
        heading: 'QR codes and asset tagging',
        body: [
          'Every machine in Myncel automatically gets a unique QR code. Print the QR sticker, apply it to the machine, and any technician with the mobile app can scan it to instantly land on that machine\'s page — its history, open work orders, attached info, and a one-tap "Create Work Order" button.',
          'QR codes are durable and cheap. We recommend printing on weatherproof polyester labels (3M 7811 or similar). For outdoor or wash-down equipment, laminate them or use stainless-steel etched tags with the same code.',
          'Myncel ships with a built-in QR Label Sheet generator at /equipment/qr-labels. It supports the most common sticker-sheet formats out of the box, prints multiple labels per page aligned to the perforations, and lets you reuse partial sheets without wasting stickers. The generator runs entirely in your browser — there is no upload, no third-party service, and the labels never leave your device until you hit Print.',
        ],
        steps: [
          'Open /equipment/qr-labels (or click "Print QR" from a machine\'s detail panel).',
          'Choose a Sheet Template that matches the sticker sheet you have. The generator includes Avery 5160 / 5260 (30 per Letter sheet, the most common US format), Avery 5163 (10 per page), Avery 5164 (6 per page, largest), and the European A4 equivalents L7160 (21 per A4), L7163 (14 per A4), L7165 (8 per A4), and L7167 (1 per A4 — full-page poster). Single-label thermal printers are also supported (50×80 mm and 100×150 mm presets cover Brother QL-820NWB, Dymo LabelWriter, and Zebra GK420 / ZD420).',
          'In the Show on Label panel, toggle the fields you want printed under the QR — Serial Number, Location, Status Badge, and Manufacturer / Model. Less is more on small labels (Avery 5160) — just the machine name and S/N is plenty. On Avery 5164 you can show everything.',
          'Set the App URL field. The QR code on each label will encode that URL plus the machine\'s ID, e.g. https://www.myncel.com/equipment/clx123abc. When a phone camera scans the code it opens that link directly. If your tenant uses a custom domain, paste it here.',
          'In the Machines panel, untick any machine you do not want a label for. For each ticked machine you can also set a Quantity (1–99) — useful when you want 5 identical labels for one machine to apply on multiple sides of a large vessel or on its access doors.',
          'If you are reusing a sticker sheet that already has some labels missing (very common — you printed 3 last week and 27 are still on the sheet), set Skip first slots to 3. The first 3 grid positions on the first sheet stay blank so the printer skips over them and your new labels land on the still-attached stickers.',
          'Inspect the on-screen preview. Every sheet shows in the preview at 60% scale with the exact mm dimensions of the chosen template. The header tells you exactly how many labels and how many sheets you are about to print, e.g. "120 labels on 4 sheets". Click any individual label to enlarge the QR for a quick visual check.',
          'Click "🖨️ Print N labels (M sheets)". A new browser tab opens with a print-ready document and the print dialog opens automatically. In the dialog: set Scale to 100% (NOT "Fit to page" — that throws off the perforation alignment), tick Background graphics so the colored status badges print, and pick the right paper size (Letter for 5160 / 5163 / 5164; A4 for L7160 / L7163 / L7165 / L7167).',
          'Apply the labels to a flat, clean, eye-level surface on each machine — typically next to the controls or on the maintenance access panel. Test by scanning with the Myncel mobile app from arm\'s length.',
        ],
        bullets: [
          'Avery 5160 / 5260 — 30 labels per Letter sheet. The cheapest and most-stocked format. Labels are 25.4 × 66.7 mm (1" × 2⅝") — small but enough for the QR plus machine name and S/N.',
          'Avery 5163 / 5263 — 10 labels per Letter sheet. Labels are 50.8 × 101.6 mm (2" × 4"). Plenty of room for QR + name + manufacturer + model + S/N + location + status badge.',
          'Avery 5164 / 5264 — 6 labels per Letter sheet. Labels are 84.7 × 101.6 mm (3⅓" × 4"). Best for large outdoor equipment where the label needs to be legible from across a yard.',
          'Avery L7160 (21 / A4), L7163 (14 / A4), L7165 (8 / A4), L7167 (1 / A4) — the European A4 line. Same idea, different paper size.',
          'Thermal printers — Brother QL-820NWB, Dymo LabelWriter 550, Zebra ZD420 / GK420. Pick the 50×80 mm or 100×150 mm preset, set your printer to use the correct continuous-roll size, and Myncel emits one label per "page" so the printer cuts cleanly between labels.',
        ],
        callout: {
          type: 'info',
          text: 'QR codes are also used for parts and locations. A storeroom shelf, a cabinet, or a chemical drum can all carry a Myncel QR — scanning takes you to that record in one tap.',
        },
      },
      {
        heading: 'Connecting equipment to Myncel — the three options',
        body: [
          'You can connect a machine to Myncel in three different ways depending on your budget, the age of the equipment, and your existing network. You can mix and match across your fleet — most customers manually log usage on older machines while streaming live data from the newer or more critical ones.',
        ],
        bullets: [
          'Option 1 — Manual logging. No hardware. Operators or technicians punch runtime, cycle counts, and observed issues into Myncel from a phone or tablet.',
          'Option 2 — IoT sensor retrofit. Wireless vibration, temperature, current, or runtime sensors that mount onto existing equipment and stream to a small Myncel Edge Gateway.',
          'Option 3 — Direct PLC / SCADA integration. Read straight from the machine\'s controller using OPC-UA, Modbus TCP, MQTT, Ethernet/IP, or BACnet/IP.',
        ],
      },
      {
        heading: 'Option 1 — Manual logging (no hardware)',
        body: [
          'The simplest option requires no hardware at all. Operators or technicians log runtime, cycle counts, and observed issues directly into Myncel using a phone or tablet on the shop floor.',
          'This works great for legacy equipment that has no PLC or network port, for low-criticality assets where sensors are not cost-justified, or simply for getting started while the IT/OT team scopes a sensor rollout.',
          'Schedules trigger based on calendar days or manually-entered runtime hours, and alerts fire whenever someone reports an anomaly. You still get the full power of work orders, PMs, parts, reports, and AI-assisted root-cause analysis.',
        ],
        bullets: [
          'Cost: $0 — included on every plan.',
          'Setup time: zero. Just add the machine and start using it.',
          'Data quality: depends entirely on operator discipline.',
          'Best for: machines that lack network connectivity, low-criticality assets, fleets just starting out.',
        ],
      },
      {
        heading: 'Option 2 — IoT sensor retrofit (recommended for most customers)',
        body: [
          'For machines that lack a built-in network connection, Myncel supports a range of low-cost wireless IoT sensors that retrofit onto existing equipment. The sensors stream vibration, temperature, current, and runtime data through a small piece of software called the Myncel Edge Gateway, which forwards everything securely to the cloud.',
          'The Edge Gateway is open-source software you run on hardware you already own — a Raspberry Pi 4, a small industrial PC, an ESP32 microcontroller, or even a Linux container on an existing server. It buffers locally if your internet drops, then catches up when the link comes back. Download it from /docs/edge-gateway or /dashboard/gateway-setup. Builds are available as a Python package, a Raspberry Pi image, an ESP32 Arduino sketch, and a Node-RED flow.',
        ],
        steps: [
          'Choose your gateway hardware. A $40 Raspberry Pi 4 covers most small shops; an industrial Linux PC is recommended for plant-scale deployments. For a single piece of equipment with no network, an ESP32 microcontroller is the cheapest option.',
          'Add the machine in Myncel (Equipment → "+ Add Machine"). Then click into the machine to open its detail panel.',
          'In the detail panel, find the "Edge Gateway Tokens" area and click "Create Gateway Token". Copy the token immediately — Myncel only shows it once. The notice on screen tells you to paste it into your YAML config under "device_token:".',
          'Download the gateway package from /docs/edge-gateway → "Download package" (or pick the matching artifact for your hardware: Raspberry Pi image, ESP32 sketch, Node-RED flow).',
          'Open the example YAML config that ships with the package. Set device_token: <paste your token>, then add a connector block for each protocol or sensor — see /docs/edge-gateway/<protocol> for ready-to-paste examples (Modbus TCP, OPC UA, MQTT, MTConnect, BACnet/IP, Siemens S7, Rockwell EtherNet/IP, or Beckhoff ADS).',
          'Run the agent (`python3 myncel-edge-gateway.py` for the Python package, flash the sketch for ESP32, or import the Node-RED flow). Within 30–60 seconds, live values appear on the machine\'s detail panel in Myncel.',
          'Mount any physical sensors on the target machine following the install guide that ships with the kit (typical install: 5–15 minutes per machine, no downtime needed in most cases).',
          'Create a PM schedule in /admin/schedules (or the Schedules sidebar tab). For predictive maintenance, set Task Type = PREDICTIVE — Myncel will baseline from incoming data automatically over the first 7–14 days and start firing predictive alerts after that.',
        ],
        bullets: [
          'Vibration sensors — three-axis MEMS or piezo accelerometers. Detect bearing wear, imbalance, misalignment, looseness, gear-mesh issues, and cavitation in pumps. Typical range 0–16 g, frequency response to 5 kHz, ISO 10816 compliant.',
          'Temperature sensors — surface-mount or PT100 RTD. Detect overheating motors, friction, fluid degradation, and cooling-system failures. ±0.5 °C typical accuracy.',
          'Current sensors — non-invasive split-core CT clamps (no downtime to install). Detect overload, undercurrent, motor degradation, and unbalanced phases.',
          'Runtime / cycle counters — magnetic, inductive, or optical. Drive PM schedules from actual usage instead of calendar days using the BY_HOURS schedule frequency.',
          'Pressure / flow / level — for hydraulic, pneumatic, and process systems. 4–20 mA or 0–10 V analog inputs to the gateway.',
        ],
        callout: {
          type: 'info',
          text: 'You do not have to buy hardware from Myncel. Any sensor that speaks MQTT, Modbus TCP, OPC UA, or sends webhook JSON can be ingested through the gateway. We work with sensors from Banner Engineering, Senseye, Augury, KCF, Petasense, Treon, and many others — the gateway YAML simply maps each one to a machine.',
        },
      },
      {
        heading: 'Option 3 — Direct PLC / SCADA integration',
        body: [
          'Modern PLCs and SCADA systems already produce a wealth of data. Myncel can read directly from them through standard industrial protocols, removing the need for additional sensors. This is usually the lowest-cost option per data point if the machines already have a controller and a network drop.',
          'Configuration uses the same Edge Gateway from Option 2 — you simply add a connector block to the YAML config for the protocol you need. Each protocol has its own page under /docs/edge-gateway with copy-pasteable examples for the most common controllers.',
          'For Starter and Growth plans you can use the Edge Gateway in MQTT-bridge mode, which lets a third-party SCADA system push data through the gateway. Direct OPC UA and proprietary protocols (Siemens S7, Rockwell EtherNet/IP, Beckhoff ADS) are included on Professional and Enterprise plans.',
        ],
        bullets: [
          'OPC UA — secure, modern, the industry standard for new installs. Works with Siemens, Beckhoff, B&R, Kepware, Ignition, and most modern PLCs. See /docs/edge-gateway/opcua.',
          'Modbus TCP / RTU — universal. If a controller is older than 5 years and on Ethernet, it almost certainly speaks Modbus TCP. Read holding registers, input registers, coils, and discrete inputs. See /docs/edge-gateway/modbus.',
          'MQTT (incl. Sparkplug B) — lightweight, broker-based. Excellent for high-fanout fleets and IIoT use cases. See /docs/edge-gateway/mqtt.',
          'Rockwell EtherNet/IP (CIP) — Allen-Bradley / Rockwell PLCs (CompactLogix, ControlLogix, MicroLogix). See /docs/edge-gateway/rockwell-ethernet-ip.',
          'Siemens S7 — direct read from S7-300, S7-400, S7-1200, S7-1500 over ISO-on-TCP. See /docs/edge-gateway/siemens-s7.',
          'BACnet/IP — building automation systems, HVAC, lighting, energy meters. See /docs/edge-gateway/bacnet.',
          'MTConnect — pull CNC machine status, execution state, spindle load, alarms, and production data from MTConnect agents. See /docs/edge-gateway/mtconnect.',
          'Beckhoff ADS — TwinCAT symbols by AMS Net ID and symbol name. See /docs/edge-gateway/beckhoff-ads.',
          'REST / Webhook — anything that can POST JSON over HTTPS lands via /api/iot/ingest with your API key.',
          'SNMP v2c / v3 (IT and network gear — UPS, switches, PDUs) is on the roadmap. See the Roadmap chapter for status.',
        ],
        callout: {
          type: 'warning',
          text: 'Always coordinate with your controls engineer or system integrator before connecting Myncel to a production PLC. Use a read-only account on the PLC whenever possible. Never write to a register from a CMMS in production unless the change-management process is fully understood.',
        },
      },
      {
        heading: 'Worked example A — Haas VF-2 CNC mill (sensor + Modbus TCP)',
        body: [
          'A small machine shop has a Haas VF-2 vertical machining center (3-axis, 7.5 kW spindle, 8,100 RPM). The shop wants to (a) detect spindle-bearing degradation early and (b) bill customers from real spindle-on hours instead of estimates. The VF-2 has a built-in Ethernet port (the Haas Networking option) and the shop already has Wi-Fi on the floor.',
          'Recommended hybrid setup: one wireless triaxial vibration sensor on the spindle housing for predictive diagnostics, plus a Modbus TCP read from the VF-2\'s NGC control for spindle-load percentage and runtime.',
        ],
        steps: [
          'Add the Haas VF-2 in Myncel: Equipment → "+ Add Machine" → Name = "Haas VF-2 — Bay A", Manufacturer = "Haas", Model = "VF-2", Category = "CNC Mill", Criticality = "High". Save.',
          'Click the new machine to open the detail panel. Find the "Edge Gateway Tokens" area and click "Create Gateway Token". Copy the token (it is shown once).',
          'Wire the VF-2 to the shop network (the Haas comes with an RJ45 port on the back of the cabinet). Note the IP address from Setting #900 on the Haas control.',
          'On any Linux machine on the same network — a Raspberry Pi 4 is plenty — download the Edge Gateway package from /docs/edge-gateway. Open the YAML config; paste the token under device_token: and add a Modbus TCP connector block following the example at /docs/edge-gateway/modbus.',
          'Configure the Modbus block: host = the VF-2 IP, port = 502, unit_id = 1. Add register definitions: holding register 30001 → spindle_load_pct, 30002 → spindle_rpm, 30010 → cycle_time, coil 00001 → in_cycle (drives runtime accumulation).',
          'Mount the vibration sensor on the spindle housing with its magnetic base, X-axis aligned to the machine\'s X. Wire it to the same gateway over USB or BLE (gateway plug-ins are documented under /docs/edge-gateway).',
          'Run the gateway agent: `python3 myncel-edge-gateway.py`. Within 30–60 seconds the live spindle-load %, RPM, and vibration RMS appear on the machine\'s detail panel in Myncel.',
          'Create a runtime-based PM in /admin/schedules: Title = "Spindle grease — 500 hr", Task Type = PREVENTIVE, Frequency = BY_HOURS, interval = 500. Because runtime is now live from Modbus coil 00001, the PM fires when actual spindle-on hours hit 500 — never on a fixed calendar day.',
          'Create a predictive PM as well: Title = "Spindle bearing health watch", Task Type = PREDICTIVE, Frequency = WEEKLY. The AI baselines from the incoming vibration data over the first 7–14 days; predictive alerts then fire automatically when the signature drifts past ISO 10816-3 zone B/C (4.5 mm/s RMS) or zone C/D (7.1 mm/s RMS).',
        ],
        callout: {
          type: 'tip',
          text: 'After 14 days you can also enable the AI "tool wear" model on this machine — it correlates spindle-load drift with cycle count to predict when end-mills are dull. Customers with similar setups typically see 20–30% reduction in scrapped parts.',
        },
      },
      {
        heading: 'Worked example B — Cummins 250 kW standby generator (Modbus TCP)',
        body: [
          'A hospital has a Cummins QSL9-G5 250 kW standby generator with a PowerCommand 2100 controller. The facilities team needs (a) automatic logging of the weekly self-test run, (b) alerts on low-fuel and low-coolant, and (c) compliance evidence for The Joint Commission inspections.',
          'The PowerCommand 2100 has built-in Modbus TCP. Once the controller is on the building network, Myncel can read every parameter the local screen shows — no extra hardware needed.',
        ],
        steps: [
          'Confirm the PowerCommand network module is installed and configured (Settings → Network → Modbus on the controller front panel; default port 502).',
          'Add the genset in Myncel: Equipment → "+ Add Machine" → Name = "Genset 250kW — Bldg A", Manufacturer = "Cummins", Model = "QSL9-G5 / PowerCommand 2100", Category = "Generator", Criticality = "Critical".',
          'Click into the new machine and create a Gateway Token (copy it once).',
          'On the BMS server, a Raspberry Pi in the building, or any always-on Linux box on the same network, install the Edge Gateway package (download from /docs/edge-gateway).',
          'Edit the YAML config: paste the token under device_token: and add a Modbus TCP connector following /docs/edge-gateway/modbus. host = the PowerCommand IP, port = 502, unit_id = 1.',
          'Map the standard PowerCommand registers: 30001 → engine_rpm, 30015 → coolant_temp_f, 30022 → oil_pressure_psi, 30040 → fuel_level_pct, 30050 → battery_voltage, 30100 → fault_bitmask.',
          'Run the gateway agent — values appear in the Myncel machine page within 60 seconds.',
          'Create three rule-based alerts in /settings/notifications: (1) fuel_level_pct < 30 → email facility manager; (2) coolant_temp_f > 220 OR oil_pressure_psi < 25 while engine_rpm > 0 → SMS to on-call electrician; (3) fault_bitmask != 0 → SMS + Slack #on-call channel.',
          'Create a calendar PM in /admin/schedules: Title = "Weekly self-test verification", Task Type = PREVENTIVE, Frequency = WEEKLY. The auto-generated work order each Tuesday includes a checklist asking the technician to confirm the genset ran ≥ 30 minutes the previous Sunday — Myncel auto-fills runtime from the live data so the technician only has to confirm.',
        ],
        bullets: [
          'Total wiring needed: zero — the controller already has Ethernet.',
          'Configuration time: typically 45 minutes including PM checklist authoring.',
          'Compliance bonus: every weekly run is now permanently logged with timestamps, runtime, peak load, and any fault codes — exactly what NFPA 110 inspectors ask for.',
        ],
      },
      {
        heading: 'Worked example C — 200 hp Atlas Copco GA-160 air compressor (sensor + protocol)',
        body: [
          'A plant has a 200 hp Atlas Copco GA-160 oil-injected rotary-screw compressor with an Elektronikon Mk5 controller. Compressed air is plant-critical and a failure costs roughly $3,500/hour in downtime. The plant wants early warning on motor and air-end health, plus automatic energy reporting.',
          'Recommended setup: three split-core CT clamps on the motor leads (no downtime to install), one vibration sensor on the air-end, and Modbus TCP to the Elektronikon for pressure, temperature, and load percentage. This combination catches all three failure paths — electrical, mechanical, and process — with zero false negatives in our customer data.',
        ],
        steps: [
          'Add the compressor in Myncel: Equipment → "+ Add Machine" → Name = "GA-160 #1", Manufacturer = "Atlas Copco", Model = "GA-160", Category = "Compressor", Criticality = "Critical".',
          'Click into it and create a Gateway Token (copy once).',
          'Install the CT clamps on the three motor phases inside the motor disconnect (qualified electrician; can be done energized with proper PPE in 20 minutes). Wire them to a Raspberry Pi or industrial PC running the Edge Gateway, using the analog or pulse input pattern documented at /docs/edge-gateway.',
          'Bond a vibration sensor to the air-end housing on the discharge side, axis aligned with the rotor. Wire it to the same gateway.',
          'In the YAML config: paste the token under device_token: and add a Modbus TCP connector following /docs/edge-gateway/modbus, pointing at the Elektronikon Mk5 (the EKOMI protocol module is included on Mk5 controllers from 2017 onward). Map: register 30030 → discharge_pressure, 30040 → element_outlet_temp, 30100 → motor_running_hours, coil 00010 → loaded (drives loaded-hours accumulation).',
          'Run the gateway agent. Live current draw, vibration RMS, pressure, temperature, and loaded/unloaded state appear in Myncel.',
          'Create predictive and runtime-based PMs in /admin/schedules: (1) "Air-end oil change" — Task Type = PREVENTIVE, Frequency = BY_HOURS, interval = 4000 loaded hours; (2) "Separator element" — same; (3) "Motor grease" — interval = 8000 hours; (4) "Compressor health watch" — Task Type = PREDICTIVE, Frequency = WEEKLY (the AI baselines from the three sensor streams and surfaces bearing wear, valve leaks, and impending element failure 2–6 weeks early).',
          'Create a daily energy report from /admin/reports: kWh per Nm³ of delivered air. The report flags any day that runs >10% above the 30-day rolling baseline — usually that means a leak or a stuck unloader.',
        ],
        callout: {
          type: 'info',
          text: 'The same pattern works for Kaeser, Ingersoll Rand, Sullair, Quincy, and Gardner Denver compressors — only the Modbus register addresses change. Each manufacturer\'s manual lists them; the Edge Gateway YAML simply maps the addresses to friendly names.',
        },
      },
      {
        heading: 'Worked example D — Hospital UPS, autoclave, and refrigeration (BACnet + SNMP)',
        body: [
          'A 120-bed hospital uses Myncel to manage three categories of biomedical-adjacent equipment: APC / Eaton UPS systems in IT and the OR; Tuttnauer and Steris autoclaves in CSSD; and walk-in refrigerators / freezers for the pharmacy and lab. All three connect over the existing hospital BMS network.',
          'This example shows how Myncel handles a heterogeneous facility where you do not have one big PLC but many small controllers, each speaking a different dialect.',
        ],
        bullets: [
          'UPS systems — most APC and Eaton network management cards (APC AP9641, Eaton Network-M2) expose values over both SNMP v3 and a small REST API. The Edge Gateway can poll the REST endpoint and post the values to /api/iot/ingest with your API key — the same pattern shown in /docs/edge-gateway. Map runtime-on-battery, output load %, battery age, and self-test result. Alert on any "On Battery" event longer than 30 seconds, on battery age > 4 years, and on any failed self-test. (Native SNMP support is on the roadmap.)',
          'Autoclaves — most modern Tuttnauer and Steris units expose a serial or Ethernet port that streams cycle data (start time, peak temperature, hold time, cycle pass/fail). Myncel ingests via REST webhook: point the autoclave\'s printer-replacement module at /api/iot/ingest with your API key. Each completed cycle becomes a permanent record attached to the autoclave\'s machine page — exactly what JCI surveyors ask for.',
          'Walk-in refrigeration — usually monitored by a building-management system (Johnson Controls Metasys, Honeywell EBI, Schneider EcoStruxure). Myncel reads via BACnet/IP through the Edge Gateway (see /docs/edge-gateway/bacnet) or directly via the BMS\'s REST API where supported. Critical-temperature alerts (> -15 °C in a freezer for > 10 minutes) escalate via SMS and to your on-call channel via the Webhooks integration.',
        ],
        callout: {
          type: 'tip',
          text: 'For Joint Commission, CMS, and CAP inspections the value is enormous — every cycle, every battery test, every temperature excursion is timestamped and exportable as a PDF in two clicks.',
        },
      },
      {
        heading: 'Worked example E — Forklift and yard-truck fleet (QR + telematics)',
        body: [
          'A 1.4 million sq ft distribution center runs a fleet of 38 Toyota and Crown sit-down forklifts plus 6 Ottawa yard trucks. There is no single PLC and no Wi-Fi outdoors. The team wants daily pre-shift inspections, runtime-based PM, and a complete event log for OSHA inspections.',
          'Recommended setup: one Myncel QR sticker per truck. Operators do the pre-shift inspection on their phone in under two minutes via the Myncel mobile app; runtime hours are logged through the same checklist (or pulled from telematics via the public REST API for shops that already run Toyota I_Site, Crown InfoLink, Geotab, or Samsara).',
        ],
        steps: [
          'Add each truck in Myncel: Equipment → "+ Add Machine". Use a consistent name pattern such as "FORK-001 Toyota 8FGCU25" so search and reports stay clean. (For 38+ trucks, use the public REST API — POST /api/machines — with a small script to import the list in one go; see "Bulk-importing your existing equipment list" earlier in this chapter.)',
          'In /equipment/qr-labels, choose label size Small (50×50 mm), select all forklifts, and print. Apply each sticker next to the OEM data plate or on the dashboard.',
          'Author one shared "Pre-shift inspection" PM in /admin/schedules: Title = "Pre-shift inspection", Task Type = INSPECTION, Frequency = DAILY. The auto-generated work order each shift includes a checklist (parking brake, horn, forks, mast, leaks, tires, OSHA 1910.178 items). Operators tap through it on their phone.',
          'Set runtime-based PMs per OEM schedule: 250-hour service, 500-hour service, 1,000-hour service. Use Frequency = BY_HOURS with the appropriate interval. Hours are logged either by the operator at shift end (through the inspection checklist) or pushed automatically via the shipped telematics importers — Geotab, Samsara, Verizon Connect, Motive, and Fleetio are now native (see /docs/telematics); for Toyota I_Site / Crown InfoLink, pull data via their public APIs into a small scheduled script that POSTs to /api/telematics/import?provider=generic.',
          'For impact monitoring: if your telematics provider already detects impacts, POST those events to /api/telematics/import (or /api/iot/ingest) with type = "impact" and severity = the g-force. Myncel auto-creates a Safety work order on the matching truck with the operator and timestamp. (Native I_Site / InfoLink one-click setup is still on the roadmap; Geotab/Samsara/Verizon/Motive/Fleetio are shipped today.)',
        ],
        bullets: [
          'No PLCs touched, no extra hardware on the trucks, no electrician involved.',
          'OSHA recordkeeping for daily inspections (29 CFR 1910.178(q)(7)) is satisfied automatically — every checklist is timestamped with operator ID and exportable as PDF or CSV.',
          'Same pattern works for scissor lifts (Genie, JLG), telehandlers, sweepers, and fleet vehicles.',
        ],
      },
      {
        heading: 'Organizing equipment with locations',
        body: [
          'Myncel ships a four-level structured location hierarchy out of the box: Site → Building → Floor → Room. Every level is optional, so you can use as little or as much depth as your operation needs. A single-building manufacturer might only use Site + Building + Room. A multi-campus hospital network will use all four. Each Machine record can be linked to one Site, one Building, one Floor, and one Room — and as you set a deeper level the parents are inferred and locked so the chain stays consistent.',
          'Alongside the structured hierarchy, every machine still has a free-text Location label that you can use as a quick fallback (handy for one-off zones that don\'t deserve their own Site, like "Shipping Dock 4" inside a building you haven\'t mapped). Search matches across the structured names AND the free-text label, so either approach works.',
        ],
        bullets: [
          'A Site is one physical address (e.g. "Plant 1", "Houston Yard", "Mercy Hospital — Main Campus"). Optional fields: short code, address, timezone.',
          'A Building lives inside a Site (e.g. "Building A", "Warehouse 3", "ICU Wing"). Buildings inherit the Site\'s timezone.',
          'A Floor lives inside a Building. Use the optional level number for sorting (-1 basement, 0 ground, 1 first floor, …).',
          'A Room lives on a Floor. Use this for bays, lines, mech rooms, OR suites — anywhere a single piece of equipment lives.',
          'Equipment list filters by any combination of these levels. Pick a Site to see all machines at that site; pick Site + Building + Floor + Room to drill all the way down.',
          'When you select Room first, Myncel auto-populates the Floor / Building / Site so you never have a Room pointing to the wrong Floor.',
        ],
        steps: [
          'Go to Settings → Locations.',
          'Click "+ Add Site" and give the first site a name (e.g. "Plant 1"). Optionally add a short code, address, and timezone. Save.',
          'Click the site row to expand it, then "+ Building". Repeat per building you maintain.',
          'Expand a building, click "+ Floor". Repeat per floor.',
          'Expand a floor, click "+ Room". Repeat per bay / line / mech room / OR.',
          'Open Equipment → "+ Add Machine" (or "Edit" on an existing machine). Use the Site / Building / Floor / Room dropdowns under "Location (structured)" — selecting a Site narrows the Building dropdown, and so on.',
          'Optional: keep using the free-text "Location label" field for quick descriptions on top of (or instead of) the structured picker. Every screen displays the structured breadcrumb when set, falling back to the free-text label.',
        ],
        callout: {
          type: 'tip',
          text: 'Deleting a parent (e.g. a Site) cascades down: every Building, Floor, and Room beneath it is also deleted. Machines whose pointer landed on a deleted level are kept — their structured location simply unsets and the free-text label takes over. The delete confirm dialog warns you with the exact machine count first, so you can never silently orphan a fleet.',
        },
      },
      {
        heading: 'The equipment record — health, history, and details',
        body: [
          'Every machine has two ways to inspect it. The quick detail modal opens from any equipment row in the dashboard for a fast read-only glance. The full tabbed equipment page lives at /equipment/[id] and is where you go to diagnose a recurring issue, attach manuals, audit parts spend, or prepare for an inspection. Inside the quick modal you will see an "Open detail page →" link that takes you straight to the full page.',
          'The full equipment page is organized into six tabs along the top. The active tab is reflected in the URL hash (e.g. /equipment/abc123#parts), so you can bookmark or share a deep link to any tab. On mobile the tab strip scrolls horizontally — flick left to reach Telemetry without losing your place.',
        ],
        bullets: [
          'Overview — identity (name, serial, manufacturer, model, year installed), status and criticality badges, location breadcrumb, notes, and the live equipment image. The header strip shows five live counts: open work orders, schedules, alerts, documents, and total telemetry readings.',
          'Documents — manuals, drawings, P&IDs, datasheets, certificates, photos. Upload a file (up to 5 MB, stored as a data URL inside Myncel — no S3 setup required) or paste a hosted URL for files you already keep elsewhere. Click any row to preview: PDFs render inline in the browser, images display directly, and CAD files (DWG, DXF, STEP, IGES) drop you to a download link with a friendly "open in your CAD tool" message.',
          'Parts — every part ever consumed on this machine, aggregated from completed work orders. You see total quantity used, total cost in your org currency, last unit cost, the number of work orders that consumed it, and the date it was last used. Useful for spotting wear-prone components and forecasting next year\'s parts budget.',
          'Schedules — the preventive-maintenance schedules attached to this machine, with frequency, last run, next due, and a link to /admin/schedules to edit them.',
          'Timeline — a unified vertical feed merging work orders (created and completed), alerts, and document uploads in chronological order. Each event is colour-coded by severity. Capped at the 200 most recent events; older history is available via the Reports chapter.',
          'Telemetry — for machines with sensors or an Edge Gateway, the latest value for every sensor channel and a table of the most recent readings. Empty for machines without telemetry; no setup needed if you do not use it.',
        ],
        steps: [
          'From the dashboard equipment list, click a machine row to open the quick detail modal.',
          'In the modal header, click "Open detail page →" to jump to the full tabbed page (or visit /equipment/[id] directly).',
          'Use the tab strip at the top to switch between Overview, Documents, Parts, Schedules, Timeline, and Telemetry. The URL hash updates as you click so your tab choice is shareable.',
          'On the Documents tab, click "+ Upload" to add a manual or drawing. Pick a file from disk (up to 5 MB) or paste an external URL, choose a kind (Manual, Drawing, P&ID, Datasheet, Certificate, Photo, Other), and save.',
          'Click any document row to preview it. PDFs and images render inline. CAD files offer a download with guidance on opening them in your CAD viewer of choice.',
          'On the Parts tab, sort by total cost to find your most expensive consumables on this asset, or by last-used date to spot parts that may need re-ordering.',
        ],
        callout: {
          type: 'tip',
          text: 'Document uploads are gated by the machines.edit permission, the same one that controls editing equipment records — so technicians can attach a service photo to a work order, but only managers and admins can permanently attach a master manual to the asset record. Deleting a machine cascades-delete its documents; deleting an individual document is soft on the asset (everything else stays).',
        },
      },
    ],
  },
  // ------------------------------------------------------------------
  // 3. WORK ORDERS
  // ------------------------------------------------------------------
  {
    slug: 'work-orders',
    emoji: '📋',
    title: 'Work Orders',
    summary:
      'Work orders are the unit of work in Myncel. Every repair, inspection, PM task, and safety job is tracked as a work order. This chapter covers creating, assigning, completing, reporting on, and approving them.',
    sections: [
      {
        heading: 'How work orders are created',
        body: [
          'Work orders enter Myncel three ways. Knowing which path fired a work order helps you interpret reports later (e.g. "what percentage of our work is reactive vs planned?").',
        ],
        bullets: [
          'Manually — by anyone with permission, from the Work Orders tab, the equipment page, or the mobile app. Most reactive / corrective work starts here.',
          'From a schedule — a preventive-maintenance schedule fires automatically on its trigger (calendar, runtime, cycles, or condition) and creates a work order ready for assignment.',
          'From an alert — a sensor threshold breach, AI predictive event, or operator-reported anomaly auto-creates a work order. You can configure each alert to either auto-create or just notify.',
        ],
      },
      {
        heading: 'Creating a work order step by step',
        body: [
          'The only required fields are equipment and title. Everything else is optional and can be filled in later, including by a different user.',
        ],
        steps: [
          'Click Work Orders in the sidebar (or "+ Work Order" on any equipment page).',
          'Click "+ Create Work Order".',
          'Pick the machine the work is for.',
          'Choose a type — Corrective, Preventive, Inspection, Safety, or Project. The type affects which reports the work order rolls up into and what compliance evidence is captured.',
          'Set a priority — Low, Medium, High, or Critical. Critical bypasses quiet hours and pages on-call where configured.',
          'Write a clear title (e.g. "Replace mist collector filter, MILL-A-03") and a description with relevant context.',
          'Assign to a specific technician, leave unassigned for the team to claim, or assign to a vendor with email auto-notification.',
          'Set a due date and (optionally) an estimated labor time and parts list.',
          'Attach photos, manuals, or any other documents.',
          'Click Create. The assignee is notified via their preferred channel (push, email, SMS, Slack).',
        ],
      },
      {
        heading: 'Work order statuses and lifecycle',
        body: [
          'Every work order moves through a defined lifecycle. The status drives dashboards, alerts, and what fields the user can edit. Statuses are intentionally few — Myncel does not believe in twenty-step workflows.',
        ],
        bullets: [
          'Open — created but no one has started yet. Counts toward backlog.',
          'In Progress — a technician has accepted and is actively working. The clock is running for MTTR.',
          'On Hold — paused, with a required reason (Waiting for Parts, Waiting for Vendor, Waiting for Approval, Production Conflict, Other). MTTR clock pauses.',
          'Completed — work is done and the completion form has been filled in. Locked from further edits except by managers.',
          'Cancelled — closed without being executed. Requires a reason; counts in reports separately from completed work.',
        ],
      },
      {
        heading: 'Completing a work order',
        body: [
          'When a technician finishes a job they should mark the work order Completed and fill in the completion form. The form captures actual labor time, parts consumed, what was done, root cause (for corrective work), and any follow-up work needed.',
          'On the mobile app the completion form is the same form, optimized for thumbs — large tap targets, voice-to-text on text fields, camera button for photos, and signature pad if a sign-off is required.',
        ],
        callout: {
          type: 'tip',
          text: 'Encourage technicians to attach at least one photo of the completed repair. Photos make audits, warranty claims, and root-cause analysis dramatically easier later, and they take five seconds to capture.',
        },
      },
      {
        heading: 'Assignment, queuing, and dispatch',
        body: [
          'Three assignment patterns are supported, and you can mix them across teams.',
        ],
        bullets: [
          'Direct assignment — the supervisor picks the technician. Best for small teams or when a specific skill is required.',
          'Self-claim queue — work orders are created unassigned. Technicians see them in a shared queue and tap "Claim" to take ownership. Best for cross-trained teams that want to balance load themselves.',
          'Auto-assignment — Myncel matches the work order to a technician using configurable rules (skill tags, location, current load, certification). Available on the Professional plan.',
        ],
      },
      {
        heading: 'Approval workflows',
        body: [
          'Myncel ships a multi-step approval engine that gates work-order transitions. Each approval policy targets a specific trigger — pre-start (when someone tries to move a WO to IN_PROGRESS), pre-close (when someone tries to mark it COMPLETED), or vendor quote (a logical channel for committing high-cost parts) — and matches against priority, work-order type, and minimum total cost. When a matching transition is attempted, the work order is parked in a new PENDING_APPROVAL status and an approval request is opened with one ordered step per policy step. Each step names either a permission gate (e.g. work_orders.approve_budget) or an explicit list of named approver users, and can be configured to require any one approver or every named approver.',
          'Approvers see a queue at /approvals (sidebar → Approvals) showing every request waiting on them, with full work-order context, the current step name, and Approve / Reject buttons. Approving the final step automatically applies the original requested transition — moving the WO to IN_PROGRESS or COMPLETED and stamping startedAt / completedAt — while rejection at any step rolls the WO back to its previous status and captures the rejecter\'s comment in the audit trail. Every decision is timestamped, attributed to a specific user, and stored permanently. Approvers receive an email the moment a step opens up, with a one-click "Review work order" button.',
          'Owners and admins manage policies at Settings → Approvals (/settings/approvals). They can pause a policy without deleting it, edit thresholds, reorder steps, and add or remove named approvers without affecting requests already in flight. Users holding the work_orders.manage_approvals permission can also bypass any approval by appending ?bypass=1 to the work-order PATCH call (intended for break-glass automation, audited via the standard work-order log). The number of pending approvals is visible in your /approvals queue badge so nothing falls through the cracks.',
        ],
        bullets: [
          'Three trigger types — pre-start budget approval, pre-close safety sign-off, vendor quote approval.',
          'Match by any combination of priority (CRITICAL / HIGH / MEDIUM / LOW), work-order type (PREVENTIVE / CORRECTIVE / EMERGENCY / INSPECTION / PROJECT), and minimum total cost (parts + labor in the org\'s currency).',
          'Up to 10 ordered steps per policy. Each step uses a permission gate, a named-user list, or both.',
          'requireAll flag per step — first approver advances by default, or require every named approver to sign off.',
          'Email notifications to all eligible approvers when a step opens; final-state email to the requester.',
          'Full audit trail — every approval and rejection is timestamped with attribution and an optional comment.',
          'Bypass via work_orders.manage_approvals + ?bypass=1 query param for break-glass scenarios.',
        ],
      },
      {
        heading: 'Setting up your first approval policy',
        body: [
          'A practical example: require the maintenance supervisor to sign off on any EMERGENCY-type work order before it can be closed. Open Settings → Approvals, click "+ New policy", and fill in the editor:',
        ],
        steps: [
          'Name: "Emergency WO close-out sign-off".',
          'Trigger: "Pre-close safety sign-off" (fires on the OPEN/IN_PROGRESS → COMPLETED transition).',
          'Match priorities: leave empty (any priority).',
          'Match types: select EMERGENCY only.',
          'Minimum total cost: 0 (any cost).',
          'Step 1: name "Supervisor sign-off", required permission "work_orders.approve_safety", requireAll unchecked. Anyone in the org with that permission can sign off.',
          'Click Create policy. The policy is active immediately. The next time anyone tries to mark an EMERGENCY work order COMPLETED, Myncel parks it in PENDING_APPROVAL and emails everyone with work_orders.approve_safety.',
        ],
        callout: {
          type: 'tip',
          text: 'Build a tier ladder by stacking multiple policies on the same trigger with different minTotalCost values. The most expensive matching policy wins, so you can require one supervisor under $5k, two supervisors $5k–$25k, and the plant manager above $25k — all on a single PRE_CLOSE trigger.',
        },
      },
      {
        heading: 'Parts, labor, and cost capture',
        body: [
          'Each work order tracks estimated and actual minutes, labor cost, parts cost, and total cost in your chosen currency. Parts can be selected from your stocked-parts catalog (which auto-decrements stock) or entered as ad-hoc one-offs. Labor is recorded by entering actual minutes when you complete the work order — start/stop timers are on the roadmap.',
          'Total cost rolls up automatically from parts cost + labor cost and shows on the work-order page and in the Reports section. Currency is per-work-order so multi-region organizations can keep clean accounting.',
        ],
      },
      {
        heading: 'Recurring work orders — using Schedules',
        body: [
          'Recurring work in Myncel is handled by Schedules (the Schedules tab in your sidebar, or /admin/schedules). Create a Maintenance Schedule with a Title, Task Type (PREVENTIVE / PREDICTIVE / CORRECTIVE / INSPECTION), Priority, Frequency (DAILY / WEEKLY / BIWEEKLY / MONTHLY / QUARTERLY / BIANNUAL / ANNUAL / CUSTOM / BY_HOURS), and target machine. Whenever the schedule falls due, Myncel auto-generates a work order against the machine and assigns it to the responsible technician.',
          'Use BY_HOURS for runtime-driven PMs (e.g. "every 500 spindle-on hours") when you have a runtime feed from the Edge Gateway. Use CUSTOM with an interval-in-days field for non-standard cadences. The schedule\'s next due date and last completed date are visible on the schedule list and update automatically as work orders are completed.',
        ],
        bullets: [
          'Reusable, standalone Work Order Templates (separate from a recurring schedule) are on the roadmap.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 4. PREVENTIVE & PREDICTIVE MAINTENANCE
  // ------------------------------------------------------------------
  {
    slug: 'maintenance',
    emoji: '🔧',
    title: 'Preventive & Predictive Maintenance',
    summary:
      'The whole point of a CMMS is to catch problems before they become outages. Myncel offers two complementary approaches — time-or-usage-based preventive maintenance, and AI-powered predictive maintenance driven by sensor data.',
    sections: [
      {
        heading: 'Preventive maintenance schedules',
        body: [
          'A preventive-maintenance (PM) schedule automatically generates a work order at a defined interval. Intervals can be calendar-based (every 30 days), runtime-based (every 500 hours), cycle-based (every 10,000 cycles), distance-based (for vehicles), or condition-based (when a sensor crosses a threshold).',
          'Most facilities run on a mix: calendar-based for time-driven jobs (annual inspections, quarterly safety audits) and runtime-based for usage-driven jobs (oil changes, filter swaps, bearing greasing). The key benefit of runtime-based is that you stop doing PMs on machines that have not actually been running, and you start doing them on machines that have run far more than expected.',
        ],
        steps: [
          'Go to Schedules in the sidebar.',
          'Click "+ New Schedule".',
          'Pick the machine (or a group of machines — a single schedule can cover an entire fleet).',
          'Choose the trigger: Calendar, Runtime, Cycles, Distance, or Condition.',
          'Define the interval (e.g. "every 30 days at 06:00", or "every 500 spindle-on hours").',
          'Set lead-time (how many days before the trigger should the work order be created? Default 7 days).',
          'Author the task checklist — what should the technician actually do? Each step can require a photo, a measurement, a pass/fail, or a signature.',
          'Optionally attach a parts list and required tools (the parts will pre-allocate from stock when the WO fires).',
          'Save. The next-due date appears immediately.',
        ],
        callout: {
          type: 'tip',
          text: 'Start with manufacturer-recommended intervals from the equipment manual, then tighten or relax them based on real data after 3–6 months. The Reports → PM Effectiveness view tells you which schedules are catching real issues vs over-maintaining (the goal is roughly a 10–20% "found something to fix" rate on most PMs).',
        },
      },
      {
        heading: 'Predictive maintenance with AI',
        body: [
          'When sensors are connected to a machine, Myncel\'s AI engine learns the machine\'s normal behavior over a 7–14 day baseline period. After that it watches in real time for deviations: a vibration signature creeping up, a motor running hotter than usual, current draw drifting outside the normal envelope, a pump\'s discharge pressure drifting downward.',
          'When the AI sees a meaningful change it raises a predictive alert and (optionally) auto-creates a work order. Predictive alerts include the machine, the sensor, what changed, the confidence level, and an estimated time-to-failure window when one can be calculated. The alert links to a chart so the technician can see exactly which signature triggered it.',
          'The AI is not a black box. Every prediction is explainable — clicking "Why this alert?" shows the contributing signals, the historical baseline, and the deviation magnitude. Technicians and reliability engineers learn the machine alongside the model.',
          'For the full configuration walkthrough — choosing between the Statistical, Hybrid, and LLM-Assisted models; tuning sensitivity (the slider maps linearly onto a sigma threshold, with 50 = 3σ as the default SPC standard); setting per-machine overrides; reviewing detections in the confirm/reject feedback loop; and reading the SuperAdmin AI tab — see the dedicated AI & Predictive Maintenance chapter.',
        ],
        bullets: [
          'No data-science expertise required — baselines are automatic; sensitivity is a single slider per organization with optional per-machine override.',
          'Three model kinds: Statistical (rolling z-score + EWMA, default), Hybrid (statistical + rule-based context), LLM-Assisted (statistical + language-model annotated recommendations).',
          'Configurable in two places: workspace defaults at /settings/ai, per-machine override on the equipment detail page → 🤖 AI tab.',
          'Available on every plan from Starter upward — what changes by plan is the LLM-call quota for the LLM-Assisted model (Statistical and Hybrid have no per-call cost).',
          'Models supported include vibration ISO 10816 zoning, electrical-signature analysis, thermal drift, pump cavitation, compressor surge, bearing fault frequencies, and gearbox mesh-frequency analysis.',
        ],
      },
      {
        heading: 'PM checklists and digital forms',
        body: [
          'Each schedule can include a structured checklist. Technicians complete it on mobile or web — text fields, dropdowns, photos, signatures, measurements with units, and pass/fail items are all supported. Completed forms are saved permanently against the work order and can be exported as PDF for audits.',
          'Conditional logic is supported: "If Q3 is Fail, then show Q3a-Q3c". This keeps the form short for the common case but captures detail when it is needed (e.g. the failure path on a 100-step electrical inspection).',
        ],
      },
      {
        heading: 'Reliability metrics — MTBF, MTTR, OEE, PM compliance',
        body: [
          'As soon as you have a few weeks of work-order history, the standard reliability metrics start showing real numbers. They are computed automatically per machine, per group, per facility, and across the whole organization, and update in near real-time.',
        ],
        bullets: [
          'MTBF — Mean Time Between Failures, computed from corrective work orders only.',
          'MTTR — Mean Time To Repair, computed from In-Progress timer minus On-Hold pauses.',
          'PM Compliance — completed-on-time PMs / total PMs in the period.',
          'OEE — Overall Equipment Effectiveness (Availability × Performance × Quality), where Availability comes from runtime data, Performance from cycle-time vs design, and Quality from rejected-part counts (manual entry or MES integration).',
          'Backlog age — open work orders older than X days, useful as a leading indicator of pain.',
        ],
      },
    ],
  },
  // ------------------------------------------------------------------
  // 5. TEAM & ROLES
  // ------------------------------------------------------------------
  {
    slug: 'team-and-roles',
    emoji: '👥',
    title: 'Team & Roles',
    summary:
      'Inviting teammates, assigning roles, scoping access by location, and managing permissions so the right people see the right things.',
    sections: [
      {
        heading: 'Inviting a teammate',
        body: [
          'Anyone with the Manager or Admin role can invite teammates. Each plan has a maximum number of users — see the Account & Plans chapter for the limits. Inviting a user does not consume a seat until they accept the invitation.',
        ],
        steps: [
          'Go to Settings → Team.',
          'Click "+ Invite User".',
          'Enter the email address (or paste a comma-separated list to invite many at once).',
          'Choose a role (see below).',
          'Optionally restrict the user to a specific facility, location, or equipment group — the user will only see assets within that scope.',
          'Optionally add skill tags (e.g. "Electrical", "PLC", "HVAC") — used by the auto-assignment engine.',
          'Click Send Invite.',
        ],
        callout: {
          type: 'info',
          text: 'Invitees receive an email with a one-time signup link. The link is valid for 7 days. You can resend or revoke it from the same screen. Re-sending updates the expiry to a fresh 7 days.',
        },
      },
      {
        heading: 'Built-in roles in detail',
        body: [
          'Myncel ships with five built-in roles. They cover the needs of most maintenance organizations. On the Professional and Enterprise plans you can also create custom roles with fine-grained permissions per feature area and action.',
        ],
        bullets: [
          'Admin — full access including billing, team management, integrations, and audit logs. Typically the maintenance director or the IT/OT lead.',
          'Manager — full operational access; can configure schedules, approve work orders, view all reports, manage parts catalogs, and add/remove technicians. Cannot change billing or remove other admins.',
          'Technician — can view all equipment they are scoped to, view and update assigned (and self-claimed) work orders, log time and parts, complete checklists, scan QR codes, and create new work orders. Cannot delete records or change schedules.',
          'Operator — can view machines they run, report issues that turn into work orders, and complete simple inspection forms. Read-only on most other things. Designed for production staff who use Myncel maybe once a day.',
          'Viewer — read-only access across the workspace. Useful for executives, auditors, insurance reps, and external stakeholders. Cannot create, edit, or delete anything.',
        ],
      },
      {
        heading: 'Custom roles and permissions',
        body: [
          'On the Professional plan you can compose custom roles by toggling permissions across feature area × action. Permissions are organized by feature area (Equipment, Work Orders, Schedules, Reports, Parts, Locations, Settings, Integrations, Billing) and action (View, Create, Edit, Delete, Approve, Export, Configure).',
          'Common custom roles we see customers create: Reliability Engineer (read all + edit schedules + edit AI settings), Stockroom Manager (full Parts area + receive POs, no work-order edit), Vendor (view & update only the work orders assigned to them, no other equipment visibility), Compliance Auditor (read-only + export-only).',
        ],
      },
      {
        heading: 'Single sign-on (SSO) and SCIM provisioning',
        body: [
          'Myncel supports SAML 2.0 single sign-on and SCIM 2.0 user auto-provisioning. Both are configured per-organization, so different tenants can plug into completely different identity providers — Okta, Azure AD / Entra ID, Google Workspace, OneLogin, JumpCloud, Ping, and any other standards-compliant IdP — without affecting each other. See the Integrations chapter, section "Single sign-on (SSO) and SCIM provisioning", for the full step-by-step walkthrough including the Okta and Azure AD recipes.',
          'Once SSO is enabled and enforced, all non-OWNER users in your workspace must sign in through your IdP — password and Google sign-in are blocked for them. Owners can still password sign-in as a break-glass mechanism, which is the standard recovery path if the IdP itself goes down or the connection breaks. SCIM provisioning then handles the lifecycle: new hires created in the IdP appear in Myncel within seconds, role changes flow through, and deactivated employees are automatically deprovisioned.',
        ],
        bullets: [
          'Owner / Admin opens /settings/sso and configures the IdP Entity ID, SSO URL, and X.509 signing certificate.',
          'Toggle "Enable SAML SSO" → save. The /signin page now offers a "Sign in with SSO (SAML)" button alongside password sign-in.',
          'For mandatory SSO, also toggle "Enforce SAML SSO". Owners are exempt as a break-glass.',
          'For SCIM auto-provisioning, mint a bearer token from the same /settings/sso page and paste it into the IdP\'s SCIM provisioning screen along with the SCIM 2.0 base URL shown at the top of the page.',
          'Group → role mapping is automatic when the IdP sends a "groups" attribute (configurable). Group names containing "owner", "admin", "tech", "operator", or "employee" map to the matching Myncel role; everyone else gets the configured default role (default: Member).',
        ],
        callout: {
          type: 'info',
          text: 'The full SP-side metadata XML is also exposed at /api/auth/saml/<your-org-slug>/metadata — most IdPs let you paste this URL once instead of typing the Entity ID and ACS URL by hand.',
        },
      },
      {
        heading: 'Audit log',
        body: [
          'Every meaningful action — sign-in, work-order edit, role change, billing change, integration credential update — is recorded in the audit log with timestamp, actor, IP address, and (where relevant) before/after values. Admins can browse the log from /admin/audit-logs and export to CSV. Logs are retained for 2 years.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 6. ALERTS & NOTIFICATIONS
  // ------------------------------------------------------------------
  {
    slug: 'alerts-notifications',
    emoji: '🔔',
    title: 'Alerts & Notifications',
    summary:
      'Configure how Myncel reaches you when something needs attention — in-app, email, SMS, mobile push, Slack, Microsoft Teams, PagerDuty, or any external system via Webhooks.',
    sections: [
      {
        heading: 'Notification channels',
        body: [
          'Each user configures their own preferences from the user menu → Notifications. You can choose a different channel — or several channels — for each event type. Admins can set defaults for the organization and choose which defaults can be overridden by individual users.',
        ],
        bullets: [
          'In-app — always on; appears in the bell icon at the top right and is shown in real time on web and mobile.',
          'Email — default for most events; granular per event type. Branded with your organization\'s logo on Professional and above.',
          'SMS — for urgent alerts. Available on the Growth plan and above. Worldwide coverage via Twilio with E.164-formatted numbers.',
          'Mobile push — to the iOS or Android app via APNs and FCM. Banner on lock screen, badge on icon, optional sound, and tap-to-deep-link straight to the work order or alert.',
          'Slack — post to a channel of your choice. Configure in /settings/integrations → Slack.',
          'Microsoft Teams — adaptive-card alerts to any Teams channel via Incoming Webhook. Configure in /settings/integrations → Microsoft Teams. See the Integrations chapter.',
          'PagerDuty — page on-call engineers via PagerDuty Events API v2 with severity-aware routing and auto-resolve. Configure in /settings/integrations → PagerDuty. See the Integrations chapter.',
          'Webhooks — POST a JSON payload to any URL you control. Useful for piping into custom dashboards or any tool not covered by the native integrations above (e.g. Opsgenie until its native integration ships).',
        ],
      },
      {
        heading: 'Mobile push notifications',
        body: [
          'After installing the Myncel mobile app and signing in, push notifications are enabled by default. The app uses Apple Push Notification service (APNs) on iOS and Firebase Cloud Messaging (FCM) on Android. Both are end-to-end encrypted in transit.',
          'You will receive a notification banner on the lock screen, an icon badge with unread count, and (if enabled in your phone\'s settings) a sound for events like new work-order assignments, predictive alerts, and emergency broadcasts. Tapping the notification jumps you straight to the relevant screen in the app — even when the app was previously closed.',
        ],
        callout: {
          type: 'tip',
          text: 'If a teammate is not receiving push notifications, ask them to: (1) make sure the app is installed and signed in; (2) check iOS Settings → Notifications → Myncel is set to Allow Notifications; on Android, Settings → Apps → Myncel → Notifications must be on; and (3) confirm the channel is toggled on under user-menu → Notifications inside the app.',
        },
      },
      {
        heading: 'Quiet hours',
        body: [
          'Nobody wants a "low-priority work order created" SMS at 2 AM. Quiet hours let each user silence non-critical notifications between configurable times, optionally per day of week. Critical alerts (Priority = Critical, or emergency broadcasts) always break through quiet hours by default — you can change this per user, but we strongly recommend leaving it on.',
        ],
      },
      {
        heading: 'Alert rules and thresholds',
        body: [
          'Rules-based alerts are the simpler cousin of AI predictive alerts. They fire when a sensor value crosses a fixed threshold you define — for example "alert me if any chiller goes above 12 °C return temperature for more than 5 minutes". Use them when the threshold is well-known and stable; use AI predictive alerts when you want the system to find anomalies you have not thought of.',
          'AI predictive alerts (anomalies the engine flagged statistically, plus failure forecasts based on linear-trend regression) are configured separately in Settings → AI & Predictive — see the AI & Predictive Maintenance chapter for the full walkthrough. The two systems coexist: a sensor can have a rule-based threshold AND be watched by the AI engine, and they will publish independently.',
        ],
        steps: [
          'Go to Equipment → [machine] → Alerts → "+ New Rule".',
          'Pick the sensor / data point.',
          'Choose the comparison (>, <, =, ≠, between, outside).',
          'Set the threshold and the dwell time (how long must the condition hold before firing? Prevents flapping).',
          'Choose severity (Info / Warning / Critical) — drives which channels and which user list receives it.',
          'Optionally enable auto-create-work-order on fire.',
          'Save.',
        ],
      },
      {
        heading: 'Emergency broadcasts',
        body: [
          'Admins can send an emergency broadcast to every user in the organization with one click — useful for facility-wide events like power outages, evacuations, severe weather, or production halts. Broadcasts go to every channel a user has configured (in-app, email, SMS, push) regardless of quiet hours, and are logged in the audit trail with the sender, the recipients, and the delivery status per channel.',
        ],
        callout: {
          type: 'warning',
          text: 'Use broadcasts sparingly. They are intentionally noisy. We recommend reserving them for events that genuinely require simultaneous attention from the entire team.',
        },
      },
    ],
  },
  // ------------------------------------------------------------------
  // 7. REPORTS & ANALYTICS
  // ------------------------------------------------------------------
  {
    slug: 'reports',
    emoji: '📈',
    title: 'Reports & Analytics',
    summary:
      'Saved & scheduled reports across the six core datasets — Work Orders, Alerts, Machines, Parts, Downtime, and PM Compliance. Save filters once, run on demand for an instant CSV download, or email a CSV attachment to your team on a daily, weekly, or monthly schedule.',
    sections: [
      {
        heading: 'Where to find Reports',
        body: [
          'Open /reports from the left sidebar (📊 Reports). The page lists every saved report in your organization with its dataset, schedule, last-run timestamp, last-run row count, and next-run timestamp. Anyone in the org can see and run shared reports; the user who created the report (the "owner") is shown next to its name.',
        ],
      },
      {
        heading: 'The six datasets',
        body: [
          'A report is a saved set of filters over one of these six datasets. Pick the dataset that has the columns you want when you create the report — you can change it later. Every dataset is capped at 10,000 rows per export to keep CSV downloads fast and email attachments under typical inbox limits; for larger pulls use the public REST API at /api/docs.',
        ],
        bullets: [
          'Work Orders — WO number, title, machine, type, status, priority, assignee, created at, completed at, estimated/actual minutes, labor cost, parts cost, total cost, currency. Filters: date range, search, status, priority, machine.',
          'Alerts — alert title, machine, severity, status (OPEN / RESOLVED), triggered at, resolved at, message. Filters: date range, search, status, machine.',
          'Machines — name, category, status, criticality, location, manufacturer, model, serial, year installed, total runtime hours. Filters: search, status.',
          'Parts Inventory — name, part number, quantity on hand, min quantity (reorder point), unit cost, currency, location, supplier. Filters: search.',
          'Downtime — machine, WO number, started, ended, duration in hours, reason, cost. Computed from completed corrective + emergency work orders. Filters: date range, machine.',
          'PM Compliance — task, machine, frequency, last completed, next due, status (ON_SCHEDULE / DUE_SOON / OVERDUE), days until due. Filters: machine, status.',
        ],
      },
      {
        heading: 'Creating a saved report',
        body: [
          'Saved reports work in two modes — manual-only (just a saved set of filters you click "Run + Download" on whenever you need the CSV) and scheduled (Myncel runs it automatically and emails the CSV to a recipient list).',
        ],
        steps: [
          'Open /reports → click "+ New Report".',
          'Give it a clear name (e.g. "Monthly downtime — Production line") and an optional one-line description.',
          'Pick the dataset (Work Orders / Alerts / Machines / Parts / Downtime / PM Compliance). The form below adjusts to show only the filters that dataset supports.',
          'Set the filters: a date range with From/To pickers (where applicable), a "Title contains" search, and any dataset-specific filters.',
          'Choose a schedule: "Manual only — no schedule", "Every day", "Every Monday", or "First day of every month".',
          'If you picked a schedule, also pick the hour of day (00–23, in your local timezone) and confirm the timezone string (auto-detected from your browser — e.g. "America/New_York", "Europe/London", "Africa/Lagos"). Then enter recipient emails, comma- or space-separated.',
          'Click Create Report. The report appears in the list; if scheduled, the "Next" timestamp shows when the first delivery will fire.',
        ],
        callout: {
          type: 'info',
          text: 'The cron runs every 15 minutes, so a report scheduled for 08:00 will fire some time in the 08:00–08:15 window. Reports never double-fire — once they run, the next-run timestamp is rolled forward.',
        },
      },
      {
        heading: 'Running a report on demand',
        body: [
          'Even on a scheduled report, you can run on demand at any time without affecting the schedule. Two buttons on each report card:',
        ],
        bullets: [
          '⬇ Run + Download — runs the query immediately and streams the CSV back as a browser download. The filename is "<report-name>-<YYYY-MM-DD>.csv" and the row count is shown in a toast.',
          '📧 Run + Email — runs the query and sends the CSV as an email attachment to all recipients on the report. Only shown if the report has at least one recipient. The email includes the row count, a one-paragraph summary, and an "Open in Myncel" deep-link.',
        ],
      },
      {
        heading: 'Pause, resume, edit, delete',
        body: [
          'Each report card on /reports has the full set of management controls inline:',
        ],
        bullets: [
          'Pause / Resume — only on scheduled reports. Pausing keeps the report and its filters but stops automatic runs. Resuming recomputes the next-run timestamp from "now" forward.',
          'Edit — opens the same form you used to create the report. Changing the schedule, hour, or timezone immediately recomputes the next-run timestamp.',
          'Delete — soft confirmation prompt, then permanent removal. There is no undo today; if you delete a report you used to schedule, you will need to recreate it.',
        ],
      },
      {
        heading: 'What\'s on the roadmap',
        body: [
          'Today\'s release covers the high-value 80% — six datasets, CSV export, daily/weekly/monthly schedules, email delivery. Bigger analytics features (full custom-field report builder with charts, MTBF / MTTR aggregations, dashboard widgets pinned from saved reports, XLSX and PDF export, role-based sharing rules, conditional-formatting alert thresholds inside the report) are tracked in the Roadmap chapter.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 8. INTEGRATIONS
  // ------------------------------------------------------------------
  {
    slug: 'integrations',
    emoji: '🔌',
    title: 'Integrations',
    summary:
      'Myncel plays nicely with the rest of your stack — Slack, Microsoft Teams, PagerDuty, ERP / accounting systems, the public REST API and Webhooks for everything else, and the full set of industrial protocols for IoT and SCADA data.',
    sections: [
      {
        heading: 'Slack — channel notifications',
        body: [
          'Connect Slack to push alerts and work-order updates into the channels your team already lives in. Setup is a one-click OAuth flow: you authorize the Myncel app inside your Slack workspace, choose a default channel, and Myncel starts posting events the next time something happens.',
        ],
        steps: [
          'Open /settings/integrations.',
          'Click Connect under Slack. You are redirected to Slack to approve the workspace install.',
          'Pick the channel that should receive Myncel notifications (e.g. #maintenance or #on-call). You can change this later under /settings/notifications.',
          'Choose which event types post to Slack — work order created, work order completed, alert triggered, PM overdue. Each can be toggled independently.',
          'Click Save. From the Connected card you can press 💬 Send Digest to post a one-shot maintenance summary to verify the channel is wired correctly.',
        ],
        bullets: [
          'Messages include rich formatting — work-order title, machine, priority, assignee, and a deep link back to /work-orders/<id>.',
          'Critical alerts include a red highlight bar; warnings use amber; info uses neutral grey.',
          'Disconnecting from /settings/integrations revokes the Slack token immediately and stops all posting.',
        ],
      },
      {
        heading: 'Microsoft Teams — adaptive-card alerts',
        body: [
          'Microsoft Teams is now a first-class native integration. Myncel posts Adaptive Card v1.4 messages to any Teams channel through a per-channel Incoming Webhook URL — no app install, no admin approval, no OAuth dance. Each Teams channel can have its own webhook, so different sites or teams can receive different subsets of events by connecting Myncel to multiple channels (one connection per Myncel organization is supported today; multi-channel is on the roadmap).',
          'Cards are colour-coded by severity (critical / error → red, warning → amber, info → blue, success → green) and include the machine name, sensor or task, severity, and an "Open in Myncel" action button that deep-links to the relevant page.',
        ],
        steps: [
          'In Microsoft Teams, open the channel that should receive Myncel alerts.',
          'Click the channel ••• menu → Connectors. (On newer tenants this may be Workflows → "Post to a channel when a webhook request is received".)',
          'Find Incoming Webhook → Configure. Give it a name (e.g. "Myncel"), optionally upload an icon, and click Create.',
          'Copy the long URL that begins with https://<tenant>.webhook.office.com/webhookb2/...',
          'Open /settings/integrations in Myncel and click Connect under Microsoft Teams.',
          'Paste the webhook URL, give the channel a friendly label (purely cosmetic), and click Connect Teams.',
          'Myncel posts a single confirmation card to verify wiring. From the Connected card you can press 👥 Test Card any time to re-test.',
        ],
        bullets: [
          'Events that fire a Teams card today: work_order.created, work_order.completed, alert.triggered, pm.overdue.',
          'Severity → colour mapping: CRITICAL/HIGH → attention (red), WARNING/MEDIUM → warning (amber), INFO/LOW → accent (blue), SUCCESS → good (green).',
          'Disconnecting from /settings/integrations revokes the saved webhook URL — Teams will stop receiving cards immediately.',
        ],
        callout: {
          type: 'info',
          text: 'Teams Incoming Webhooks are per-channel and act as both ID and secret — anyone with the URL can post to that channel. Treat the URL like a password and never commit it to source control. If a URL leaks, delete the connector in Teams and create a new one.',
        },
      },
      {
        heading: 'PagerDuty — on-call paging via Events API v2',
        body: [
          'PagerDuty is a native integration for on-call paging. When a critical alert fires or a PM goes overdue, Myncel triggers a PagerDuty incident on the service you choose, which then follows your existing on-call rotations and escalation policies. When the alert is resolved in Myncel, the matching PagerDuty incident is auto-resolved (deduplicated by a stable Myncel resource ID), so on-call engineers never have to manually clear our incidents.',
          'Setup is a single 32-character Integration Key — no OAuth, no webhooks to configure on the PagerDuty side beyond the standard Events API V2 integration that ships in every PagerDuty service.',
        ],
        steps: [
          'Sign in to PagerDuty → Services → pick the Service that should handle Myncel alerts (or create a new one named e.g. "Myncel — Production Floor").',
          'Open the service → Integrations tab → click "+ Add a new integration".',
          'Choose Events API V2 as the Integration Type → Add Integration.',
          'Copy the Integration Key (a 32-character hexadecimal string).',
          'In Myncel open /settings/integrations and click Connect under PagerDuty.',
          'Paste the Integration Key, give the service a friendly label (e.g. "Production Floor"), and click Connect PagerDuty.',
          'Myncel triggers + auto-resolves a single test incident on that service so you can verify the wiring in your PagerDuty timeline. From the Connected card you can press 🚨 Test Page any time.',
        ],
        bullets: [
          'Severity mapping — Myncel CRITICAL → PagerDuty critical (pages immediately), HIGH → error, WARNING/MEDIUM → warning, INFO/LOW → info (no page).',
          'Dedup keys — incidents are keyed by Myncel resource ID + event type. Re-firing the same alert updates the existing incident instead of opening a new one.',
          'Auto-resolve — when an alert is acknowledged or resolved in Myncel, a Resolve event is posted to PagerDuty so the on-call rotation does not get false re-pages.',
          'Routing-key rotation — to rotate, generate a new Events API V2 integration in the same PagerDuty service, paste the new key into Myncel, then delete the old integration in PagerDuty.',
        ],
        callout: {
          type: 'warning',
          text: 'The Integration Key is both ID and secret. Anyone with the key can post incidents to your service — treat it like a password. Use a dedicated PagerDuty service for Myncel rather than reusing a service that accepts events from many sources.',
        },
      },
      {
        heading: 'ERP and accounting',
        body: [
          'Today, Myncel offers a native QuickBooks Online integration (in /settings/integrations → QuickBooks) for invoice and parts-cost sync. Other ERP systems can be connected via the public REST API and Webhooks. Native connectors for SAP, NetSuite, Microsoft Dynamics 365, Oracle Fusion, Sage, and Xero are on the roadmap.',
        ],
        bullets: [
          'QuickBooks Online — native, OAuth-based, in /settings/integrations.',
          'Google Sheets — native, OAuth-based, for one-way data export to a sheet.',
          'Other ERPs — use the public REST API (/api/docs) plus Webhooks. We can share customer-built recipes for SAP and NetSuite — ask in /support.',
        ],
      },
      {
        heading: 'Industrial protocols (IoT / SCADA / building automation)',
        body: [
          'For machine data we support every common industrial protocol through the Edge Gateway. Each protocol has its own setup page under /docs/edge-gateway with copy-pasteable YAML examples. Multiple protocols can target the same machine through one gateway instance.',
        ],
        bullets: [
          'MQTT and MQTT-Sparkplug B — both broker and client mode; TLS supported.',
          'Modbus TCP — read holding registers, input registers, coils, discrete inputs.',
          'Modbus RTU (over TCP gateway or serial through the Edge Gateway).',
          'OPC-UA — secure subscription-based reads with certificate auth.',
          'Ethernet/IP (CIP) — Allen-Bradley / Rockwell PLCs.',
          'Siemens S7 — direct read from S7-300, S7-400, S7-1200, S7-1500.',
          'BACnet/IP — building automation, HVAC, lighting, energy meters.',
          'SNMP v2c / v3 — IT and network gear (UPS, switches, PDUs).',
          'REST / Webhook — for any system that can POST or be polled over HTTPS.',
          'OPC-DA (legacy) — supported via the Edge Gateway only.',
        ],
      },
      {
        heading: 'Single sign-on (SSO) and SCIM provisioning',
        body: [
          'Myncel speaks SAML 2.0 for sign-in and SCIM 2.0 for user auto-provisioning, with full per-tenant configuration. Every Myncel organization has its own IdP slot — different tenants can plug into completely different identity providers without affecting each other, and your IdP credentials are scoped to your workspace alone. We have tested the integration end-to-end with Okta, Azure AD / Entra ID, Google Workspace, OneLogin, JumpCloud, and Ping Identity, and any standards-compliant SAML 2.0 / SCIM 2.0 IdP is expected to work.',
          'There are two pieces. SAML SSO controls how users authenticate (browser redirects to your IdP, gets a signed assertion back, lands in Myncel). SCIM provisioning controls the user lifecycle (when an employee is hired, deactivated, role-changed, or renamed in the IdP, those changes flow into Myncel automatically). You can ship just SSO, just SCIM, or both — they are independent.',
        ],
        bullets: [
          'SAML 2.0 (HTTP-POST binding) — signed AuthnRequest in, signed SAMLResponse with assertions back. Audience and signature validated; expired or unsigned assertions rejected.',
          'SCIM 2.0 (RFC 7643/7644) — bearer-token auth, full Users CRUD, PATCH partial-update grammar that every major IdP sends.',
          'JIT (just-in-time) provisioning — first SSO sign-in for a new email creates the Myncel user automatically. Combine with SCIM for full lifecycle automation.',
          'Group → role mapping — IdP "groups" attribute (or any attribute you point us at) is mapped to the OWNER / ADMIN / TECHNICIAN / OPERATOR / EMPLOYEE / MEMBER roles via case-insensitive substring match. Highest privilege wins.',
          'Per-tenant credentials — every org has its own IdP Entity ID, SSO URL, X.509 cert, and SCIM tokens. SuperAdmin (admin@myncel.com) can audit but not authenticate as the customer.',
        ],
        steps: [
          'In Myncel, sign in as Owner or Admin and open Settings → SSO & SCIM. The page shows your SP-side URLs at the top: Entity ID / Audience, ACS URL, Metadata URL, and SCIM 2.0 base URL.',
          'Open your IdP\'s admin console (Okta: Applications → Add Application; Azure AD: Enterprise applications → New application → Non-gallery; Google Workspace: Apps → Web and mobile apps → Add custom SAML app). Create a new app called "Myncel".',
          'Paste the Myncel SP Entity ID and ACS URL into the IdP\'s "SP Entity ID" and "Reply URL / ACS URL" fields. Choose NameID format = email address. Optionally have the IdP send givenName, surname, and groups as additional attributes.',
          'The IdP will give you back three values — its Entity ID (Issuer), its SSO URL, and its signing X.509 certificate (PEM). Paste these three into the matching fields under "SAML 2.0 Identity Provider" in Myncel and click Save SSO configuration.',
          'Toggle "Enable SAML SSO". The /signin page now shows a second button, "Sign in with SSO (SAML)", that lands on /signin/sso where the user types your workspace slug and gets redirected to your IdP.',
          'Optional but recommended for enterprise rollouts: toggle "Enforce SAML SSO". Now non-OWNER users in your org can no longer sign in with a password — they must use SSO. Owners are still allowed to password-sign-in as a break-glass.',
          'For SCIM auto-provisioning: in the same Settings → SSO & SCIM page, scroll to "SCIM 2.0 Provisioning Tokens", give the token a label (e.g. "Okta production"), and click Generate new token. Copy the plaintext token NOW — it is shown once.',
          'Back in your IdP, open the same Myncel app and switch on Provisioning. Paste the SCIM 2.0 Base URL and the bearer token into the IdP\'s SCIM screen. Set up the user attribute mappings (most IdPs auto-detect ours via /api/scim/v2/Schemas).',
          'Test: in the IdP, create a test user, assign them to the Myncel app, and watch the user appear in /admin (or in the customer\'s /settings/team) within a few seconds. Deactivate the user in the IdP and watch them be soft-deleted in Myncel.',
        ],
        callout: {
          type: 'info',
          text: 'Most IdPs accept the SP metadata XML at /api/auth/saml/<your-org-slug>/metadata as a single import — paste that URL into the IdP and it will fill the Entity ID and ACS URL for you. Plaintext SCIM tokens are never stored in the database; only a SHA-256 hash is kept, so a leak does not yield IdP write access.',
        },
      },
      {
        heading: 'Public REST API and webhooks',
        body: [
          'Everything you can do in the Myncel UI you can also do via the public REST API. Use it to push your own equipment list in, automate work-order creation from your MES, or build custom dashboards. Auth is OAuth 2.0 client-credentials or scoped API keys. Full reference at /api/docs in your workspace.',
          'Webhooks let Myncel POST to your endpoints when events happen (work-order created, alert fired, schedule due, comment added). Configure in Settings → Integrations → Webhooks. Payloads are signed with HMAC-SHA256 so you can verify authenticity.',
        ],
      },
    ],
  },
  // ------------------------------------------------------------------
  // 9. MOBILE APP
  // ------------------------------------------------------------------
  {
    slug: 'mobile-app',
    emoji: '📱',
    title: 'Mobile App',
    summary:
      'The Myncel mobile app for iOS and Android lets technicians work from the floor — view assigned work orders, complete checklists, scan QR codes, attach photos, resolve alerts, and read the full handbook. Available in the App Store and Google Play. The app now ships with an offline-aware sync queue: when the device drops signal, work-order status changes and alert resolutions are captured locally and replayed automatically once connectivity returns. The full handbook is also bundled inside the app for zero-signal lookup.',
    sections: [
      {
        heading: 'Installing the app',
        body: [
          'The Myncel mobile app is a native app, not a wrapped website. It is available on the iOS App Store (iPhone and iPad) and on the Google Play Store (Android phones and tablets). Search "Myncel" or follow the install link from your dashboard.',
          'Minimum supported versions: iOS 15+, iPadOS 15+, Android 8 (Oreo)+. Optimized for both phone and tablet form factors with responsive layouts.',
        ],
      },
      {
        heading: 'Signing in',
        body: [
          'Use the same email and password you use on the web. If your workspace has Google sign-in enabled you can use that as well. Once signed in, the app loads your assigned work orders, your facility\'s equipment list, your notification preferences, and the handbook.',
          'The mobile app is sign-in-only. Workspaces are created on the web by an authorized administrator; new technicians or operators are invited by their manager and receive an email with a one-time link. There is no public sign-up flow on mobile because Myncel is a B2B product — accounts are provisioned by the customer organization.',
        ],
        callout: {
          type: 'info',
          text: 'SAML 2.0 SSO and SCIM 2.0 auto-provisioning are now shipped — if your workspace admin has enabled them, sign in with the "Sign in with SSO" link on the /signin screen. The mobile app uses the same SAML flow as the web app, in an in-app browser tab.',
        },
      },
      {
        heading: 'What you can do on mobile',
        body: [
          'The mobile app is designed for the floor — for technicians and operators who do not sit at a desk. Every common workflow is one or two taps away.',
        ],
        bullets: [
          'View your assigned and self-claimable work orders, sorted by priority and due date.',
          'Open a work order, mark it In Progress, complete the checklist, attach photos from the camera or gallery, and mark Completed.',
          'Scan an equipment QR code to instantly open that machine\'s page.',
          'Browse the equipment list and search by name, location, manufacturer, or serial number.',
          'See sensor readings and AI alerts on connected machines (live values pulled from the server).',
          'Read the full handbook offline (this very document) — see "Reading the handbook on mobile" below.',
          'Receive push notifications for new assignments, predictive alerts, and emergency broadcasts.',
        ],
      },
      {
        heading: 'Working offline',
        body: [
          'The Myncel app is built for the field — basements, tunnels, loading docks, rooftops, and other places where the signal disappears. When the device goes offline, the app does not lock you out: it keeps working and silently captures everything you do into a local sync queue. The moment connectivity returns, the queue drains automatically and your changes are pushed to the server in the order you made them.',
          'You can spot the queue at any time from the floating sync pill in the bottom-right corner of every screen. The pill is hidden when you are online and the queue is empty; it appears the moment something is pending or the device disconnects.',
          'Tap the pill to open the sync drawer, where you can see every queued mutation, retry the drain manually with the "Retry now" button, and discard individual entries that you no longer want to send (for example a status change you reverted in your head before the network came back).',
        ],
        bullets: [
          'Amber pill "● Offline (N)" — device is offline; N changes are waiting.',
          'Blue pill "↻ N pending" — device is back online; sync runs automatically.',
          'Blue pill "⟳ Syncing N…" — drain in progress, one mutation at a time.',
          'Red pill "! Sync failed" — a mutation hit max retries; tap to inspect or discard.',
          'No pill at all — you are online and the queue is empty.',
        ],
        steps: [
          'Open a work order on the floor as usual; mark it In Progress, run through the checklist, mark it Completed.',
          'If the device is offline, the status change is captured to the local queue and the UI updates instantly with an optimistic value.',
          'Walk back into signal coverage. Within a few seconds the queue auto-drains in the background; the pill disappears once empty.',
          'For alarms cleared offline (Alerts → Resolve), the same flow applies — the alert disappears from your list immediately and is reconciled with the server when you reconnect.',
          'If a queued mutation fails to send (server-side error, conflict), open the pill and either Retry or Discard it.',
        ],
        callout: {
          type: 'info',
          text: 'The offline queue is persistent — it survives app backgrounding, device sleep, and reboots. It is stored locally on your device and is never shared between users. The handbook itself is also bundled inside the app, so you can read every chapter, every step, and every diagram with no signal at all.',
        },
      },
      {
        heading: 'What is captured offline',
        body: [
          'The current offline coverage is focused on the highest-frequency field actions — the things technicians actually do during a round when the signal cuts out. Future releases will extend the queue to cover photo uploads (with a delayed-upload pipeline), part stock adjustments, and free-form work-order edits.',
        ],
        bullets: [
          'Work order status changes (Open → In Progress → Completed → Closed).',
          'Alert resolutions (clearing an active alarm).',
          'Reading: the full equipment list, work order list, alert list, and handbook are bundled and viewable offline once the app has been opened online at least once.',
        ],
      },
      {
        heading: 'QR codes and barcodes',
        body: [
          'Print QR-code stickers for your equipment from the web app at Equipment → QR Labels. Pick the size that fits your environment (Small 50×50 mm, Medium 80×60 mm, Large 100×80 mm) and the page prints with the machine name, serial number, and a scannable QR code. Stick them on the asset.',
          'In the mobile app, tap the QR scanner icon (top of the Equipment tab or work order screen) and scan the sticker — the machine\'s page opens instantly with its history, open work orders, and a one-tap "Create Work Order" button.',
        ],
      },
      {
        heading: 'Push notifications',
        body: [
          'Push notifications are enabled by default after sign-in (the app asks for permission on first launch). See the Alerts & Notifications chapter for full details on channels, quiet hours, and event-type configuration. Tap a notification to jump straight to the work order or alert it refers to.',
        ],
      },
      {
        heading: 'Tablet and iPad layout',
        body: [
          'On tablets the app uses a two-pane layout — list on the left, detail on the right — similar to Apple Mail or Files. This is especially useful in maintenance offices where technicians dock an iPad on a wall mount or in a cart. The app supports landscape and portrait orientation.',
        ],
        callout: {
          type: 'info',
          text: 'External keyboard shortcuts (cmd-N for new work order, cmd-K for global search) and iPadOS split-screen multitasking are on the roadmap.',
        },
      },
      {
        heading: 'Reading the handbook on mobile',
        body: [
          'The complete Myncel Handbook is available inside the app — tap the Profile tab, then "📖 Handbook", and you can read every chapter offline. The mobile handbook is the same content as this web document but rendered with native typography, larger tap targets for the chapter list, and a search field at the top. Useful when you are deep inside a building with no signal and want to look up a procedure.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 9.5. VEHICLES, VESSELS & UAVs   (Big Bet #3 — multi-domain)
  // ------------------------------------------------------------------
  {
    slug: 'vehicles-vessels-uavs',
    emoji: '🚛',
    title: 'Vehicles, Vessels & UAVs',
    summary:
      'How to use Myncel as the maintenance system for a service-vehicle fleet, a heavy-truck or off-highway operation, a marine fleet of charter boats / workboats / yachts, or a commercial drone / UAV operation. Covers every shipped connector — OBD-II, SAE J1939, NMEA 2000, MAVLink — plus the telematics importers for Geotab, Samsara, Verizon Connect, Motive, and Fleetio, and the regulatory-aligned work-order templates.',
    sections: [
      {
        heading: 'Why Myncel works for fleets, vessels, and drones',
        body: [
          'Myncel\'s data model is domain-agnostic. A "Machine" is anything with a serial number, a maintenance schedule, and the occasional fault. The same engine that powers preventive and predictive maintenance for a CNC mill works identically for a delivery van, a Class 8 truck, a charter boat, or a survey drone. What changed in this release is that the protocol connectors and the regulatory-aligned workflows now ship out of the box — you no longer need to build a custom integration to bring vehicle, vessel, or UAV telemetry into Myncel.',
          'Pick your domain below and follow the matching step-by-step. The Edge Gateway, Gateway Token model, work-order engine, PM schedules, alert rules, parts inventory, reports, and SuperAdmin views all behave identically across domains; only the connector configuration and the work-order templates change.',
        ],
        bullets: [
          'Cars, light trucks, vans, and motorcycles — connect via OBD-II using a $25 ELM327 dongle. Reads RPM, coolant, fuel level, battery voltage, odometer, runtime, and fault codes (DTCs). See the OBD-II protocol page at /docs/edge-gateway/obd2.',
          'Heavy trucks, buses, ag tractors, dozers, excavators, generators — connect via SAE J1939 over CAN bus. Reads engine, fuel, DEF level, transmission temperature, oil pressure, total hours, total distance, and active DM1 DTCs. See /docs/edge-gateway/j1939.',
          'Yachts, workboats, charter fleets, sportfishing boats, ferries — connect via NMEA 2000 using an Actisense / Yacht Devices / Maretron gateway. Reads engine room, tank levels, GPS, depth, speed, and rudder angle. See /docs/edge-gateway/nmea2000.',
          'Commercial drones (PX4 / ArduPilot) — connect via MAVLink. Reads battery, GPS, altitude, ground speed, satellite count, and autopilot status. Read-only telemetry; Myncel never sends commands to the autopilot. See /docs/edge-gateway/mavlink.',
          'Geotab, Samsara, Verizon Connect, Motive (KeepTruckin), and Fleetio — if you already pay for fleet telematics, you do not need a second device. Forward your existing data to /api/telematics/import and Myncel becomes the CMMS layer on top. See /docs/telematics.',
        ],
      },
      {
        heading: 'Step-by-step: bring a vehicle, vessel, or UAV into Myncel',
        body: [
          'The same five-step flow works for every domain. The only thing that changes is the connector type you generate and the regulatory checklist you copy into the WO.',
        ],
        steps: [
          'Create the asset in Admin Machines. Set the category to one of the new options: Car / Light Truck / Van, Heavy Truck / Bus / Construction, Vessel / Boat / Yacht, or Drone / UAV. Add the VIN / hull number / drone serial, license plate or registration, current odometer or engine hours, and the home location. Use a consistent naming pattern such as VEH-LIGHT-23 / VEH-HEAVY-18 / VESSEL-04 / DRONE-07 so reports and search behave well across mixed fleets.',
          'Generate a Gateway Token. Open the machine detail and click Create Gateway Token. Copy the token once — it is shown in plain text exactly once and stored as a SHA-256 hash thereafter. Paste it into the YAML config you will run on the gateway device, or into the webhook configuration of your existing telematics provider.',
          'Pick the connector type and generate YAML. Open /docs/edge-gateway and pick the matching connector — OBD-II, SAE J1939, NMEA 2000, or MAVLink. Each protocol page has a Gateway Config Generator that produces a ready-to-edit YAML config. Set the connector type, your endpoint (serial port, CAN interface, UDP host, or telemetry connection string), the gateway token, and download the YAML. If you are using an existing fleet telematics product, skip this step entirely and configure that provider to POST to /api/telematics/import instead.',
          'Run the gateway or wire the importer. For OBD-II, run the Myncel edge agent on a Raspberry Pi or industrial PC inside the vehicle, on a phone running the mobile app while parked, or in a cellular OBD-II tracker. For J1939 and NMEA 2000, run the agent on a Raspberry Pi or industrial PC connected to the bus via the appropriate hardware (CAN hat for J1939, NMEA gateway for marine). For MAVLink, the agent connects to the autopilot over USB, telemetry radio, Wi-Fi, or UDP. For telematics imports, configure your existing provider (Geotab Add-In, Samsara webhook, Motive Fleet API, etc.) to POST to https://www.myncel.com/api/telematics/import?provider=<name> with the gateway token in the Authorization header.',
          'Set schedules, thresholds, and templates. Drive PM schedules from the readings the connector emits. For light vehicles use odometer-based or BY_HOURS schedules for oil changes and inspections. For heavy trucks use total_engine_hours for OEM PM intervals (250 / 500 / 1000 hours). For vessels use engine_hours from PGN 127489. For drones use the airframe hour counter from the autopilot. Add Threshold alert rules on coolant_temp, oil_pressure, fuel_level, def_level, battery_voltage, dtc_present, and autopilot_alert to auto-open work orders. Copy the regulatory-aligned checklists from /docs/vehicle-templates into your work orders or PM schedules.',
        ],
        callout: {
          type: 'info',
          text: 'The connector reads dozens of standard signals out of the box (default presets for OBD-II PIDs, J1939 PGNs, NMEA 2000 PGNs, and MAVLink messages). You only need to list the signals you actually care about in the YAML — Myncel will not poll anything you did not ask for, which keeps bus utilization low and dongle batteries from draining the vehicle.',
        },
      },
      {
        heading: 'Domain A — service vehicle and light-truck fleets (cars, vans, sprinters)',
        body: [
          'Best for: car dealerships running courtesy / shuttle fleets, mobile service-tech fleets driving from job to job, courier and last-mile delivery operations, rental fleets, property-management fleets, university and corporate motor pools.',
          'Recommended setup: one ELM327 OBD-II adapter per vehicle. For depots where vehicles return nightly, a $25 USB or $40 Wi-Fi ELM327 plus a small Raspberry Pi or industrial PC is the cheapest path. For always-on telemetry pick a $80–120 cellular OBD-II tracker that pushes directly to /api/telematics/import. Operators / drivers do daily light-vehicle walk-arounds via the mobile app using the shipped Light vehicle / van — daily check template (8 minutes, 12 items).',
        ],
        bullets: [
          'Set odometer-based PMs by combining the imported odometer reading with a tiny scheduled job hitting the public REST API to convert distance into a custom counter, then trigger BY_HOURS schedules off that counter. (Native distance-frequency PMs are on the roadmap.)',
          'Add a Threshold rule on dtc_present >= 1 to auto-open a Diagnostic — DTC detected work order when the check-engine light first appears. The driver does not need to call dispatch; the WO is already on the service writer\'s board.',
          'For dealerships running used-car reconditioning, paste the Light vehicle / van — daily check template into the standard recon WO so every vehicle gets the same 12-item walk-around before delivery.',
          'For mobile service-tech fleets, combine the Light vehicle template with a tools-inventory checklist (in the WO) so the technician confirms both the vehicle and the kit before the first job of the day.',
        ],
      },
      {
        heading: 'Domain B — heavy-duty truck and off-highway fleets',
        body: [
          'Best for: trucking and logistics companies running Class 7-8 fleets, public-works departments, school-bus operators, transit agencies with smaller fleets, ag operations with multi-tractor / combine fleets, construction companies with rolling stock, mining operations.',
          'Recommended setup: a Raspberry Pi 4 with an MCP2515 CAN hat (~$80 total), or a PCAN-USB / Kvaser Leaf for higher-reliability fleets, or an off-the-shelf cellular J1939 telematics box for fleets that prefer no on-board host. Connect to the green 9-pin Deutsch diagnostic connector under the dash. Use the SAE J1939 — heavy truck protocol page (/docs/edge-gateway/j1939) for the bring-up sequence and CAN bring-up commands.',
        ],
        bullets: [
          'Daily DVIR — paste the DVIR — Pre-trip inspection (15 items, FMCSA 49 CFR §396.11) and DVIR — Post-trip inspection (15 items) checklists from /docs/vehicle-templates into BY_DAYS schedules so each driver completes them at shift start and end on the mobile app, with photos attached for any defect.',
          'Hours-based PMs — engine hours from PGN 0xFEE5 feed BY_HOURS schedules. Set the OEM 250 / 500 / 1000-hour service intervals; Myncel auto-creates the WO when the threshold is crossed.',
          'Quarterly PM — paste the Heavy truck — quarterly preventive maintenance template (20 items, ~90 minutes) into a BY_DAYS or BY_HOURS schedule.',
          'DEF monitoring — Tier 4 diesels derate when DEF runs low. Add a Threshold rule on def_level < 15% so drivers get a heads-up before the truck goes into limp-home.',
          'DTC auto-WO — DM1 active fault codes set dtc_present = 1. Auto-create a Diagnostic — DTC detected WO with Priority = HIGH for any active code in the engine, after-treatment, or brake-system SPN ranges.',
          'For mixed fleets — pair J1939 on the heavy units with OBD-II on the light service vehicles. The same Myncel workspace handles both; only the connector type and the templates differ.',
        ],
      },
      {
        heading: 'Domain C — commercial marine and recreational vessel fleets',
        body: [
          'Best for: charter operators (sportfishing, dive, day-sail, yacht charter), commercial workboats (tugs, push-boats, offshore service vessels), small ferries, marine research and survey vessels, larger private yachts that are operated semi-professionally, boatyards that maintain customer fleets.',
          'Recommended setup: drop one Actisense W2K-1, Yacht Devices YDEN-02 / YDWG-02, or Maretron USB100 onto the boat\'s NMEA 2000 backbone. Run the Myncel edge agent (or canboat / Signal K + the agent) on a Raspberry Pi mounted in the helm console or engine room. Use the NMEA 2000 protocol page (/docs/edge-gateway/nmea2000) for hardware specifics and the canboat JSON UDP wiring.',
        ],
        bullets: [
          'Pre-departure — paste the Vessel — pre-departure inspection template (24 items, USCG 46 CFR §185.502-style, ~30 minutes) into a BY_DAYS or per-charter schedule so the captain completes it on the mobile app before every trip with photos of fuel level, life jackets, and bilge.',
          'Return checklist — paste the Vessel — return / shutdown template (15 items, ~20 minutes) so the next crew finds the boat ready and any new issues are documented.',
          'Engine-hour PMs — engine hours from PGN 127489 (Engine Parameters Dynamic) feed BY_HOURS schedules. Volvo Penta D6 / D11, Cummins QSB / QSC / QSL marine, Yanmar 6LY3 service intervals are easy to model directly.',
          'Engine-room alerts — Threshold rules on coolant_temp > 95°C, engine_oil_press < 200 kPa at running RPM, alternator_volt < 12.8 V, or fuel_level < 20% auto-create HIGH-priority alerts that page the captain via PagerDuty / SMS.',
          'Geofence the marina — combine GPS lat / lon readings with a small scheduled job hitting the public REST API to detect when a charter boat exits the marina (charter started) and re-enters (return), and auto-create a fuel-and-walkdown WO on return.',
          'Multi-engine vessels — twin-engine boats expose two NMEA 2000 engine instances. Treat each engine as its own Machine with its own gateway / instance config; the vessel itself is a third Machine that holds the hull / electronics / safety equipment WOs.',
        ],
      },
      {
        heading: 'Domain D — commercial drone / UAV operations',
        body: [
          'Best for: aerial-survey and mapping companies, agricultural-spray operators, public-safety and search-and-rescue UAV programs, infrastructure inspection (cell towers, power lines, wind turbines, solar farms, pipelines, bridges, roofs), film and broadcast production fleets.',
          'Recommended setup: any standard MAVLink telemetry path — 915 / 433 MHz radio modem (RFD900x, SiK telemetry) at the ground station, USB tether for hangar diagnostics, Wi-Fi telemetry bridge for parked-mode log dumps, or a cellular companion computer onboard for live streaming. Use the MAVLink protocol page (/docs/edge-gateway/mavlink) for connection-string examples.',
          'The connector is intentionally read-only telemetry; Myncel never sends commands to the autopilot. Manned aircraft / ARINC 429 is intentionally out of scope: that is FAA Part 43 / 145 / EASA Part-145 regulated software territory and is intentionally not a Myncel feature.',
        ],
        bullets: [
          'Pre-flight — paste the UAV / drone — pre-flight checklist template (17 items, FAA 14 CFR Part 107-aligned, ~8 minutes) into a per-flight schedule. The pilot completes it on the mobile app at the launch site with photos of airframe and battery condition.',
          'Post-flight — paste the UAV / drone — post-flight checklist (11 items, ~5 minutes) so cycle counts and anomaly logs are captured before the airframe is put back in storage.',
          'Battery as its own Machine — track every LiPo / Li-ion battery as its own Machine (category Drone / UAV) and configure a BY_HOURS schedule that proxies for cycle count. LiPo packs typically retire at 200–300 cycles. Increment the cycle counter via the public REST API at the end of every flight.',
          'Autopilot fault → WO — STATUSTEXT severity ≤ 3 sets autopilot_alert = 1. Auto-create a Diagnostic WO so the issue is investigated before the next flight.',
          'Flight-hours-based PMs — total flight hours feed BY_HOURS schedules for prop replacement, ESC inspection, motor bearing checks, and gimbal service.',
          'Multi-airframe operators — track each airframe as its own Machine and link battery Machines to flight-event WOs via the WO\'s linked-machines field so a battery\'s history follows the pack rather than any single airframe.',
        ],
      },
      {
        heading: 'Telematics importers — when you already pay for Geotab, Samsara, Verizon Connect, Motive, or Fleetio',
        body: [
          'If your fleet already runs a telematics product, do not pay twice. Forward the data you already have to /api/telematics/import and Myncel becomes the CMMS layer on top of telematics you already trust — odometer-based PMs, fuel-level alerts, fault-code WOs, all without a second device under the dash.',
          'The endpoint authenticates with the same per-machine Gateway Token model as /api/iot/ingest. Each vehicle in Myncel gets a token; the remote provider\'s webhook or scheduled pusher includes the token as Authorization: Bearer <token>. Provider is detected automatically from payload shape, or pinned via the ?provider=geotab|samsara|verizon|motive|fleetio query parameter.',
        ],
        bullets: [
          'Geotab — push from a MyAdmin Add-In or scheduled SDK pull. Diagnostic-keyed events ({ dateTime, diagnostic: { id, name }, value, unit }) are mapped one-to-one onto Myncel readings.',
          'Samsara — point a Samsara webhook at /api/telematics/import?provider=samsara. Vehicle-stats snapshots ({ gpsOdometerMeters, fuelPercents, engineRpm, engineCoolantTemperatureMilliC, ecuSpeedKilometersPerHour, defLevelPercent, ... }) are flattened into individual readings with proper unit conversion (meters → km, milli-Celsius → C, milli-volts → V).',
          'Verizon Connect / Reveal — per-signal records ({ time, deviceId, signal: { name, value, unit } }) accepted as one POST per signal or batched as an array.',
          'Motive (KeepTruckin) — push from the Motive Fleet API. Vehicle current_state shape ({ current_state: { gps_odometer_km, fuel_percent, speed_kph, engine_hours, def_percent, ... } }) is normalized into separate readings.',
          'Fleetio — push every meter entry as it is created in Fleetio ({ meter_entry: { meter_type, value, units, recorded_at } }).',
          'Generic — same shape as /api/iot/ingest ({ type, value, unit, recordedAt }). Use this if your telematics provider is not in the list yet, or if you are exporting from a custom in-house system.',
        ],
        callout: {
          type: 'tip',
          text: 'See /docs/telematics for full payload examples for every provider, the field-mapping reference table, and the curl recipes you can paste into your provider\'s scheduled-job UI.',
        },
      },
      {
        heading: 'SuperAdmin parity for fleets',
        body: [
          'The SuperAdmin Org Control Center surfaces fleet rollups alongside industrial equipment so you can see at a glance how each customer\'s portfolio is composed. Open Admin → Organizations → <org> → Machines and the new Fleet rollup pill row breaks the asset count down by category: Industrial, Forklift / AGV, Light vehicles, Heavy trucks, Vessels, Drones / UAVs, Other. The same machine list table that already showed name / category / status / location / created date now treats vehicle / vessel / drone categories as first-class.',
          'SuperAdmin still controls every workspace-level setting that affects fleets — billing tier, integrations, SSO/SCIM, alerts, audit log retention. None of that changes; it just now applies cleanly to mixed-domain workspaces too.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 10. AI & PREDICTIVE MAINTENANCE
  // ------------------------------------------------------------------
  {
    slug: 'ai-predictive-maintenance',
    emoji: '🤖',
    title: 'AI & Predictive Maintenance',
    summary:
      'How Myncel\'s AI engine watches your sensor streams, detects anomalies before they become failures, and forecasts when a machine is likely to cross a critical threshold. Covers the three available models, sensitivity tuning, per-machine overrides, the confirm/reject feedback loop, quiet hours, auto work-order creation, and the SuperAdmin view.',
    sections: [
      {
        heading: 'What the AI engine actually does',
        body: [
          'Myncel ships a built-in anomaly-detection and predictive-failure engine that runs on top of every sensor reading you log — manually, via the Edge Gateway, via OBD-II / J1939 / NMEA 2000 / MAVLink, or via a telematics importer. It is on by default for every workspace and you do not need to install or configure anything else. The engine has two jobs: spot readings that look statistically unusual for that specific machine and that specific sensor, and project simple linear trends forward in time so you get a heads-up days before a value would cross a critical threshold.',
          'The engine is intentionally transparent. Every detection records the baseline mean, the rolling standard deviation, the EWMA-smoothed value, the threshold that was crossed, the sigma multiple, the severity, and a plain-language recommendation. Every forecast records the predicted crossing date, a confidence percentage derived from the regression\'s R², and the horizon used. Nothing is a black box — you can always click into a detection and see exactly why the engine flagged it.',
        ],
        bullets: [
          'Anomaly detection — rolling z-score plus EWMA (λ = 0.3) over the last 30 samples per sensor. Flags the latest reading when its absolute deviation exceeds the configured sigma threshold, or when a custom warn / critical threshold is crossed.',
          'Predictive forecasting — least-squares linear regression over the last 30 days per sensor. Projects forward up to your configured horizon (default 14 days) and emits a forecast when the trend is on track to cross a critical level.',
          'Severity grading — sigma-ratio based: ≥ 2.0× threshold is CRITICAL, ≥ 1.5× is HIGH, ≥ 1.0× is MEDIUM, anything below is LOW. Same scale across every sensor type and every domain.',
          'Dedup window — 5 minutes per machine + sensor type, so a noisy reading that hovers around a threshold does not generate dozens of duplicate alerts.',
          'Forecast TTL — 24 hours. Forecasts auto-expire and the engine regenerates them on the next run, so you never see stale predictions on the dashboard.',
        ],
      },
      {
        heading: 'The three AI models',
        body: [
          'Myncel offers three model kinds. They all use the same statistical core; what changes is how much extra context is layered on top. You pick the model once at the workspace level under Settings → AI & Predictive, and you can override it per-machine on the equipment page.',
        ],
        bullets: [
          'Statistical (default) — pure rolling z-score + EWMA + linear regression. Deterministic, explainable, fast, no external API calls. This is the right choice for 95% of workspaces and is the only model we recommend leaving on for safety-critical equipment.',
          'Hybrid — same statistical core, but the recommendation text is enriched with rule-based context (sensor type, asset category, recent work orders on the same asset). Still fully local, still no external calls, just smarter wording on the alert.',
          'LLM-Assisted — adds a sanity-check pass through a language model before an alert is published. The LLM cannot create or suppress alerts on its own; it only annotates them with extra reasoning. Use this only if you have a heavy false-positive problem that sensitivity tuning has not solved. Custom instructions become available when this model is selected.',
        ],
        callout: {
          type: 'tip',
          text: 'Start with Statistical. We strongly recommend leaving every workspace on Statistical for the first month. Look at the confirm/reject ratio in your detection feed before deciding to upgrade — most workspaces never need anything more.',
        },
      },
      {
        heading: 'Sensitivity, severity, and quiet hours',
        body: [
          'Sensitivity is a single 0 → 100 slider that maps linearly onto a sigma threshold. The math is intentional: 0 means "only fire on extreme outliers" and 100 means "fire on any small deviation". The default of 50 corresponds to 3σ, which is the standard SPC (statistical process control) threshold and is what you want for almost every sensor.',
        ],
        bullets: [
          '0 → 5σ — silent. Practically nothing fires. Use this only when you are commissioning a new asset and want to suppress alerts.',
          '50 → 3σ — SPC standard. Default. About 0.27% of normal readings trip this naturally, which is the right rate for most production sensors.',
          '100 → 2σ — paranoid. About 4.5% of normal readings trip this. Useful only on extremely stable, well-instrumented assets where you genuinely want to chase every wobble.',
          'Minimum severity — independent of sensitivity. Even if the engine detects an anomaly, no alert is published unless the severity meets or exceeds your floor. Most workspaces set this to MEDIUM.',
          'Quiet hours — a UTC window during which alerts are queued silently and delivered at the next active hour. Useful for workspaces that do not run 24×7 and do not want overnight pings on a non-critical pump.',
          'Auto-create work orders — when on, every CRITICAL detection auto-opens a work order assigned to the machine\'s default technician. Off by default; turn it on once you trust the false-positive rate.',
        ],
        callout: {
          type: 'warning',
          text: 'Sensitivity is per-organization, not per-sensor. A single sensitivity setting applies to every sensor on every machine in the workspace. If one specific machine needs a tighter or looser setting, override it on the machine\'s AI tab — do not raise the global sensitivity to chase one noisy asset.',
        },
      },
      {
        heading: 'Per-machine overrides',
        body: [
          'Every machine has its own AI tab on the equipment detail page. By default, every field on that tab is set to "inherit from organization" — null in the database — so a workspace-level change automatically applies everywhere. When you flip an override on, only that field is overridden; everything else keeps inheriting. This is how you tune sensitivity for a single noisy asset without affecting the rest of the fleet.',
        ],
        steps: [
          'Open the equipment detail page for the machine you want to tune.',
          'Click the 🤖 AI tab.',
          'Read the "Effective settings" card at the top — this shows what the engine will actually use for this machine right now (your overrides plus inheritance).',
          'Toggle the override switch next to any field you want to change. The control becomes editable.',
          'Pick a new value, or leave the override off to keep inheriting.',
          'Click Save. The change takes effect on the next engine run, or immediately if you click "Run engine now".',
          'Add a note in the Notes field — future-you will appreciate knowing why this machine has a custom sensitivity.',
        ],
        bullets: [
          'Custom thresholds — for a specific machine, you can set explicit warn / critical values per sensor type that override the statistical engine entirely. Useful for sensors with a regulated red line (battery voltage, hydraulic pressure, vessel exhaust temp).',
          'Per-machine model — you can run a single high-value asset on LLM-Assisted while leaving the rest of the fleet on Statistical.',
          'Per-machine quiet hours — not currently overridable per machine; set once at the workspace level. On the roadmap.',
        ],
      },
      {
        heading: 'The confirm/reject feedback loop',
        body: [
          'Every detection lands in a feed on the equipment AI tab and on the SuperAdmin AI tab with three possible states: PENDING, CONFIRMED, or REJECTED. When a technician confirms a detection, you are telling the engine "yes, this was a real problem". When they reject it, you are telling the engine "false positive". This feedback is recorded against the detection and is what powers the rolling false-positive rate shown on the SuperAdmin dashboard.',
          'Today the feedback is not used to retrain the model — the statistical core does not need training data. It is used for visibility: if a workspace is rejecting more than 30% of detections, the SuperAdmin view will surface that and recommend lowering sensitivity. Future models may consume this feedback for fine-tuning; the data is being collected so that path stays open.',
        ],
        bullets: [
          'PENDING — the default state. A detection has been published as an alert but no human has weighed in yet.',
          'CONFIRMED — a technician opened the detection, agreed with it, and clicked Confirm. Counts as a true positive.',
          'REJECTED — a technician opened the detection, disagreed, and clicked Reject. Counts as a false positive. The associated alert is automatically dismissed.',
        ],
      },
      {
        heading: 'Running the engine',
        body: [
          'The engine runs automatically every time a new sensor reading is ingested, and additionally on a 15-minute background sweep across every machine in every workspace. You can also trigger it manually from Settings → AI & Predictive (workspace-wide) or from any equipment AI tab (single machine). A manual run is useful right after you change sensitivity or thresholds and want to see results immediately rather than waiting for the next sweep.',
        ],
        bullets: [
          'POST /api/ai/detect — runs the engine across every machine in the workspace. Returns counts of machines scanned, machines skipped because AI is disabled on them, detections created, and forecasts created.',
          'POST /api/ai/detect/[machineId] — runs the engine for a single machine. Same response shape.',
          'GET /api/ai/detect/[machineId] — returns the last 50 detections plus all currently-active forecasts for the machine.',
          'POST /api/ai/feedback/[detectionId] — accepts { feedback: "CONFIRMED" | "REJECTED" } and updates the detection.',
          'GET / PATCH /api/ai/settings — workspace-level settings (OWNER / ADMIN only for PATCH).',
          'GET / PATCH /api/ai/settings/[machineId] — per-machine overrides (OWNER / ADMIN / TECHNICIAN can edit).',
        ],
      },
      {
        heading: 'SuperAdmin view',
        body: [
          'Every Org Control Center has a 🤖 AI tab between Operations and Billing. It shows, for that one customer workspace: the master enabled / disabled pill, the active model, the current sensitivity, the minimum severity, the forecast horizon, a feedback rollup (pending / confirmed / rejected counts over the last 25 detections), the active forecasts table (asset, sensor, predicted crossing date, confidence), and the last 25 detections with severity-colored left borders and feedback pills. It is read-only — SuperAdmin can see exactly what the customer is doing but cannot change settings on their behalf, which keeps the audit trail clean.',
        ],
        callout: {
          type: 'info',
          text: 'Read-only by design. SuperAdmin can observe a workspace\'s AI configuration and outcomes but cannot change them. If a customer needs help tuning sensitivity, walk them through it on a screenshare — do not edit their settings server-side.',
        },
      },
      {
        heading: 'Costs and limits',
        body: [
          'The Statistical and Hybrid models add zero cost — they run inside the same Node process that serves the rest of Myncel and use no external APIs. The LLM-Assisted model is metered: each anomaly that is post-processed by the LLM consumes one inference call, and inference calls are counted against your monthly plan limit. Workspaces on Starter and Pro plans get 500 LLM calls/month included; Growth gets 5,000; Enterprise is uncapped. The current count is shown at the bottom of Settings → AI & Predictive when LLM-Assisted is selected.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 11. ACCOUNT, BILLING & PLANS
  // ------------------------------------------------------------------
  {
    slug: 'account-billing-plans',
    emoji: '💳',
    title: 'Account, Billing & Plans',
    summary:
      'Pricing tiers, what each plan includes, how to upgrade or downgrade, how to manage billing details, and how to export all your data at any time.',
    sections: [
      {
        heading: 'Plans and pricing',
        body: [
          'Myncel has four plans. Annual billing saves roughly 20% compared to monthly. All paid plans include a 30-day free trial of the Growth-tier feature set, and you can cancel at any time. Workspaces and billing are managed exclusively from the web — the mobile app does not include any sign-up or upgrade flow.',
        ],
        bullets: [
          'Starter — $49/month (or $39/month annual). Up to 25 machines, 10 users, 500 work orders/month. Includes core CMMS features (equipment, work orders, schedules, parts), rules-based alerts, mobile app, manual logging, and email support.',
          'Growth — $99/month (or $79/month annual). Up to 100 machines, 25 users, 2,000 work orders/month. Adds AI-powered predictive maintenance, SMS alerts, Slack/Teams integration, and approval workflows.',
          'Professional — $249/month (or $199/month annual). Up to 500 machines, 100 users, 10,000 work orders/month. Adds direct PLC/SCADA integration, PagerDuty/Opsgenie, phone support, white-label, SSO/SAML, custom report builder, custom roles, and API access.',
          'Enterprise — Custom pricing. Unlimited machines, users, and work orders. Dedicated success manager, on-premise option, custom SLA, SCIM provisioning, audit log retention to 7 years, and bespoke integrations.',
        ],
      },
      {
        heading: 'Free trial',
        body: [
          'Every new account gets a 30-day free trial of the Growth plan with no credit card required. At day 28 you will see in-app prompts to choose a plan; if you do nothing, the account drops to a free read-only mode at day 31 — your data is preserved indefinitely so you can come back any time. Reactivating restores full access within seconds.',
        ],
      },
      {
        heading: 'Upgrading or downgrading',
        body: [
          'Plan changes happen in Settings → Billing → Change Plan (web only). Upgrades take effect immediately and are pro-rated against your current period. Downgrades take effect at the end of the current billing period so you keep what you paid for.',
        ],
        callout: {
          type: 'warning',
          text: 'If you downgrade and your data exceeds the new plan\'s limits (e.g. you have 60 machines but downgrade to Starter\'s 25-machine limit), the system stays read-only on equipment beyond the limit until you remove some or upgrade again. No data is ever deleted automatically.',
        },
      },
      {
        heading: 'Cancelling',
        body: [
          'You can cancel any time from Settings → Billing → Cancel Subscription. Your account stays active until the end of the period you have already paid for, then drops to free read-only. Reactivation restores everything within seconds. If you need a full account deletion (right-to-be-forgotten / GDPR), contact privacy@myncel.com.',
        ],
      },
      {
        heading: 'Exporting your data',
        body: [
          'Your data is yours. Settings → Data → Export gives you a one-click full export as a ZIP containing every work order, equipment record, parts entry, schedule, attached document, and audit log entry — in CSV plus original-format files. Available on every plan, including the free read-only mode.',
        ],
      },
      {
        heading: 'Why we do not sell on the mobile app',
        body: [
          'Myncel is a B2B product. Workspaces represent organizations, plans are sold to organizations, and individual technicians or operators do not pay personally. Because of this, all account-creation, plan-purchase, and billing flows live exclusively on the web at https://www.myncel.com. The iOS and Android apps are pure access tools for users whose employer has already provisioned them an account. No in-app purchases, no plan upgrades, no payment screens — just the work.',
        ],
      },
    ],
  },
  // ------------------------------------------------------------------
  // 12. TROUBLESHOOTING
  // ------------------------------------------------------------------
  {
    slug: 'troubleshooting',
    emoji: '🛠',
    title: 'Troubleshooting & FAQ',
    summary:
      'Common questions and quick fixes — from sign-in issues, to "why is my machine showing offline", to "the AI gave a wrong answer". Updated as we see real customer questions.',
    sections: [
      {
        heading: 'I forgot my password',
        body: [
          'Go to the sign-in page (https://www.myncel.com/signin) and click "Forgot password". Enter your email and follow the link sent to your inbox. The link is valid for 1 hour. If you do not receive it within a few minutes, check your spam folder and confirm the email matches the one on your account.',
          'On mobile the same flow is available — tap "Forgot password" on the sign-in screen and the email is sent to whatever address is registered for your user.',
          'If you sign in with SSO, password reset is handled by your identity provider, not Myncel.',
        ],
      },
      {
        heading: 'My machine shows "offline" but it is running',
        body: [
          'This means Myncel has not received a heartbeat from the machine\'s sensor or PLC connection within the expected window. Heartbeat windows are 60 seconds for direct PLC connections and 5 minutes for low-power IoT sensors by default; both are configurable per machine.',
        ],
        steps: [
          'Open the machine\'s page → "Connections" tab → look at the last-seen timestamp and the protocol.',
          'If it has been more than the heartbeat window, check the Edge Gateway is online (Settings → Integrations → Edge Gateway).',
          'For IoT sensors, check the sensor battery and signal strength on the gateway diagnostics page. Replace the battery if low (typical sensor lifetime: 3–5 years).',
          'For PLC connections, verify the PLC is reachable from the gateway (built-in ping/telnet test in the gateway diagnostics).',
          'Re-sync from the machine page if needed. If the issue persists, contact support — please include the machine name and the last-seen timestamp.',
        ],
      },
      {
        heading: 'Push notifications are not arriving',
        body: [
          'Three things to check, in order. The vast majority of "missing push" issues are #2.',
        ],
        steps: [
          'Confirm the mobile app is installed, signed in, and up to date (App Store / Play Store, check for updates).',
          'On iOS: Settings → Notifications → Myncel → Allow Notifications must be on. On Android: Settings → Apps → Myncel → Notifications must be on. On both, check that battery optimization / focus modes are not silencing the app.',
          'Inside the Myncel app: user-menu → Notifications → confirm the channels you want are toggled on, and that quiet hours are not currently silencing the type of alert.',
          'If still nothing arrives, send a test from /admin/push-debug (super-admins only) or contact support — we can confirm the device token is registered with APNs/FCM and that the platform accepted the message.',
        ],
      },
      {
        heading: 'My sensor is not showing in the unassigned list',
        body: [
          'When you go to Equipment → [machine] → Connect Sensor, the sensor list is populated by the Edge Gateway from sensors it has heard recently (default: last 30 minutes). If a new sensor is missing, walk through the following checklist.',
        ],
        steps: [
          'Confirm the gateway is online (Settings → Integrations → Edge Gateway → green dot).',
          'Power-cycle the sensor (pull the battery for 5 seconds and re-insert).',
          'Confirm the sensor is within range of the gateway (typical LoRaWAN range 200 m indoors, BLE 30 m).',
          'If the sensor was previously paired to a different gateway, factory-reset it per the install card.',
          'Wait 2–3 minutes and refresh the unassigned-sensors list.',
        ],
      },
      {
        heading: 'The AI assistant gave a wrong answer',
        body: [
          'Click the 👎 below the answer in the chat widget. That logs the feedback for the team and pulls the conversation into a review queue. You can also switch the chat to "Live Support" at any time and a human will pick up.',
          'The AI is grounded in this very Handbook — if a topic is missing or unclear here, that is the place to fix it. Customers on the Professional plan can also bring their own knowledge base in (Settings → AI → Custom Sources) to ground the assistant on internal SOPs and equipment manuals.',
        ],
      },
      {
        heading: 'The Continue button is greyed out on signup',
        body: [
          'This was an iPadOS-Safari autofill behavior we observed in May 2026 and fixed shortly after. If you ever encounter it again (e.g. on a future iOS version), the workaround is to manually re-type the last character of the confirm-password field — that always wakes the form. We have also added always-on submit with click-time validation as a defense-in-depth fix.',
        ],
      },
      {
        heading: 'Contacting human support',
        body: [
          'You can always reach a human at support@myncel.com or through the Live Support tab in the chat widget. Professional and Enterprise plans include phone support; the number is shown in your Settings → Billing page.',
          'For security-sensitive issues (suspected breach, leaked credential) please use security@myncel.com — that mailbox is monitored 24/7 and is PGP-capable on request.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 13. ROADMAP — what's coming next (and what isn't here yet)
  // ------------------------------------------------------------------
  {
    slug: 'roadmap',
    emoji: '🛣️',
    title: 'Roadmap',
    summary:
      'This chapter is a single source of truth for features that are planned but not yet shipped in the version of Myncel you are reading this handbook from. Anything mentioned in earlier chapters as "on the roadmap" is listed here, grouped by area, so you know exactly what is real today versus what is coming. We update this list as features ship — when an item ships it gets removed from here and the relevant chapter is updated to describe how it actually works.',
    sections: [
      {
        heading: 'How to read this chapter',
        body: [
          'Everywhere else in this handbook we describe Myncel as it works today. If a feature is not mentioned in another chapter, it is not in the product yet. This Roadmap chapter is the only place where forward-looking items are documented, and we deliberately keep them short and unambiguous so there is no confusion between "shipped" and "planned".',
          'If you need a planned feature urgently for a deployment, talk to us — most of these items have rough timelines and a few have customer-funded fast-tracks available.',
        ],
        callout: {
          type: 'info',
          text: 'No promises on dates. Items here are committed in scope but not in calendar — priorities shift based on customer demand and reviewer feedback.',
        },
      },
      {
        heading: 'Equipment & onboarding',
        body: [
          'Today you add machines one at a time from the Equipment page using the "+ Add Machine" button, or in bulk via the public REST API (POST /api/machines, see chapter "Equipment & Onboarding"). The roadmap below extends that with import wizards and richer location structures.',
        ],
        bullets: [
          'CSV / Excel bulk importer in the UI — drag-drop a spreadsheet, map columns to fields, preview, import. Today only the API does bulk.',
          'Named importers for common CMMS migrations — SAP PM, IBM Maximo, Limble, UpKeep, eMaint, Fiix, MaintainX, Hippo. Today: do the export from the source system to CSV, then call the public REST API.',
          'OEM-specific fleet telematics importers — Toyota I_Site (forklifts), Crown InfoLink, John Deere Operations Center, Caterpillar VisionLink. Native importers for Geotab, Samsara, Verizon Connect, Motive (KeepTruckin), and Fleetio are now shipped — see /docs/telematics. The OEM-specific list above is what is still on the roadmap.',
          'Equipment groups / parent-child relationships (e.g. a "Compressor pack" parent containing 4 individual compressors). Today: model each compressor as its own machine and put the pack name in the Notes or Location field.',
        ],
      },
      {
        heading: 'Equipment record',
        body: [
          'The full tabbed equipment page is live today (Overview, Documents, Parts, Schedules, Timeline, Telemetry — see the Equipment chapter). The roadmap items below add deeper drill-downs on top of that foundation.',
        ],
        bullets: [
          'Embedded interactive DWG / DXF viewer with pan, zoom, layer toggling, and measurement tools (today: PDF and image preview render inline; native CAD files offer a download with a friendly "open in your CAD tool" message).',
          'Document version history — keep every revision of a manual or drawing, with a side-by-side diff and rollback (today: each upload is a new row).',
          'Per-machine bill-of-materials linking installed parts to the inventory catalog with low-stock alerts wired to the asset (today: the Parts tab aggregates parts ever consumed on the machine from completed work orders).',
        ],
      },
      {
        heading: 'Work orders',
        body: [
          'Work orders today support assignment, priority, status, checklists, photo attachments, comments, schedules (with all 9 frequency types including BY_HOURS), labor / cost capture, and multi-step approval workflows (see the Work Orders chapter for the full approvals walk-through). The roadmap adds reusable templates and richer parts-reservation logic.',
        ],
        bullets: [
          'Reusable Work Order templates — define a "30-day Haas VF-2 PM" once, spawn it from any machine.',
          'Parts reservation and auto-deduction from inventory when a WO is completed.',
          'Labor timer that runs in the mobile app (today labor is entered as a number when completing the WO).',
        ],
      },
      {
        heading: 'Reports & analytics',
        body: [
          'Today Myncel ships Saved & Scheduled Reports — six datasets (Work Orders, Alerts, Machines, Parts, Downtime, PM Compliance) with filterable CSV export and daily/weekly/monthly email scheduling. The roadmap layers richer analytics on top of that engine.',
        ],
        bullets: [
          'Custom field-by-field report builder with drag-and-drop columns, group-by, and pivot tables across any Myncel data model.',
          'Pre-built MTBF / MTTR / OEE roll-up reports (today: derive from Work Orders + Downtime CSV exports in your BI tool of choice).',
          'XLSX export with formula-friendly numeric typing and PDF export with the org logo (today: CSV only).',
          'Charts inside the report — bar, line, area, pie, gauges — and an option to pin any saved report to the dashboard as a widget.',
          'Role-based sharing rules (today: any org member can see any saved report; we plan to add owner-only / role-only / public visibility).',
          'Conditional-formatting alert thresholds inside reports (highlight rows where a column crosses a threshold; emails the report only when at least one row qualifies).',
          'Quarterly schedule cadence and arbitrary cron-string schedules (today: daily / weekly Mon / monthly 1st).',
        ],
      },
      {
        heading: 'Predictive & connectivity',
        body: [
          'Today Myncel ships with 8 production-ready Edge Gateway connectors: Modbus TCP/RTU, OPC-UA, MQTT, MTConnect, BACnet/IP, Siemens S7, Rockwell EtherNet/IP, and Beckhoff ADS — each documented at /docs/edge-gateway/<protocol> with copy-pasteable YAML. The roadmap adds more protocols and richer ML.',
        ],
        bullets: [
          'SNMP connector for network and IT-OT bridge devices (printers, UPS, switches, environmental sensors).',
          'Native cloud connectors for AWS IoT Core, Azure IoT Hub, and GCP IoT (today: bridge them via MQTT).',
          'On-device anomaly detection (run the model inside the Edge Gateway, not just in the cloud) for low-bandwidth sites — today, the AI engine runs cloud-side. The full per-org / per-machine AI Settings panel with statistical, hybrid, and LLM-assisted models is now shipped (see the AI & Predictive Maintenance chapter).',
        ],
      },
      {
        heading: 'Integrations',
        body: [
          'Today the native integrations are: Slack (channels and DMs), Microsoft Teams (adaptive-card alerts to any channel via Incoming Webhook), PagerDuty (Events API v2 with severity-aware paging), QuickBooks Online (parts purchases → bills), Google Sheets (export schedules and WOs), and Twilio (SMS alerts). Anything else can be wired through Webhooks (Settings → Webhooks). The roadmap turns the remaining most-requested webhook recipes into native one-click integrations.',
        ],
        bullets: [
          'Opsgenie native integration. Today: Webhook → Opsgenie REST API.',
          'SAP S/4HANA, NetSuite, Microsoft Dynamics 365, Oracle Fusion, Sage Intacct, Xero — native ERP/accounting integrations. Today: QuickBooks Online is native; everything else via Webhooks or the public REST API.',
        ],
      },
      {
        heading: 'Multi-domain expansion (vehicles, vessels, drones)',
        body: [
          'The first wave of multi-domain support is shipped — see the new "Vehicles, Vessels & UAVs" chapter for the full step-by-step. OBD-II, SAE J1939, NMEA 2000, and MAVLink connectors run on the Edge Gateway today; native importers for Geotab, Samsara, Verizon Connect, Motive (KeepTruckin), and Fleetio accept telematics directly via /api/telematics/import; and DVIR pre-trip / post-trip, USCG-style vessel pre-departure / return, and FAA Part 107-aligned UAV pre-flight / post-flight checklists are published at /docs/vehicle-templates. What is left on the roadmap below is the longer tail of EV-specific manufacturer APIs and a few additional convenience features.',
        ],
        bullets: [
          'EV-specific manufacturer APIs — Tesla Fleet API, Ford Pro, GM OnStar Business, Rivian Fleet — for fleets that have already gone electric and need OEM-grade telemetry that OBD-II cannot provide (state of charge, battery thermal, regen energy, charging-session events).',
          'Native distance-frequency PM schedules (BY_DISTANCE) — today, distance-based PMs are modeled by combining the imported odometer reading with a tiny scheduled job that pivots distance into BY_HOURS triggers. A native BY_DISTANCE frequency removes that workaround.',
          'Additional telematics importers — Lytx, Azuga, GPS Insight, Teletrac Navman, Wialon, on top of the five already shipped (Geotab, Samsara, Verizon Connect, Motive, Fleetio).',
          'GPS-based geofence trigger — native rule type that opens a WO when a Machine\'s gps_lat/gps_lon enters or exits a polygon (rather than requiring a customer-side scheduled job today).',
        ],
        callout: {
          type: 'info',
          text: 'If you are running a car dealership, trucking company, marine charter operator, drone-services company, or any vehicle-heavy fleet and you would like to be a design partner for the remaining items, contact sales — early customers in this category get accelerated implementation and influence over the priority of the EV-OEM API list.',
        },
      },
      {
        heading: 'Mobile',
        body: [
          'The mobile app covers the full technician floor workflow today — view assigned WOs, complete checklists, attach photos, scan QR codes, read the handbook offline, and (now shipped) work offline with an automatic sync queue for work-order status changes and alert resolutions (see the Mobile App chapter, "Working offline" section). The roadmap below extends the offline coverage to richer mutations and adds a few power-user touches.',
        ],
        bullets: [
          'Extend the offline queue to cover photo uploads (delayed-upload pipeline), part stock adjustments, and free-form work-order edits (today: status changes and alert resolutions only).',
          'Extended offline cache with size selector up to 4 GB (for remote installers covering large sites).',
          'iPadOS split-screen multitasking and external-keyboard shortcuts (cmd-N for new WO, cmd-K for global search).',
          'Rich-content push notifications with embedded chart thumbnails for critical alerts.',
        ],
      },
      {
        heading: 'Other',
        body: [
          'Smaller items that do not fit the categories above but are tracked.',
        ],
        bullets: [
          'Multi-language UI (today: English only; the handbook is English only).',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 14. GLOSSARY
  // ------------------------------------------------------------------
  {
    slug: 'glossary',
    emoji: '📚',
    title: 'Glossary',
    summary:
      'A quick reference for the maintenance, reliability, and IoT terms used across Myncel and this Handbook. Grouped by topic for easier scanning.',
    sections: [
      {
        heading: 'Core CMMS and maintenance terms',
        body: [],
        bullets: [
          'CMMS — Computerized Maintenance Management System; the category Myncel belongs to.',
          'EAM — Enterprise Asset Management; a superset of CMMS that adds financial-asset lifecycle and depreciation.',
          'Asset — any physical thing you maintain. Synonymous with "equipment" or "machine" in Myncel.',
          'PM — Preventive Maintenance; planned work done at a regular interval to prevent failures.',
          'PdM — Predictive Maintenance; data-driven maintenance triggered by sensor anomalies or AI.',
          'CM — Corrective Maintenance; reactive work done after something has broken.',
          'RCM — Reliability-Centered Maintenance; the methodology for choosing the right mix of PM, PdM, and run-to-failure per asset.',
          'CBM — Condition-Based Maintenance; a flavor of PdM where work is triggered by a measured condition crossing a threshold.',
          'TPM — Total Productive Maintenance; a culture/program that involves operators in basic maintenance.',
          'FMEA — Failure Mode and Effects Analysis; a structured way to identify what can go wrong on an asset.',
          'RCA — Root Cause Analysis; the post-mortem process for understanding why a failure happened.',
          'SOP — Standard Operating Procedure; a written, repeatable way of doing a task.',
          'LOTO — Lockout / Tagout; the safety procedure for de-energizing equipment before work.',
          'Work Order — the unit of work in Myncel; covers PM, PdM, CM, inspections, safety, and projects.',
          'Backlog — open work orders not yet completed; backlog age is a useful health metric.',
        ],
      },
      {
        heading: 'Reliability metrics',
        body: [],
        bullets: [
          'MTBF — Mean Time Between Failures; the average time between consecutive failures of an asset.',
          'MTTR — Mean Time To Repair; the average labor time to fix a failure (open → close, minus on-hold time).',
          'MTTF — Mean Time To Failure; for non-repairable items, the average lifetime before failure.',
          'OEE — Overall Equipment Effectiveness; a composite of Availability × Performance × Quality, expressed as a percentage.',
          'Availability — the fraction of scheduled time that an asset is up and running.',
          'PM Compliance — completed-on-time PMs / total PMs in the period.',
          'Wrench Time — the fraction of a technician\'s shift spent actually working on equipment (vs. travel, paperwork, waiting).',
          'Schedule Compliance — completed scheduled work / planned scheduled work in the period.',
        ],
      },
      {
        heading: 'IoT, control, and protocol terms',
        body: [],
        bullets: [
          'PLC — Programmable Logic Controller; the industrial computer that runs a machine.',
          'HMI — Human-Machine Interface; the operator-facing screen that talks to the PLC.',
          'SCADA — Supervisory Control and Data Acquisition; the system that monitors and controls multiple PLCs.',
          'DCS — Distributed Control System; a SCADA-like system tightly integrated with process equipment.',
          'OT — Operational Technology; the network of PLCs, HMIs, sensors. Distinct from IT.',
          'IT/OT convergence — the trend of OT data flowing into IT systems (and CMMS) over standard protocols.',
          'OPC-UA — Open Platform Communications Unified Architecture; a modern, secure industrial protocol.',
          'OPC-DA — the older OLE-for-Process-Control standard; legacy but still widely deployed.',
          'MQTT — Message Queuing Telemetry Transport; a lightweight publish/subscribe messaging protocol popular with IoT.',
          'Sparkplug B — an MQTT topic-and-payload spec from Cirrus Link / Eclipse, popular for IIoT.',
          'Modbus — a widely-used industrial serial/TCP protocol for reading PLC registers.',
          'Ethernet/IP — the CIP-over-Ethernet protocol used by Allen-Bradley / Rockwell.',
          'BACnet — Building Automation and Control Network; the standard for HVAC and building systems.',
          'SNMP — Simple Network Management Protocol; standard for IT and network gear.',
          'APNs — Apple Push Notification service; how iOS push notifications are delivered.',
          'FCM — Firebase Cloud Messaging; how Android push notifications are delivered.',
          'SSO — Single Sign-On; logging into multiple apps with one identity provider.',
          'SAML — Security Assertion Markup Language; the standard SSO protocol used by enterprises.',
          'OIDC — OpenID Connect; a modern OAuth-based SSO protocol.',
          'SCIM — System for Cross-domain Identity Management; standard for automated user provisioning.',
        ],
      },
    ],
  },
];

export function findChapter(slug: string): HandbookChapter | undefined {
  return HANDBOOK_CHAPTERS.find((c) => c.slug === slug);
}
