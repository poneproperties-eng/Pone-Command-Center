const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly'
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function redirectUri(url) {
  return `${url.protocol}//${url.host}/oauth/callback`;
}

function randomState() {
  return crypto.randomUUID().replaceAll('-', '');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        app: 'Spin Cycle AI Marketing',
        runtime: 'cloudflare-worker',
        google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
      });
    }

    if (url.pathname === '/oauth/start') {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        return json({ ok: false, error: 'Google OAuth secrets are not configured yet.' }, 503);
      }
      const state = randomState();
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri(url),
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state
      });
      const headers = new Headers({
        location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        'set-cookie': `sc_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        'cache-control': 'no-store'
      });
      return new Response(null, { status: 302, headers });
    }

    if (url.pathname === '/oauth/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const cookie = request.headers.get('cookie') || '';
      const savedState = cookie.match(/(?:^|;\s*)sc_oauth_state=([^;]+)/)?.[1];
      if (!code || !state || !savedState || state !== savedState) {
        return json({ ok: false, error: 'OAuth state validation failed.' }, 400);
      }
      const body = new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri(url),
        grant_type: 'authorization_code'
      });
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body
      });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok) return json({ ok: false, error: 'Google token exchange failed.', details: tokens }, 502);

      // Do not expose or persist tokens until encrypted storage is configured.
      return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Google Connected</title><style>body{font-family:system-ui;background:#f0f9ff;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0}.c{background:white;padding:28px;border-radius:20px;max-width:560px;box-shadow:0 15px 45px #0c4a6e22}h1{color:#0369a1}</style><div class="c"><h1>Google authorization successful</h1><p>Spin Cycle AI Marketing reached Google successfully. For safety, this first connection test did not save your access or refresh token.</p><p>You can close this window and return to the app.</p></div>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'set-cookie': 'sc_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0', 'cache-control': 'no-store' } });
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ ok: false, error: 'Not found' }, 404);
  }
};
