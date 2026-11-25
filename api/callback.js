import { timingSafeEqual } from 'node:crypto';
import {
  callbackPage,
  getCookie,
  getOAuthConfig,
  getQueryParam,
  setSecurityHeaders,
  stateCookie,
} from './_lib/oauth.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  res.setHeader('Set-Cookie', stateCookie('', 0));

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed.');
  }

  let config;
  try {
    config = getOAuthConfig();
  } catch (error) {
    console.error('GitHub OAuth callback configuration failed:', error);
    return res.status(500).send('GitHub sign-in is not configured.');
  }

  const state = getQueryParam(req.query.state);
  const savedState = getCookie(req, 'decap_oauth_state');
  const statesMatch =
    state.length === savedState.length &&
    state.length > 0 &&
    timingSafeEqual(Buffer.from(state), Buffer.from(savedState));

  if (!statesMatch) {
    return res.status(400).send('Sign-in could not be verified. Close this window and try again.');
  }

  const code = getQueryParam(req.query.code);
  if (!code || getQueryParam(req.query.error)) {
    callbackPage(res, config.siteOrigin, 'error', { message: 'GitHub sign-in was cancelled or failed.' });
    return;
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.callbackUrl,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange returned HTTP ${tokenResponse.status}.`);
    }

    const tokenResult = await tokenResponse.json();
    if (typeof tokenResult.access_token !== 'string' || tokenResult.error) {
      throw new Error('GitHub did not return an access token.');
    }

    callbackPage(res, config.siteOrigin, 'success', {
      token: tokenResult.access_token,
      provider: 'github',
    });
  } catch (error) {
    console.error('GitHub OAuth token exchange failed:', error);
    callbackPage(res, config.siteOrigin, 'error', { message: 'GitHub sign-in failed. Please try again.' });
  }
}
