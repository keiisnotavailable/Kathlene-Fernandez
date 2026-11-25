import { randomBytes } from 'node:crypto';

export function getOAuthConfig() {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SITE_URL } = process.env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !SITE_URL) {
    throw new Error('GitHub OAuth environment variables are not configured.');
  }

  let site;
  try {
    site = new URL(SITE_URL);
  } catch {
    throw new Error('SITE_URL must be a valid HTTPS origin.');
  }

  if (site.protocol !== 'https:' || !['', '/'].includes(site.pathname) || site.search || site.hash) {
    throw new Error('SITE_URL must be an HTTPS origin without a path.');
  }

  return {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    siteOrigin: site.origin,
    callbackUrl: new URL('/api/callback', site.origin).toString(),
  };
}

export function getQueryParam(value) {
  return typeof value === 'string' ? value : '';
}

export function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== 'string') return '';

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : '';
}

export function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
}

export function createState() {
  return randomBytes(32).toString('hex');
}

export function stateCookie(value, maxAge) {
  return `decap_oauth_state=${value}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=${maxAge}`;
}

export function callbackPage(res, siteOrigin, status, payload) {
  const nonce = randomBytes(16).toString('base64');
  const safeOrigin = JSON.stringify(siteOrigin);
  const safeStatus = JSON.stringify(status);
  const safePayload = JSON.stringify(payload).replace(/[<>&]/g, (character) => {
    const escapes = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026' };
    return escapes[character];
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  );
  res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>GitHub sign-in</title></head>
<body><p>Completing sign-in…</p>
<script nonce="${nonce}">
(() => {
  const origin = ${safeOrigin};
  const status = ${safeStatus};
  const payload = ${safePayload};
  if (!window.opener) {
    document.body.textContent = 'Sign-in window was closed. Close this tab and try again.';
    return;
  }
  const receiveMessage = (event) => {
    if (event.origin !== origin || event.source !== window.opener || event.data !== 'authorizing:github') return;
    window.removeEventListener('message', receiveMessage);
    window.opener.postMessage('authorization:github:' + status + ':' + JSON.stringify(payload), event.origin);
    window.close();
  };
  window.addEventListener('message', receiveMessage);
  window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`);
}
