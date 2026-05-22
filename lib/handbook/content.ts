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
 * also the source the AI assistant pulls from.
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
      'Welcome to Myncel — a CMMS (Computerized Maintenance Management System) built for small and mid-size manufacturers. This chapter walks you through your first 15 minutes: creating your account, setting up your facility, and adding your first piece of equipment.',
    sections: [
      {
        heading: 'What is Myncel?',
        body: [
          'Myncel is a maintenance management platform that helps you keep your manufacturing equipment running smoothly. It combines preventive maintenance scheduling, work order management, predictive maintenance powered by AI, and real-time alerts in one place.',
          'You can use Myncel from any web browser or from the dedicated iOS and Android mobile apps. Technicians on the floor can update work orders from their phones; managers can view dashboards from the office; and the AI engine watches your equipment 24/7 to warn you before things break.',
        ],
      },
      {
        heading: 'Creating your account',
        body: [
          'Visit www.myncel.com and click "Start free trial". You will be asked for your name, email, company name, and a password. The trial lasts 30 days and includes every feature with no credit card required.',
        ],
        steps: [
          'Click "Start free trial" on the homepage.',
          'Fill in your details and choose a strong password.',
          'Verify your email address — a link will be sent to your inbox.',
          'Sign in and complete the brief onboarding wizard (industry, facility size, primary equipment types).',
        ],
      },
      {
        heading: 'Your first 15 minutes',
        body: [
          'After signing in you will land on your dashboard. The first thing to do is add your facility, then add at least one piece of equipment, then create your first work order. Doing all three takes about 15 minutes.',
        ],
        steps: [
          'Go to Settings → Organization and confirm or update your facility name and address.',
          'Go to Equipment → "+ Add Equipment" and add one machine you want to track.',
          'Go to Work Orders → "+ Create Work Order" and create a sample task for that machine.',
          'Optionally invite a teammate from Settings → Team.',
        ],
        callout: {
          type: 'tip',
          text: 'You do not need to add all your equipment on day one. Many customers start with their 5–10 most critical machines and grow from there.',
        },
      },
      {
        heading: 'Understanding the dashboard',
        body: [
          'Your dashboard is the home base for your maintenance program. From the left sidebar you can reach Equipment, Work Orders, Schedules, Alerts, Reports, Parts, and Settings. The top of the dashboard shows real-time KPIs: machines online, open work orders, overdue tasks, and recent alerts. The right side highlights the AI assistant and recent activity.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 2. EQUIPMENT & MACHINES
  // ------------------------------------------------------------------
  {
    slug: 'equipment',
    emoji: '⚙️',
    title: 'Equipment & Machines',
    summary:
      'Everything about adding, organizing, and connecting your equipment to Myncel — from a simple manual entry to full IoT integration with real-time sensor data.',
    sections: [
      {
        heading: 'Equipment types Myncel supports',
        body: [
          'Myncel is industry-agnostic, but we have first-class templates for the most common manufacturing equipment categories. When you add a new machine you can pick from any of the templates below — they pre-fill recommended preventive maintenance schedules, sensor types, and common failure modes.',
        ],
        bullets: [
          'CNC machines (mills, lathes, routers, plasma cutters)',
          'Hydraulic and pneumatic presses',
          'Air compressors and vacuum pumps',
          'Conveyors and material-handling systems',
          'Injection-molding machines',
          'Welding stations and robotic welders',
          'Pumps, motors, and gearboxes',
          'HVAC, chillers, and cooling towers',
          'Forklifts and powered industrial trucks',
          'Generators and electrical switchgear',
          'Custom — define your own template',
        ],
      },
      {
        heading: 'How to add a machine',
        body: [
          'Adding a machine to Myncel takes under a minute. The only required fields are name and location — everything else can be filled in later.',
        ],
        steps: [
          'In the left sidebar click Equipment.',
          'Click the "+ Add Equipment" button at the top right.',
          'Pick an equipment template (or "Custom").',
          'Enter the machine name (e.g. "CNC Mill #3").',
          'Choose the location in your facility (Building, Floor, Cell).',
          'Optionally add: model number, serial number, manufacturer, installation date, and a photo.',
          'Click Save.',
        ],
        callout: {
          type: 'tip',
          text: 'Use a consistent naming pattern such as "[Type] #[number]" or "[Cell]-[Type]-[number]". Consistent names make work orders, reports, and alerts much easier to scan later.',
        },
      },
      {
        heading: 'Connecting equipment — three options',
        body: [
          'You can connect a machine to Myncel in three different ways depending on your budget and your existing infrastructure. You can also mix and match — many customers manually log usage on older machines while streaming live data from newer ones.',
        ],
      },
      {
        heading: 'Option 1 — Manual logging (no hardware)',
        body: [
          'The simplest option requires no hardware at all. Operators or technicians log runtime, cycle counts, and observed issues directly into Myncel using a phone or tablet on the shop floor.',
          'This works great for legacy equipment that has no PLC or network port. Schedules trigger based on calendar days or manually-entered runtime hours, and alerts fire whenever someone reports an anomaly.',
        ],
        bullets: [
          'Cost: $0 — included in every plan.',
          'Data quality: depends on operator discipline.',
          'Best for: machines that lack network connectivity, or for getting started quickly.',
        ],
      },
      {
        heading: 'Option 2 — IoT sensors (recommended)',
        body: [
          'For machines that lack a built-in network connection, Myncel supports a range of low-cost wireless IoT sensors that retrofit onto existing equipment. The sensors stream vibration, temperature, current draw, and runtime data to a small Myncel Edge Gateway in your facility, which then forwards it to the cloud.',
        ],
        steps: [
          'Order a Myncel Edge Gateway (one per facility) and the sensors that match your equipment from your account dashboard or a Myncel partner.',
          'Plug the gateway into your local network (wired Ethernet recommended) and power it on. It auto-registers itself with your Myncel account.',
          'Mount each sensor on the target machine following the install guide that ships with the kit (typical install: 5–15 minutes per machine).',
          'In Myncel, go to Equipment → click the machine → "Connect Sensor" → pick the sensor from the list of nearby unassigned sensors.',
          'Wait 7–14 days for the AI baseline to learn the machine\'s normal behavior. After that, predictive alerts will start firing automatically.',
        ],
        bullets: [
          'Vibration sensors — detect bearing wear, imbalance, misalignment, looseness.',
          'Temperature sensors — detect overheating motors, fluid issues, friction.',
          'Current sensors — detect overload, undercurrent, motor degradation.',
          'Runtime / cycle counters — track usage to drive PM schedules.',
        ],
        callout: {
          type: 'info',
          text: 'You do not have to buy hardware from Myncel. Any sensor that speaks MQTT, Modbus TCP, OPC-UA, or sends webhook JSON can be ingested. See the Integrations chapter.',
        },
      },
      {
        heading: 'Option 3 — Direct PLC / SCADA integration',
        body: [
          'Modern PLCs and SCADA systems already produce a wealth of data. Myncel can read directly from them through standard industrial protocols, removing the need for additional sensors.',
          'Supported protocols include OPC-UA, Modbus TCP, MQTT, Ethernet/IP, and REST/Webhook. Configuration is done in Settings → Integrations → Industrial Protocols.',
          'Direct PLC integration is included in the Professional and Enterprise plans. For Starter and Growth plans you can use the Edge Gateway as an MQTT bridge.',
        ],
        callout: {
          type: 'warning',
          text: 'Always coordinate with your controls engineer or system integrator before connecting Myncel to a production PLC. Use a read-only account on the PLC whenever possible.',
        },
      },
      {
        heading: 'Organizing equipment with locations and groups',
        body: [
          'Once you have more than a handful of machines you will want to organize them. Myncel supports a three-level hierarchy: Site → Building → Cell/Line. You can also create custom groups (e.g. "Rotating equipment" or "High-priority assets") that span the hierarchy.',
          'You can filter every screen — Equipment, Work Orders, Schedules, Alerts, Reports — by location or group, which is enormously helpful once your fleet grows past 50 machines.',
        ],
      },
      {
        heading: 'Equipment health and history',
        body: [
          'Click any machine to open its dedicated page. You will see real-time health (if sensors are connected), the full work-order history, all upcoming scheduled maintenance, attached documents (manuals, drawings, MSDS sheets), and a timeline of every event recorded for that asset. This is the single best place to land when you are diagnosing a recurring issue.',
        ],
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
      'Work orders are the unit of work in Myncel — every repair, inspection, and PM task is tracked as a work order. This chapter covers creating, assigning, completing, and reporting on work orders.',
    sections: [
      {
        heading: 'Creating a work order',
        body: [
          'Work orders can be created manually by anyone with permission, automatically by a maintenance schedule, or automatically by an AI alert.',
        ],
        steps: [
          'Click Work Orders in the sidebar.',
          'Click "+ Create Work Order".',
          'Pick the machine the work is for.',
          'Choose a type: Corrective, Preventive, Inspection, Safety, or Project.',
          'Set a priority: Low, Medium, High, or Critical.',
          'Write a clear title and description.',
          'Assign it to a technician (or leave unassigned for the team to claim).',
          'Set a due date.',
          'Optionally attach photos, parts, or documents.',
          'Click Create.',
        ],
      },
      {
        heading: 'Work order statuses',
        body: [
          'Every work order moves through a lifecycle. The status determines what is shown on dashboards and what alerts fire.',
        ],
        bullets: [
          'Open — created but no one has started yet.',
          'In Progress — a technician has accepted and is working.',
          'On Hold — paused waiting for parts, vendor, or approval.',
          'Completed — work is done and signed off.',
          'Cancelled — closed without being done (e.g. duplicate or no longer needed).',
        ],
      },
      {
        heading: 'Completing a work order',
        body: [
          'When a technician finishes a job they should mark the work order Completed and fill in the completion form. The form captures actual labor time, parts consumed, what was done, and any follow-up needed.',
        ],
        callout: {
          type: 'tip',
          text: 'Encourage technicians to attach a photo of the completed repair. Photos make audits, warranty claims, and root-cause analysis dramatically easier later.',
        },
      },
      {
        heading: 'Approval workflows',
        body: [
          'On the Growth plan and above you can require manager approval before a work order is created (for tasks above a cost or hours threshold) or before it is closed (for safety-critical work). Approval rules are configured in Settings → Workflows.',
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
      'The whole point of a CMMS is to fix things before they break. Myncel offers two complementary approaches: time- or usage-based preventive maintenance, and AI-powered predictive maintenance.',
    sections: [
      {
        heading: 'Preventive maintenance schedules',
        body: [
          'A preventive maintenance (PM) schedule automatically generates a work order at a defined interval. Intervals can be calendar-based (every 30 days), runtime-based (every 500 hours), cycle-based (every 10,000 cycles), or condition-based.',
        ],
        steps: [
          'Go to Schedules in the sidebar.',
          'Click "+ New Schedule".',
          'Pick the machine (or a group of machines).',
          'Choose the trigger: Calendar, Runtime, Cycles, or Condition.',
          'Define the interval (e.g. every 30 days, or every 500 hours).',
          'Write the task checklist (what should the technician do?).',
          'Optionally attach a parts list and required tools.',
          'Save.',
        ],
        callout: {
          type: 'tip',
          text: 'Start with manufacturer-recommended intervals from the equipment manual, then adjust based on actual data after 3–6 months. The Reports → PM Effectiveness view tells you which schedules are catching real issues vs over-maintaining.',
        },
      },
      {
        heading: 'Predictive maintenance with AI',
        body: [
          'When sensors are connected to a machine, Myncel\'s AI engine learns the machine\'s normal behavior over a 7–14 day baseline period. After that it watches in real time for deviations: a vibration signature creeping up, a motor running hotter than usual, current draw drifting outside the normal envelope.',
          'When the AI sees a meaningful change it raises a predictive alert and (optionally) auto-creates a work order. Predictive alerts include the machine, the sensor, what changed, the confidence level, and an estimated time-to-failure window when one can be calculated.',
        ],
        bullets: [
          'No machine learning expertise required — baselines are automatic.',
          'You can adjust sensitivity per machine in Equipment → [machine] → AI Settings.',
          'Available on the Growth plan and above (Starter plan supports rules-based alerts only).',
        ],
      },
      {
        heading: 'PM checklists and digital forms',
        body: [
          'Each schedule can include a structured checklist. Technicians complete it on mobile or web — text fields, dropdowns, photos, signatures, and pass/fail items are all supported. Completed forms are saved permanently against the work order and can be exported for audits.',
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
      'How to invite teammates, assign roles, and manage permissions so the right people see the right things.',
    sections: [
      {
        heading: 'Inviting a teammate',
        body: [
          'Anyone with the Manager or Admin role can invite teammates. Each plan has a maximum number of users — see the Account & Plans chapter for the limits.',
        ],
        steps: [
          'Go to Settings → Team.',
          'Click "+ Invite User".',
          'Enter the email address.',
          'Choose a role (see below).',
          'Optionally restrict the user to a specific facility, location, or equipment group.',
          'Click Send Invite.',
        ],
        callout: {
          type: 'info',
          text: 'Invitees receive an email with a one-time signup link. The link is valid for 7 days. You can resend or revoke it from the same screen.',
        },
      },
      {
        heading: 'Built-in roles',
        body: [
          'Myncel ships with five built-in roles. They cover the needs of most maintenance organizations. On the Professional and Enterprise plans you can also create custom roles with fine-grained permissions.',
        ],
        bullets: [
          'Admin — full access including billing and team management.',
          'Manager — full operational access; can configure schedules, approve work orders, view all reports. Cannot change billing.',
          'Technician — view and update assigned work orders, log time and parts, complete checklists. Cannot delete records.',
          'Operator — view machines they run and report issues. Read-only on most things.',
          'Viewer — read-only access for executives, auditors, or interested stakeholders.',
        ],
      },
      {
        heading: 'Custom roles and permissions',
        body: [
          'On the Professional plan you can mix and match permissions to create custom roles such as "Reliability Engineer" or "Stockroom Manager". Permissions are organized by feature area (Equipment, Work Orders, Schedules, Reports, Parts, Settings) and action (View, Create, Edit, Delete, Approve).',
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
      'Configure how Myncel reaches you when something needs attention — in-app, email, SMS, push notifications, Slack, or PagerDuty.',
    sections: [
      {
        heading: 'Notification channels',
        body: [
          'Each user can configure their own notification preferences from the user menu → Notifications. You can choose a different channel for each event type.',
        ],
        bullets: [
          'In-app — always on; appears in the bell icon at the top right.',
          'Email — default for most events; granular per event type.',
          'SMS — for urgent alerts (Growth plan and above).',
          'Mobile push — to the iOS or Android app (Starter plan and above).',
          'Slack — post to a channel of your choice (any plan with the Slack integration).',
          'PagerDuty — escalate critical alerts to on-call rotations (Professional plan and above).',
        ],
      },
      {
        heading: 'Mobile push notifications',
        body: [
          'After installing the Myncel mobile app and signing in, push notifications are enabled by default. The app uses Apple Push Notification service (APNs) on iOS and Firebase Cloud Messaging (FCM) on Android.',
          'You will receive a notification banner on the lock screen, an icon badge, and (if enabled in your phone\'s settings) a sound for events like new work-order assignments, predictive alerts, and emergency broadcasts. Tapping the notification jumps you straight to the relevant work order or alert in the app.',
        ],
        callout: {
          type: 'tip',
          text: 'If a teammate is not receiving push notifications, ask them to: (1) make sure the app is installed and signed in; (2) check iOS Settings → Notifications → Myncel is set to Allow; and (3) toggle the channel in user-menu → Notifications.',
        },
      },
      {
        heading: 'Quiet hours',
        body: [
          'Nobody wants a "low-priority work order created" SMS at 2 AM. Quiet hours let each user silence non-critical notifications between configurable times. Critical alerts (Priority = Critical, or emergency broadcasts) always break through quiet hours by default — you can change this per user.',
        ],
      },
      {
        heading: 'Emergency broadcasts',
        body: [
          'Admins can send an emergency broadcast to every user in the organization with one click — useful for facility-wide events like power outages, evacuations, or production halts. Broadcasts go to every channel a user has configured (in-app, email, SMS, push) regardless of quiet hours, and are logged in the audit trail.',
        ],
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
      'Out-of-the-box reports for the metrics that matter — MTBF, MTTR, PM compliance, downtime, parts usage, and labor — plus a custom report builder.',
    sections: [
      {
        heading: 'Built-in reports',
        body: [
          'Open the Reports tab in the sidebar to see the full list of pre-built reports. Each one supports filtering by date range, facility, equipment group, and team.',
        ],
        bullets: [
          'MTBF (Mean Time Between Failures) — by machine and by group.',
          'MTTR (Mean Time To Repair) — labor time from work-order open to close.',
          'PM Compliance — percentage of preventive tasks completed on time.',
          'Downtime — total downtime by machine and reason code.',
          'Work Order Backlog — open work orders by age and priority.',
          'Parts Consumption — most-used parts and stockout risks.',
          'Labor Utilization — hours by technician, by equipment, by work-order type.',
          'Cost Roll-up — labor + parts cost per machine and per facility.',
          'Predictive Alert Effectiveness — caught vs missed events (Growth plan and above).',
        ],
      },
      {
        heading: 'Exporting and scheduling reports',
        body: [
          'Every report can be exported to CSV, Excel, or PDF. You can also schedule a report to be emailed automatically — for example a "weekly PM compliance" PDF every Monday morning to your operations director.',
        ],
        steps: [
          'Open any report.',
          'Apply the filters you want.',
          'Click "Schedule" in the top-right.',
          'Choose recipients, frequency (daily, weekly, monthly), and format (CSV, Excel, PDF).',
          'Save.',
        ],
      },
      {
        heading: 'Custom report builder',
        body: [
          'Need something not in the built-in list? On the Professional plan, the custom report builder lets you pick fields, group, filter, and visualize data from across Myncel — work orders, equipment, schedules, parts, labor, and AI alerts. Saved custom reports show up in the same Reports tab and can also be scheduled.',
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
      'Myncel plays nicely with the rest of your stack — Slack, Microsoft Teams, PagerDuty, ERP systems, single sign-on, and industrial protocols for IoT and SCADA data.',
    sections: [
      {
        heading: 'Communication tools',
        body: [
          'Connect Slack or Microsoft Teams to push alerts and work-order updates into the channels your team already lives in. The integration is two-way — you can comment on a work order from Slack and the comment shows up in Myncel.',
        ],
        steps: [
          'Go to Settings → Integrations → Slack (or Teams).',
          'Click Connect and authorize the workspace.',
          'Pick which channels receive which event types.',
          'Save.',
        ],
      },
      {
        heading: 'On-call paging',
        body: [
          'On the Professional plan, PagerDuty and Opsgenie integrations let you escalate critical alerts to on-call rotations with full lifecycle (acknowledge, escalate, resolve). Configure the API key in Settings → Integrations → PagerDuty.',
        ],
      },
      {
        heading: 'ERP / accounting',
        body: [
          'Myncel can sync parts inventory and purchase orders bidirectionally with most major ERP systems including SAP, NetSuite, QuickBooks, and Sage. Sync runs hourly by default and can be triggered manually. Setup typically requires 30–60 minutes with help from our integration team and is included on the Professional and Enterprise plans.',
        ],
      },
      {
        heading: 'Industrial protocols (IoT / SCADA)',
        body: [
          'For machine data we support the standard industrial protocols. Configure each connection in Settings → Integrations → Industrial.',
        ],
        bullets: [
          'MQTT — both broker and client mode.',
          'Modbus TCP — read holding registers, input registers, coils.',
          'OPC-UA — secure subscription-based reads.',
          'Ethernet/IP — for Allen-Bradley / Rockwell PLCs.',
          'REST / Webhook — for custom systems that can POST JSON.',
        ],
      },
      {
        heading: 'Single sign-on (SSO)',
        body: [
          'On the Professional and Enterprise plans, SSO via SAML 2.0 and OpenID Connect is supported. Compatible with Okta, Azure AD, Google Workspace, OneLogin, and any SAML-compliant identity provider.',
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
      'The Myncel mobile app for iOS and Android lets technicians work from the floor — view assigned work orders, complete checklists, scan QR codes, attach photos, and receive push alerts.',
    sections: [
      {
        heading: 'Installing the app',
        body: [
          'The Myncel mobile app is available on the iOS App Store and the Google Play Store. Search for "Myncel" or follow the install link from your dashboard.',
        ],
      },
      {
        heading: 'Signing in',
        body: [
          'Use the same email and password you use on the web. SSO users can sign in with their identity provider directly from the app. Once signed in, the app syncs your assigned work orders, your facility\'s equipment list, and your notification preferences.',
        ],
      },
      {
        heading: 'Working offline',
        body: [
          'The app works fully offline. You can open work orders, complete checklists, attach photos, and add comments without a network connection. As soon as the device is back online (Wi-Fi or cellular) everything syncs automatically. The sync indicator at the top of the screen shows the current state.',
        ],
      },
      {
        heading: 'QR codes and barcodes',
        body: [
          'Print QR-code stickers for your equipment from Myncel (Equipment → [machine] → "Print QR"). Technicians can scan the sticker with the mobile app to instantly open that machine\'s page — its history, open work orders, and "Create Work Order" button. Same flow works for parts and locations.',
        ],
      },
      {
        heading: 'Push notifications',
        body: [
          'Push notifications are enabled by default after sign-in. See the Alerts & Notifications chapter for full details, including how to set quiet hours and choose which event types you receive.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 10. ACCOUNT, BILLING & PLANS
  // ------------------------------------------------------------------
  {
    slug: 'account-billing-plans',
    emoji: '💳',
    title: 'Account, Billing & Plans',
    summary:
      'Pricing tiers, what each plan includes, how to upgrade or downgrade, and how to manage billing details.',
    sections: [
      {
        heading: 'Plans and pricing',
        body: [
          'Myncel has four plans. Annual billing saves roughly 20% compared to monthly. All paid plans include a 30-day free trial and you can cancel any time.',
        ],
        bullets: [
          'Starter — $49/month (or $39/month annual). Up to 25 machines, 10 users, 500 work orders/month. Includes core CMMS features and rules-based alerts.',
          'Growth — $99/month (or $79/month annual). Up to 100 machines, 25 users, 2,000 work orders/month. Adds AI-powered predictive maintenance and SMS alerts.',
          'Professional — $249/month (or $199/month annual). Up to 500 machines, 100 users, 10,000 work orders/month. Adds SCADA integration, PagerDuty, phone support, white-label, SSO/SAML, and the custom report builder.',
          'Enterprise — Custom pricing. Unlimited machines, users, and work orders. Dedicated success manager, on-premise option, custom SLA, and bespoke integrations.',
        ],
      },
      {
        heading: 'Free trial',
        body: [
          'Every new account gets a 30-day free trial of the Growth plan with no credit card required. At day 28 you will see in-app prompts to choose a plan; if you do nothing, the account drops to a free read-only mode at day 31 — your data is preserved indefinitely so you can come back any time.',
        ],
      },
      {
        heading: 'Upgrading or downgrading',
        body: [
          'Plan changes happen in Settings → Billing → Change Plan. Upgrades take effect immediately and are pro-rated. Downgrades take effect at the end of the current billing period.',
        ],
        callout: {
          type: 'warning',
          text: 'If you downgrade and your data exceeds the new plan\'s limits (e.g. you have 60 machines but downgrade to Starter\'s 25-machine limit), the system stays read-only on equipment beyond the limit until you remove some or upgrade again. No data is ever deleted automatically.',
        },
      },
      {
        heading: 'Cancelling',
        body: [
          'You can cancel any time from Settings → Billing → Cancel Subscription. Your account stays active until the end of the period you have already paid for, then drops to free read-only. Reactivation restores everything within seconds.',
        ],
      },
      {
        heading: 'Exporting your data',
        body: [
          'Your data is yours. Settings → Data → Export gives you a one-click full export as ZIP containing every work order, equipment record, parts entry, schedule, and document attachment. Available on every plan.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 11. TROUBLESHOOTING
  // ------------------------------------------------------------------
  {
    slug: 'troubleshooting',
    emoji: '🛠',
    title: 'Troubleshooting & FAQ',
    summary:
      'Common questions and quick fixes — from login issues to "why is my machine showing offline".',
    sections: [
      {
        heading: 'I forgot my password',
        body: [
          'Go to the sign-in page and click "Forgot password". Enter your email and follow the link sent to your inbox. The link is valid for 1 hour. If you do not receive it within a few minutes, check your spam folder and confirm the email matches the one on your account.',
        ],
      },
      {
        heading: 'My machine shows "offline" but it is running',
        body: [
          'This means Myncel has not received a heartbeat from the machine\'s sensor or PLC connection in the expected window.',
        ],
        steps: [
          'Open the machine\'s page → "Connection" tab → look at the last-seen timestamp.',
          'If it has been more than a few minutes, check the Edge Gateway is online (Settings → Integrations → Edge Gateway).',
          'For IoT sensors, check the sensor battery and signal strength.',
          'For PLC connections, verify the PLC is reachable from the gateway (ping test inside the gateway diagnostics page).',
          'Re-sync from the machine page if needed. If the issue persists, contact support.',
        ],
      },
      {
        heading: 'Push notifications are not arriving',
        body: [
          'Three things to check, in order:',
        ],
        steps: [
          'Confirm the mobile app is installed, signed in, and up to date.',
          'On iOS: Settings → Notifications → Myncel → Allow Notifications must be on. On Android: Settings → Apps → Myncel → Notifications must be on.',
          'In the Myncel mobile app: user-menu → Notifications → confirm the channels you want are toggled on, and that quiet hours are not currently silencing the type of alert.',
          'If still nothing arrives, send a test from /admin/push-debug (super-admins) or contact support — we can confirm the device token is registered and the message reached the platform.',
        ],
      },
      {
        heading: 'The AI assistant gave a wrong answer',
        body: [
          'Click the 👎 below the answer in the chat widget. That logs the feedback for the team. You can also switch the chat to "Live Support" at any time and a human will pick up. The AI is grounded in this very Handbook — if a topic is missing or unclear here, that is the place to fix it.',
        ],
      },
      {
        heading: 'Contacting human support',
        body: [
          'You can always reach a human at support@myncel.com or through the Live Support tab in the chat widget. Professional and Enterprise plans include phone support; the number is shown in your Settings → Billing page.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // 12. GLOSSARY
  // ------------------------------------------------------------------
  {
    slug: 'glossary',
    emoji: '📚',
    title: 'Glossary',
    summary:
      'A quick reference for the maintenance and reliability terms used across Myncel and this Handbook.',
    sections: [
      {
        heading: 'Glossary of terms',
        body: [],
        bullets: [
          'CMMS — Computerized Maintenance Management System; the category Myncel belongs to.',
          'PM — Preventive Maintenance; planned work done at a regular interval to prevent failures.',
          'PdM — Predictive Maintenance; data-driven maintenance triggered by sensor anomalies.',
          'CM — Corrective Maintenance; reactive work done after something has broken.',
          'MTBF — Mean Time Between Failures; the average time between consecutive failures of an asset.',
          'MTTR — Mean Time To Repair; the average labor time to fix a failure.',
          'OEE — Overall Equipment Effectiveness; a composite metric of availability × performance × quality.',
          'PLC — Programmable Logic Controller; the industrial computer that runs a machine.',
          'SCADA — Supervisory Control and Data Acquisition; the system that monitors and controls multiple PLCs.',
          'OPC-UA — Open Platform Communications Unified Architecture; a modern, secure industrial protocol.',
          'MQTT — Message Queuing Telemetry Transport; a lightweight messaging protocol popular with IoT.',
          'Modbus — A widely-used industrial serial/TCP protocol for reading PLC registers.',
          'APNs — Apple Push Notification service; how iOS push notifications are delivered.',
          'FCM — Firebase Cloud Messaging; how Android push notifications are delivered.',
          'SSO — Single Sign-On; logging into multiple apps with one identity provider.',
          'SAML — Security Assertion Markup Language; the standard SSO protocol used by enterprises.',
        ],
      },
    ],
  },
];

export function findChapter(slug: string): HandbookChapter | undefined {
  return HANDBOOK_CHAPTERS.find((c) => c.slug === slug);
}
