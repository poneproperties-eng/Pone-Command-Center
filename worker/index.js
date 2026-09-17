const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly'
];

const TOKEN_KEY = 'spin-cycle-google-oauth';

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

async function storedTokens(env) {
  if (!env.GOOGLE_TOKENS) return null;
  return env.GOOGLE_TOKENS.get(TOKEN_KEY, { type: 'json' });
}

async function getAccessToken(env) {
  const saved = await storedTokens(env);
  if (!saved) throw new Error('Google is not connected yet.');
  if (saved.access_token && saved.expires_at && Date.now() < saved.expires_at - 60000) return saved.access_token;
  if (!saved.refresh_token) throw new Error('No Google refresh token is stored. Reconnect Google.');

  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: saved.refresh_token,
    grant_type: 'refresh_token'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const fresh = await response.json();
  if (!response.ok) throw new Error(`Google refresh failed: ${fresh.error || response.status}`);
  const merged = {
    ...saved,
    ...fresh,
    refresh_token: saved.refresh_token,
    expires_at: Date.now() + ((fresh.expires_in || 3600) * 1000),
    updated_at: new Date().toISOString()
  };
  await env.GOOGLE_TOKENS.put(TOKEN_KEY, JSON.stringify(merged));
  return merged.access_token;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const saved = await storedTokens(env).catch(() => null);
      return json({
        ok: true,
        app: 'Spin Cycle AI Marketing',
        runtime: 'cloudflare-worker',
        google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        token_storage_configured: Boolean(env.GOOGLE_TOKENS),
        google_connected: Boolean(saved && saved.refresh_token)
      });
    }

    if (url.pathname === '/api/google/status') {
      const saved = await storedTokens(env).catch(() => null);
      if (!saved?.refresh_token) return json({ ok: true, connected: false });
      try {
        await getAccessToken(env);
        return json({ ok: true, connected: true, updated_at: saved.updated_at || saved.connected_at || null });
      } catch (error) {
        return json({ ok: false, connected: false, error: error.message }, 502);
      }
    }

    if (url.pathname === '/oauth/start') {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_TOKENS) {
        return json({ ok: false, error: 'Google OAuth or token storage is not configured yet.' }, 503);
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
      if (!tokens.refresh_token) return json({ ok: false, error: 'Google did not return a refresh token. Reconnect and approve access again.' }, 400);

      const record = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope || SCOPES.join(' '),
        expires_at: Date.now() + ((tokens.expires_in || 3600) * 1000),
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await env.GOOGLE_TOKENS.put(TOKEN_KEY, JSON.stringify(record));

      return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Google Connected</title><style>body{font-family:system-ui;background:#f0f9ff;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0}.c{background:white;padding:28px;border-radius:20px;max-width:560px;box-shadow:0 15px 45px #0c4a6e22}h1{color:#0369a1}</style><div class="c"><h1>Google is connected</h1><p>Spin Cycle AI Marketing securely saved the authorization in Cloudflare KV and can refresh Google access automatically.</p><p>You can close this window and return to the app.</p></div>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'set-cookie': 'sc_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0', 'cache-control': 'no-store' } });
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ ok: false, error: 'Not found' }, 404);
  }
};
