const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly'
];

const TOKEN_KEY = 'spin-cycle-google-oauth';
const GOOGLE_ADS_CUSTOMER_ID = '1515534333';
const GOOGLE_ADS_API_VERSION = 'v25';
const TIMEZONE = 'America/New_York';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
  'access-control-max-age': '86400'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...CORS
    }
  });
}

function redirectUri(url) { return `${url.protocol}//${url.host}/oauth/callback`; }
function randomState() { return crypto.randomUUID().replaceAll('-', ''); }

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

async function googleGet(env, endpoint) {
  const accessToken = await getAccessToken(env);
  const response = await fetch(endpoint, { headers: { authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || data?.error_description || `${response.status} ${response.statusText}`);
  return data;
}

async function discoverGoogle(env) {
  const results = {
    analytics: { ok: false, accounts: [] },
    search_console: { ok: false, sites: [] },
    google_ads: { ok: false, needs_developer_token: !env.GOOGLE_ADS_DEVELOPER_TOKEN }
  };

  try {
    const ga = await googleGet(env, 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200');
    results.analytics = {
      ok: true,
      accounts: (ga.accountSummaries || []).map(a => ({
        account: a.account,
        displayName: a.displayName,
        properties: (a.propertySummaries || []).map(p => ({
          property: p.property,
          displayName: p.displayName,
          propertyType: p.propertyType
        }))
      }))
    };
  } catch (error) { results.analytics.error = error.message; }

  try {
    const sc = await googleGet(env, 'https://www.googleapis.com/webmasters/v3/sites');
    results.search_console = {
      ok: true,
      sites: (sc.siteEntry || []).map(s => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }))
    };
  } catch (error) { results.search_console.error = error.message; }

  if (env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    try {
      const accessToken = await getAccessToken(env);
      const response = await fetch(`https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
          'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message || `${response.status} ${response.statusText}`);
      results.google_ads = { ok: true, needs_developer_token: false, customers: data.resourceNames || [] };
    } catch (error) {
      results.google_ads = { ok: false, needs_developer_token: false, error: error.message };
    }
  }
  return results;
}

function localDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const get = type => Number(parts.find(p => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function dateStringFromOffset(daysBack) {
  const p = localDateParts();
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day - daysBack));
  return d.toISOString().slice(0, 10);
}

function blankMetrics() {
  return { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, cost_per_conversion: 0 };
}

function round(n, digits = 2) {
  const m = 10 ** digits;
  return Math.round((Number(n) + Number.EPSILON) * m) / m;
}

function classifyCampaign(name = '') {
  const n = name.toLowerCase();
  if (n.includes('wash') || n.includes('fold') || n.includes('w&f') || n.includes('wdf')) return 'wash_and_fold';
  if (n.includes('self service') || n.includes('self-service') || n.includes('pmax')) return 'self_service';
  return 'other';
}

function finalizeMetrics(m) {
  m.spend = round(m.spend);
  m.impressions = Number(m.impressions || 0);
  m.clicks = Number(m.clicks || 0);
  m.conversions = round(m.conversions);
  m.ctr = m.impressions ? round((m.clicks / m.impressions) * 100) : 0;
  m.cpc = m.clicks ? round(m.spend / m.clicks) : 0;
  m.cost_per_conversion = m.conversions ? round(m.spend / m.conversions) : 0;
  return m;
}

async function googleAdsRows(env, startDate, endDate) {
  if (!env.GOOGLE_ADS_DEVELOPER_TOKEN) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured.');
  const accessToken = await getAccessToken(env);
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.status != 'REMOVED'
  `;

  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${GOOGLE_ADS_CUSTOMER_ID}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ query })
    }
  );

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { throw new Error(`Google Ads returned invalid JSON (HTTP ${response.status}).`); }

  if (!response.ok) {
    const msg = data?.error?.message || data?.[0]?.error?.message || `${response.status} ${response.statusText}`;
    throw new Error(`Google Ads API: ${msg}`);
  }

  const chunks = Array.isArray(data) ? data : [data];
  return chunks.flatMap(chunk => chunk?.results || []);
}

async function buildPeriod(env, startDate, endDate) {
  const rows = await googleAdsRows(env, startDate, endDate);
  const period = {
    start_date: startDate,
    end_date: endDate,
    all_campaigns: blankMetrics(),
    self_service: blankMetrics(),
    wash_and_fold: blankMetrics(),
    other: blankMetrics(),
    campaigns: {}
  };

  for (const row of rows) {
    const campaign = row.campaign || {};
    const metrics = row.metrics || {};
    const name = campaign.name || `Campaign ${campaign.id || ''}`.trim();
    const type = classifyCampaign(name);
    const spend = Number(metrics.costMicros || metrics.cost_micros || 0) / 1e6;
    const impressions = Number(metrics.impressions || 0);
    const clicks = Number(metrics.clicks || 0);
    const conversions = Number(metrics.conversions || 0);

    if (!period.campaigns[name]) {
      period.campaigns[name] = {
        id: String(campaign.id || ''),
        status: campaign.status || 'UNKNOWN',
        type,
        metrics: blankMetrics()
      };
    }

    for (const target of [period.all_campaigns, period[type], period.campaigns[name].metrics]) {
      target.spend += spend;
      target.impressions += impressions;
      target.clicks += clicks;
      target.conversions += conversions;
    }
  }

  finalizeMetrics(period.all_campaigns);
  finalizeMetrics(period.self_service);
  finalizeMetrics(period.wash_and_fold);
  finalizeMetrics(period.other);
  for (const c of Object.values(period.campaigns)) finalizeMetrics(c.metrics);
  return period;
}

async function googleAdsReport(env) {
  const today = dateStringFromOffset(0);
  const sevenStart = dateStringFromOffset(6);
  const thirtyStart = dateStringFromOffset(29);

  const [todayPeriod, sevenPeriod, thirtyPeriod] = await Promise.all([
    buildPeriod(env, today, today),
    buildPeriod(env, sevenStart, today),
    buildPeriod(env, thirtyStart, today)
  ]);

  return {
    ok: true,
    app: 'Spin Cycle AI Marketing',
    source: 'Google Ads',
    customer_id: GOOGLE_ADS_CUSTOMER_ID,
    timezone: TIMEZONE,
    generated_at: new Date().toISOString(),
    periods: {
      today: todayPeriod,
      last_7_days: sevenPeriod,
      last_30_days: thirtyPeriod
    }
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/api/health') {
      const saved = await storedTokens(env).catch(() => null);
      return json({
        ok: true,
        app: 'Spin Cycle AI Marketing',
        runtime: 'cloudflare-worker',
        google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        token_storage_configured: Boolean(env.GOOGLE_TOKENS),
        google_connected: Boolean(saved && saved.refresh_token),
        google_ads_developer_token_configured: Boolean(env.GOOGLE_ADS_DEVELOPER_TOKEN)
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

    if (url.pathname === '/api/google/discover') {
      try { return json({ ok: true, ...(await discoverGoogle(env)) }); }
      catch (error) { return json({ ok: false, error: error.message }, 502); }
    }

    if (url.pathname === '/api/dashboard' || url.pathname === '/api/google-ads/report') {
      try { return json(await googleAdsReport(env)); }
      catch (error) { return json({ ok: false, error: error.message }, 502); }
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
      return new Response(null, {
        status: 302,
        headers: {
          location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
          'set-cookie': `sc_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
          'cache-control': 'no-store'
        }
      });
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

      return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Google Connected</title><style>body{font-family:system-ui;background:#f0f9ff;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0}.c{background:white;padding:28px;border-radius:20px;max-width:560px;box-shadow:0 15px 45px #0c4a6e22}h1{color:#0369a1}</style><div class="c"><h1>Google is connected</h1><p>Spin Cycle AI Marketing securely saved the authorization in Cloudflare KV and can refresh Google access automatically.</p></div>`, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'set-cookie': 'sc_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
          'cache-control': 'no-store'
        }
      });
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ ok: false, error: 'Not found' }, 404);
  }
};