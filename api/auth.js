import { getOAuthConfig, setSecurityHeaders, createState, stateCookie } from './_lib/oauth.js';

export default function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed.');
  }

  try {
    const { clientId, callbackUrl } = getOAuthConfig();
    const state = createState();
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
    authorizeUrl.searchParams.set('scope', 'public_repo');
    authorizeUrl.searchParams.set('state', state);

    res.setHeader('Set-Cookie', stateCookie(state, 600));
    return res.redirect(302, authorizeUrl.toString());
  } catch (error) {
    console.error('GitHub OAuth initialization failed:', error);
    return res.status(500).send('GitHub sign-in is not configured. Check the Vercel environment variables.');
  }
}
