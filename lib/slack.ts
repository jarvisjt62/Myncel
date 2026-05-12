/**
 * Post a message to Slack with auto channel-discovery fallback.
 *
 * Handles the common `channel_not_found` / `not_in_channel` errors by:
 *   1. Listing channels the bot can see (scope: channels:read)
 *   2. Preferring channels the bot is already a member of
 *   3. Attempting to join if needed (scope: channels:join — optional)
 *   4. Retrying the post
 *
 * Returns a normalized result object.
 */

export type SlackBlock = any;

export interface SlackPostResult {
  ok: boolean;
  channel?: string;
  ts?: string;
  error?: string;
  friendlyError?: string;
  raw?: any;
}

export async function slackPostWithFallback(
  accessToken: string,
  preferredChannel: string,
  text: string,
  blocks?: SlackBlock[]
): Promise<SlackPostResult> {
  const postTo = async (channel: string) => {
    const r = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ channel, text, blocks, unfurl_links: false }),
    });
    const data = await r.json();
    return { ok: !!data.ok, data };
  };

  let attempt = await postTo(preferredChannel);

  if (!attempt.ok && attempt.data?.error === 'channel_not_found') {
    try {
      const listRes = await fetch(
        'https://slack.com/api/conversations.list?exclude_archived=true&types=public_channel&limit=200',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const listData = await listRes.json();
      const candidates: any[] = Array.isArray(listData.channels) ? listData.channels : [];
      const memberOf = candidates.filter(c => c.is_member);
      const preferred =
        memberOf.find(c => c.is_general) ||
        memberOf.find(c => ['maintenance', 'ops', 'operations', 'random'].includes(c.name)) ||
        memberOf[0] ||
        candidates.find(c => c.is_general) ||
        candidates.find(c => c.name === 'random') ||
        candidates[0];

      if (preferred?.id) {
        if (!preferred.is_member) {
          await fetch('https://slack.com/api/conversations.join', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ channel: preferred.id }),
          }).catch(() => {});
        }
        attempt = await postTo(preferred.id);
      }
    } catch (discoverErr) {
      console.error('[slackPostWithFallback] channel discovery failed:', discoverErr);
    }
  }

  if (!attempt.ok) {
    const err = attempt.data?.error || 'unknown';
    let friendlyError = `Slack error: ${err}`;
    if (err === 'channel_not_found') {
      friendlyError =
        "Slack channel not found. In Slack, invite the Myncel bot to a channel with '/invite @Myncel' and try again. Or reconnect Slack in Settings → Integrations.";
    } else if (err === 'not_in_channel') {
      friendlyError =
        "The Myncel bot is not in the target channel. In Slack, run '/invite @Myncel' in that channel and try again.";
    } else if (err === 'invalid_auth' || err === 'token_revoked' || err === 'account_inactive') {
      friendlyError = 'Slack token is invalid or revoked. Please reconnect Slack in Settings → Integrations.';
    }
    return { ok: false, error: err, friendlyError, raw: attempt.data };
  }

  return {
    ok: true,
    channel: attempt.data.channel,
    ts: attempt.data.ts,
    raw: attempt.data,
  };
}
