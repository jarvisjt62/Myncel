/**
 * lib/teams.ts
 *
 * Microsoft Teams Incoming Webhook client.
 *
 * Setup in Teams: Channel → "..." → Connectors → Incoming Webhook →
 * Configure → name + image → Create → copy the long https://*.webhook.office.com/...
 * URL. Paste it into Myncel and we POST adaptive-card JSON to it.
 *
 * No OAuth. The webhook URL acts as both ID and secret per channel.
 *
 * https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook
 * https://adaptivecards.io/explorer/AdaptiveCard.html
 */

export type TeamsSeverity = 'critical' | 'error' | 'warning' | 'info' | 'success';

export interface TeamsAlertCard {
  webhookUrl: string;
  title: string;
  /** Short tag shown next to the title — e.g. "BREAKDOWN" or "OVERDUE". */
  badge?: string;
  severity: TeamsSeverity;
  /** Body sentence, e.g. "Spindle vibration on CNC Mill #3 exceeded 12 mm/s." */
  message: string;
  /** Key/value rows shown in the card facts list. */
  facts?: Array<{ name: string; value: string }>;
  /** "Open in Myncel" / "Acknowledge" / etc. action buttons. */
  actions?: Array<{ title: string; url: string }>;
  /** Avatar/image at the top — defaults to Myncel logo. */
  imageUrl?: string;
}

const SEVERITY_COLORS: Record<TeamsSeverity, string> = {
  critical: 'attention',
  error:    'attention',
  warning:  'warning',
  info:     'accent',
  success:  'good',
};

const SEVERITY_EMOJI: Record<TeamsSeverity, string> = {
  critical: '🚨',
  error:    '❌',
  warning:  '⚠️',
  info:     'ℹ️',
  success:  '✅',
};

/**
 * Send an adaptive-card alert to a Microsoft Teams channel.
 * Returns { ok, status, error? }.
 */
export async function sendTeamsAlert(card: TeamsAlertCard): Promise<{
  ok: boolean;
  status: number;
  error?: string;
}> {
  if (!/^https:\/\/[^/]+\.webhook\.office\.com\//.test(card.webhookUrl)) {
    return { ok: false, status: 0, error: 'Webhook URL must be a *.webhook.office.com URL.' };
  }

  const emoji = SEVERITY_EMOJI[card.severity];
  const color = SEVERITY_COLORS[card.severity];

  const payload = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          msteams: { width: 'Full' },
          body: [
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  width: 'auto',
                  items: [
                    {
                      type: 'Image',
                      url: card.imageUrl || 'https://www.myncel.com/logo.png',
                      size: 'Small',
                      style: 'Person',
                      altText: 'Myncel',
                    },
                  ],
                },
                {
                  type: 'Column',
                  width: 'stretch',
                  items: [
                    {
                      type: 'TextBlock',
                      text: `${emoji} ${card.title}`,
                      weight: 'Bolder',
                      size: 'Medium',
                      color,
                      wrap: true,
                    },
                    card.badge
                      ? {
                          type: 'TextBlock',
                          text: card.badge,
                          spacing: 'None',
                          isSubtle: true,
                          size: 'Small',
                          weight: 'Bolder',
                        }
                      : null,
                  ].filter(Boolean),
                },
              ],
            },
            {
              type: 'TextBlock',
              text: card.message,
              wrap: true,
              spacing: 'Medium',
            },
            ...(card.facts && card.facts.length > 0
              ? [
                  {
                    type: 'FactSet',
                    facts: card.facts,
                    spacing: 'Medium',
                  },
                ]
              : []),
          ],
          ...(card.actions && card.actions.length > 0
            ? {
                actions: card.actions.map((a) => ({
                  type: 'Action.OpenUrl',
                  title: a.title,
                  url: a.url,
                })),
              }
            : {}),
        },
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(card.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || 'fetch failed' };
  }

  if (!res.ok) {
    let errorText = '';
    try {
      errorText = await res.text();
    } catch {}
    return { ok: false, status: res.status, error: errorText.slice(0, 500) };
  }
  return { ok: true, status: res.status };
}

/** Map Myncel alert level → Teams severity. */
export function teamsSeverityForAlert(myncelLevel: string | null | undefined): TeamsSeverity {
  const lvl = (myncelLevel || '').toUpperCase();
  if (lvl === 'CRITICAL' || lvl === 'BREAKDOWN') return 'critical';
  if (lvl === 'HIGH' || lvl === 'ERROR') return 'error';
  if (lvl === 'WARNING' || lvl === 'MEDIUM') return 'warning';
  if (lvl === 'SUCCESS' || lvl === 'RESOLVED') return 'success';
  return 'info';
}
