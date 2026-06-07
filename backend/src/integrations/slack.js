import { WebClient } from '@slack/web-api';

// search.messages requires a user token (search:read scope).
// conversations.history works with a bot token but requires channel enumeration.
const userClient = process.env.SLACK_USER_TOKEN
  ? new WebClient(process.env.SLACK_USER_TOKEN)
  : null;

const botClient = new WebClient(process.env.SLACK_BOT_TOKEN);

function formatMessage(msg, channelName) {
  const who = msg.username || msg.user || 'unknown';
  return `[Slack — #${channelName}] ${who}: ${msg.text || ''}`.slice(0, 3000);
}

function tsToDate(ts) {
  return new Date(parseFloat(ts) * 1000).toISOString().slice(0, 10);
}

// Path A: user token — fast, single search call
async function searchWithUserToken(companyName, maxResults) {
  const res = await userClient.search.messages({
    query: `"${companyName}"`,
    count: maxResults,
    sort: 'timestamp',
    sort_dir: 'desc',
  });

  return (res.messages?.matches || []).map(msg => ({
    source:      'slack',
    source_id:   `${msg.channel?.id}:${msg.ts}`,
    type:        'note',
    occurred_at: tsToDate(msg.ts),
    raw_content: formatMessage(msg, msg.channel?.name || 'unknown'),
  }));
}

// Path B: bot token — enumerate public channels, scan history for keyword
async function searchWithBotToken(companyName, maxResults) {
  const keyword = companyName.toLowerCase();
  const results = [];

  const channelList = await botClient.conversations.list({
    types: 'public_channel',
    limit: 100,
    exclude_archived: true,
  });

  const channels = channelList.channels || [];

  for (const channel of channels) {
    if (results.length >= maxResults) break;

    try {
      const history = await botClient.conversations.history({
        channel: channel.id,
        limit: 100,
      });

      const matches = (history.messages || []).filter(
        m => m.text && m.text.toLowerCase().includes(keyword)
      );

      for (const msg of matches) {
        if (results.length >= maxResults) break;
        results.push({
          source:      'slack',
          source_id:   `${channel.id}:${msg.ts}`,
          type:        'note',
          occurred_at: tsToDate(msg.ts),
          raw_content: formatMessage(msg, channel.name),
        });
      }
    } catch {
      // Bot may lack access to some channels — skip silently
    }
  }

  return results;
}

export async function fetchSlackMessages({ companyName, maxResults = 20 }) {
  try {
    if (!companyName) return [];

    if (userClient) {
      return await searchWithUserToken(companyName, maxResults);
    }
    return await searchWithBotToken(companyName, maxResults);
  } catch (err) {
    console.error('Slack fetch error:', err.message);
    return [];
  }
}
