/**
 * Post a message to Slack with aggressive auto channel-discovery fallback.
 *
 * Strategy (in order):
 *   1. Try the preferred channel.
 *   2. On channel_not_found OR not_in_channel:
 *       a. List channels (public + private where visible).
 *       b. Pick ONLY channels the bot is already a member of (is_member: true).
 *          Prefer general > maintenance/ops > random > first.
 *       c. If none, try public channels the bot could join (try join).
 *   3. If still failing, fall back to DM the installing user via auth.test -> user_id -> conversations.open.
 *   4. Return a friendly error.
 *
 * Scopes this uses: chat:write, channels:read, groups:read, im:write, users:read
 * Optional: channels:join (only for auto-joining public channels)
 */

export type SlackBlock = any;

export interface SlackPostResult {
  ok: boolean;
  channel?: string;
  channelName?: string;
  ts?: string;
  error?: string;
  friendlyError?: string;
  fallbackUsed?: 'preferred' | 'member_channel' | 'joined_channel' | 'dm';
  raw?: any;
}

const RETRY_ERRORS = new Set([
  'channel_not_found',
  'not_in_channel',
  'is_archived',
  'channel_is_archived',
]);

async function slackCall(accessToken: string, path: string, init?: RequestInit) {
  const r = await fetch(`https://slack.com/api/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });
  return r.json().catch(() => ({ ok: false, error: 'invalid_json' }));
}

async function postMessage(accessToken: string, channel: string, text: string, blocks?: SlackBlock[]) {
  const data = await slackCall(accessToken, 'chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ channel, text, blocks, unfurl_links: false }),
  });
  return { ok: !!data.ok, data };
}

export async function slackPostWithFallback(
  accessToken: string,
  preferredChannel: string,
  text: string,
  blocks?: SlackBlock[]
): Promise<SlackPostResult> {
  // 1. Try preferred channel first
  let attempt = await postMessage(accessToken, preferredChannel, text, blocks);
  if (attempt.ok) {
    return {
      ok: true,
      channel: attempt.data.channel,
      ts: attempt.data.ts,
      fallbackUsed: 'preferred',
      raw: attempt.data,
    };
  }

  const initialError = attempt.data?.error;

  // 2. If retry-able, discover a channel the bot IS already in
  if (RETRY_ERRORS.has(initialError)) {
    try {
      // List public + private channels the bot can see
      const listData = await slackCall(
        accessToken,
        'conversations.list?exclude_archived=true&types=public_channel,private_channel&limit=500'
      );
      const channels: any[] = Array.isArray(listData.channels) ? listData.channels : [];

      // 2a. Channels where bot is already a member — safest, no join needed
      const memberChannels = channels.filter((c: any) => c.is_member && !c.is_archived);
      const rank = (c: any) => {
        if (c.is_general) return 0;
        if (['maintenance', 'myncel', 'ops', 'operations'].includes(c.name)) return 1;
        if (['general', 'random'].includes(c.name)) return 2;
        return 5;
      };
      memberChannels.sort((a: any, b: any) => rank(a) - rank(b));

      for (const ch of memberChannels) {
        const r = await postMessage(accessToken, ch.id, text, blocks);
        if (r.ok) {
          return {
            ok: true,
            channel: r.data.channel,
            channelName: ch.name,
            ts: r.data.ts,
            fallbackUsed: 'member_channel',
            raw: r.data,
          };
        }
      }

      // 2b. Try joining a public channel (needs channels:join scope)
      const publicJoinable = channels.filter(
        (c: any) => !c.is_member && !c.is_archived && !c.is_private && !c.is_im
      );
      publicJoinable.sort((a: any, b: any) => rank(a) - rank(b));

      for (const ch of publicJoinable.slice(0, 5)) {
        const joinRes = await slackCall(accessToken, 'conversations.join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ channel: ch.id }).toString(),
        });
        if (joinRes.ok) {
          const r = await postMessage(accessToken, ch.id, text, blocks);
          if (r.ok) {
            return {
              ok: true,
              channel: r.data.channel,
              channelName: ch.name,
              ts: r.data.ts,
              fallbackUsed: 'joined_channel',
              raw: r.data,
            };
          }
        }
      }
    } catch (err) {
      console.error('[slackPostWithFallback] channel discovery failed:', err);
    }

    // 3. Last-resort: DM the installing user
    try {
      const authTest = await slackCall(accessToken, 'auth.test');
      const userId = authTest?.user_id;
      if (userId) {
        const imOpen = await slackCall(accessToken, 'conversations.open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ users: userId }),
        });
        const imChannel = imOpen?.channel?.id;
        if (imChannel) {
          const r = await postMessage(accessToken, imChannel, text, blocks);
          if (r.ok) {
            return {
              ok: true,
              channel: r.data.channel,
              channelName: 'Direct Message',
              ts: r.data.ts,
              fallbackUsed: 'dm',
              raw: r.data,
            };
          }
        }
      }
    } catch (err) {
      console.error('[slackPostWithFallback] DM fallback failed:', err);
    }
  }

  // 4. Friendly error
  const err = initialError || attempt.data?.error || 'unknown';
  let friendlyError = `Slack error: ${err}`;
  if (err === 'channel_not_found' || err === 'not_in_channel') {
    friendlyError =
      "Couldn't find a Slack channel the Myncel bot can post to. In Slack, run `/invite @Myncel` in any channel (or add the app in the channel's settings), then try again.";
  } else if (err === 'invalid_auth' || err === 'token_revoked' || err === 'account_inactive') {
    friendlyError = 'Slack token is invalid or revoked. Please reconnect Slack in Settings → Integrations.';
  } else if (err === 'missing_scope') {
    friendlyError = 'Slack app is missing scopes. Please reconnect Slack in Settings → Integrations.';
  } else if (err === 'ratelimited') {
    friendlyError = 'Slack rate-limit hit. Please try again in a few seconds.';
  }
  return { ok: false, error: err, friendlyError, raw: attempt.data };
}
