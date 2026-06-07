import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Recursively extract plain-text body from any MIME structure
function extractPlainText(payload) {
  if (!payload) return '';

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
  }

  if (payload.parts) {
    // Prefer text/plain parts; skip text/html and attachments
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain) return extractPlainText(plain);

    // Recurse into multipart/alternative or multipart/mixed
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }

  return '';
}

function buildQuery(companyName, stakeholderEmails) {
  const parts = [];
  if (companyName) parts.push(`"${companyName}"`);
  for (const email of stakeholderEmails) {
    parts.push(`from:${email}`, `to:${email}`);
  }
  return parts.join(' OR ');
}

function parseDate(dateStr) {
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function fetchGmailThreads({ companyName, stakeholderEmails = [], maxResults = 20 }) {
  try {
    const q = buildQuery(companyName, stakeholderEmails);
    if (!q) return [];

    const listRes = await gmail.users.messages.list({ userId: 'me', q, maxResults });
    const messages = listRes.data.messages || [];

    const results = await Promise.allSettled(
      messages.map(async ({ id }) => {
        const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        const headers = msg.data.payload.headers;

        const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
        const from    = headers.find(h => h.name === 'From')?.value || '';
        const to      = headers.find(h => h.name === 'To')?.value || '';
        const date    = headers.find(h => h.name === 'Date')?.value || '';
        const body    = extractPlainText(msg.data.payload).slice(0, 3000);

        return {
          source:       'gmail',
          source_id:    id,
          type:         'email',
          occurred_at:  parseDate(date),
          raw_content:  `From: ${from}\nTo: ${to}\nSubject: ${subject}\n\n${body}`.trim(),
        };
      })
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
  } catch (err) {
    console.error('Gmail fetch error:', err.message);
    return [];
  }
}
