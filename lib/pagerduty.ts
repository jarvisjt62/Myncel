/**
 * lib/pagerduty.ts
 *
 * PagerDuty Events API v2 client.
 *
 * https://developer.pagerduty.com/docs/events-api-v2/overview/
 *
 * Authentication: a single `routing_key` (also called "Integration Key" in
 * the PagerDuty UI) per service. Get it from:
 *   PagerDuty → Services → <your service> → Integrations tab →
 *   "+ Add a new Integration" → "Events API V2" → copy the Integration Key.
 *
 * No OAuth, no refresh tokens. The routing_key acts as both ID and secret
 * and posts directly to https://events.pagerduty.com/v2/enqueue.
 */

const PD_ENDPOINT = 'https://events.pagerduty.com/v2/enqueue';

export type PagerDutySeverity = 'critical' | 'error' | 'warning' | 'info';

export interface PagerDutyTriggerPayload {
  /** PagerDuty Integration Key (32-char hex) */
  routingKey: string;
  /** Stable string that uniquely identifies this incident. Sending the same
   *  dedupKey re-routes to the existing incident; sending a NEW dedupKey
   *  creates a NEW incident. We use the Myncel resource ID + event-type. */
  dedupKey: string;
  /** Short summary that appears as the incident title (≤1024 chars). */
  summary: string;
  /** Logical source of the alert — usually the machine name or sensor ID. */
  source: string;
  severity: PagerDutySeverity;
  /** Optional component within the source (e.g. "spindle bearing"). */
  component?: string;
  /** Optional logical group (e.g. "CNC line A"). */
  group?: string;
  /** Optional alert class (e.g. "vibration_high", "wo_overdue"). */
  class?: string;
  /** Free-form structured details — shown in the PagerDuty incident UI. */
  customDetails?: Record<string, unknown>;
  /** Direct link back to Myncel that the on-call gets in the SMS / push. */
  clickThroughUrl?: string;
}

export interface PagerDutyResolvePayload {
  routingKey: string;
  dedupKey: string;
}

export interface PagerDutyAcknowledgePayload {
  routingKey: string;
  dedupKey: string;
}

export interface PagerDutyEnqueueResponse {
  status: 'success' | string;
  message: string;
  dedup_key: string;
}

async function postEvent(body: Record<string, unknown>): Promise<{
  ok: boolean;
  status: number;
  data: PagerDutyEnqueueResponse | { error: string };
}> {
  const res = await fetch(PD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = { error: 'Invalid JSON response from PagerDuty' };
  }
  return { ok: res.ok, status: res.status, data };
}

/** Trigger a new alert OR update an existing one (same dedupKey). */
export async function pagerDutyTrigger(p: PagerDutyTriggerPayload) {
  return postEvent({
    routing_key: p.routingKey,
    event_action: 'trigger',
    dedup_key: p.dedupKey,
    payload: {
      summary: p.summary.slice(0, 1024),
      source: p.source,
      severity: p.severity,
      component: p.component,
      group: p.group,
      class: p.class,
      custom_details: p.customDetails,
    },
    links: p.clickThroughUrl
      ? [{ href: p.clickThroughUrl, text: 'Open in Myncel' }]
      : undefined,
  });
}

/** Acknowledge an existing incident (silences re-pages, keeps the incident open). */
export async function pagerDutyAcknowledge(p: PagerDutyAcknowledgePayload) {
  return postEvent({
    routing_key: p.routingKey,
    event_action: 'acknowledge',
    dedup_key: p.dedupKey,
  });
}

/** Resolve / close an existing incident. */
export async function pagerDutyResolve(p: PagerDutyResolvePayload) {
  return postEvent({
    routing_key: p.routingKey,
    event_action: 'resolve',
    dedup_key: p.dedupKey,
  });
}

/** Severity rank: critical > error > warning > info */
export function pagerDutySeverityForAlert(myncelLevel: string | null | undefined): PagerDutySeverity {
  const lvl = (myncelLevel || '').toUpperCase();
  if (lvl === 'CRITICAL' || lvl === 'BREAKDOWN') return 'critical';
  if (lvl === 'HIGH' || lvl === 'ERROR') return 'error';
  if (lvl === 'WARNING' || lvl === 'MEDIUM') return 'warning';
  return 'info';
}
