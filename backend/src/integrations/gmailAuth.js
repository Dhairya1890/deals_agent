/**
 * One-time script to get a Gmail refresh token.
 *
 * Before running:
 *   1. Go to Google Cloud Console → APIs & Services → Credentials
 *   2. Open your OAuth2 client → Authorized redirect URIs
 *   3. Add: http://localhost:3001/oauth2callback
 *   4. Save, then run: node src/integrations/gmailAuth.js
 *
 * Paste the printed GMAIL_REFRESH_TOKEN into your .env file.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const PORT = 3001;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // forces refresh_token to be returned even if previously authorized
});

console.log('\n─────────────────────────────────────────────');
console.log('Open this URL in your browser to authorize:');
console.log('\n' + authUrl + '\n');
console.log('Waiting for redirect on http://localhost:' + PORT + ' ...');
console.log('─────────────────────────────────────────────\n');

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname !== '/oauth2callback') {
      res.writeHead(404);
      res.end();
      return;
    }

    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h2>Authorization failed: ${error}</h2><p>Check your OAuth2 client settings.</p>`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h2>No code received.</h2>');
      server.close();
      process.exit(1);
    }

    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h2>✅ Authorization successful!</h2>
      <p>You can close this tab and check your terminal.</p>
    `);

    console.log('✅ Got tokens. Add this to your .env:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n(Access token expires — the refresh token is what you need.)\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Token exchange failed:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h2>Error: ${err.message}</h2>`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT);
