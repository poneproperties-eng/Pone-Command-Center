const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly'
];
const TOKEN_KEY = 'spin-cycle-google-oauth';
const CUSTOMER_ID = '1515534333';
const API_VERSION = 'v25';
const TIMEZONE = 'America/New_York';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
  'access-control-max-age': '86400'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS } });
}
function redirectUri(url) { return `${url.protocol}//${url.host}/oauth/callback`; }
async function storedTokens(env) { return env.GOOGLE_TOKENS ? env.GOOGLE_TOKENS.get(TOKEN_KEY, { type: 'json' }) : null; }

async function getAccessToken(env) {
  const saved = await storedTokens(env);
  if (!saved) throw new Error('Google is not connected yet.');
  if (saved.access_token && saved.expires_at && Date.now() < saved.expires_at - 60000) return saved.access_token;
  if (!saved.refresh_token) throw new Error('No Google refresh token is stored. Reconnect Google.');
  const body = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: saved.refresh_token, grant_type: 'refresh_token' });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const fresh = await r.json();
  if (!r.ok) throw new Error(`Google refresh failed: ${fresh.error || r.status}`);
  const merged = { ...saved, ...fresh, refresh_token: saved.refresh_token, expires_at: Date.now() + ((fresh.expires_in || 3600) * 1000), updated_at: new Date().toISOString() };
  await env.GOOGLE_TOKENS.put(TOKEN_KEY, JSON.stringify(merged));
  return merged.access_token;
}

async function googleGet(env, endpoint) {
  const accessToken = await getAccessToken(env);
  const r = await fetch(endpoint, { headers: { authorization: `Bearer ${accessToken}` } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || data?.error_description || `${r.status} ${r.statusText}`);
  return data;
}

async function discoverGoogle(env) {
  const results = { analytics: { ok: false, accounts: [] }, search_console: { ok: false, sites: [] }, google_ads: { ok: false, customers: [] } };
  try {
    const ga = await googleGet(env, 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200');
    results.analytics = { ok: true, accounts: (ga.accountSummaries || []).map(a => ({ account: a.account, displayName: a.displayName, properties: (a.propertySummaries || []).map(p => ({ property: p.property, displayName: p.displayName, propertyType: p.propertyType })) })) };
  } catch (e) { results.analytics.error = e.message; }
  try {
    const sc = await googleGet(env, 'https://www.googleapis.com/webmasters/v3/sites');
    results.search_console = { ok: true, sites: (sc.siteEntry || []).map(s => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel })) };
  } catch (e) { results.search_console.error = e.message; }
  try {
    const accessToken = await getAccessToken(env);
    const r = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers:listAccessibleCustomers`, { headers: { authorization: `Bearer ${accessToken}` } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || `${r.status} ${r.statusText}`);
    results.google_ads = { ok: true, customers: data.resourceNames || [] };
  } catch (e) { results.google_ads = { ok: false, customers: [], error: e.message }; }
  return results;
}

function localToday() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = t => Number(p.find(x => x.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}
function dateBack(days) {
  const p = localToday();
  return new Date(Date.UTC(p.y, p.m - 1, p.d - days)).toISOString().slice(0, 10);
}
function blank() { return { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, cost_per_conversion: 0 }; }
function round(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
function typeOf(name = '') {
  const n = name.toLowerCase();
  if (n.includes('wash') || n.includes('fold') || n.includes('w&f') || n.includes('wdf')) return 'wash_and_fold';
  if (n.includes('self service') || n.includes('self-service') || n.includes('pmax')) return 'self_service';
  return 'other';
}
function finish(m) {
  m.spend = round(m.spend); m.impressions = Number(m.impressions || 0); m.clicks = Number(m.clicks || 0); m.conversions = round(m.conversions);
  m.ctr = m.impressions ? round(m.clicks / m.impressions * 100) : 0;
  m.cpc = m.clicks ? round(m.spend / m.clicks) : 0;
  m.cost_per_conversion = m.conversions ? round(m.spend / m.conversions) : 0;
  return m;
}

async function googleAdsRows(env, start, end) {
  const accessToken = await getAccessToken(env);
  const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${start}' AND '${end}' AND campaign.status != 'REMOVED'`;
  const r = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:searchStream`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { throw new Error(`Google Ads returned invalid JSON (HTTP ${r.status}).`); }
  if (!r.ok) throw new Error(`Google Ads API: ${data?.error?.message || data?.[0]?.error?.message || `${r.status} ${r.statusText}`}`);
  return (Array.isArray(data) ? data : [data]).flatMap(x => x?.results || []);
}

async function buildPeriod(env, start, end) {
  const rows = await googleAdsRows(env, start, end);
  const out = { start_date: start, end_date: end, all_campaigns: blank(), self_service: blank(), wash_and_fold: blank(), other: blank(), campaigns: {} };
  for (const row of rows) {
    const c = row.campaign || {}, m = row.metrics || {}, name = c.name || `Campaign ${c.id || ''}`.trim(), type = typeOf(name);
    const vals = { spend: Number(m.costMicros || m.cost_micros || 0) / 1e6, impressions: Number(m.impressions || 0), clicks: Number(m.clicks || 0), conversions: Number(m.conversions || 0) };
    if (!out.campaigns[name]) out.campaigns[name] = { id: String(c.id || ''), status: c.status || 'UNKNOWN', type, metrics: blank() };
    for (const target of [out.all_campaigns, out[type], out.campaigns[name].metrics]) for (const k of Object.keys(vals)) target[k] += vals[k];
  }
  finish(out.all_campaigns); finish(out.self_service); finish(out.wash_and_fold); finish(out.other);
  for (const c of Object.values(out.campaigns)) finish(c.metrics);
  return out;
}

async function googleAdsReport(env) {
  const today = dateBack(0);
  const [a, b, c] = await Promise.all([buildPeriod(env, today, today), buildPeriod(env, dateBack(6), today), buildPeriod(env, dateBack(29), today)]);
  return { ok: true, app: 'Spin Cycle AI Marketing', source: 'Google Ads', customer_id: CUSTOMER_ID, timezone: TIMEZONE, generated_at: new Date().toISOString(), periods: { today: a, last_7_days: b, last_30_days: c } };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/api/health') {
      const saved = await storedTokens(env).catch(() => null);
      return json({ ok: true, app: 'Spin Cycle AI Marketing', runtime: 'cloudflare-worker', google_oauth_configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), token_storage_configured: Boolean(env.GOOGLE_TOKENS), google_connected: Boolean(saved?.refresh_token) });
    }
    if (url.pathname === '/api/google/status') {
      const saved = await storedTokens(env).catch(() => null);
      if (!saved?.refresh_token) return json({ ok: true, connected: false });
      try { await getAccessToken(env); return json({ ok: true, connected: true, updated_at: saved.updated_at || saved.connected_at || null }); }
      catch (e) { return json({ ok: false, connected: false, error: e.message }, 502); }
    }
    if (url.pathname === '/api/google/discover') {
      try { return json({ ok: true, ...(await discoverGoogle(env)) }); } catch (e) { return json({ ok: false, error: e.message }, 502); }
    }
    if (url.pathname === '/api/dashboard' || url.pathname === '/api/google-ads/report') {
      try { return json(await googleAdsReport(env)); } catch (e) { return json({ ok: false, error: e.message }, 502); }
    }
    if (url.pathname === '/oauth/start') {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_TOKENS) return json({ ok: false, error: 'Google OAuth or token storage is not configured yet.' }, 503);
      const state = crypto.randomUUID().replaceAll('-', '');
      const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri(url), response_type: 'code', scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state });
      return new Response(null, { status: 302, headers: { location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, 'set-cookie': `sc_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`, 'cache-control': 'no-store' } });
    }
    if (url.pathname === '/oauth/callback') {
      const code = url.searchParams.get('code'), state = url.searchParams.get('state'), cookie = request.headers.get('cookie') || '', savedState = cookie.match(/(?:^|;\s*)sc_oauth_state=([^;]+)/)?.[1];
      if (!code || !state || !savedState || state !== savedState) return json({ ok: false, error: 'OAuth state validation failed.' }, 400);
      const body = new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri(url), grant_type: 'authorization_code' });
      const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
      const tokens = await r.json();
      if (!r.ok) return json({ ok: false, error: 'Google token exchange failed.', details: tokens }, 502);
      if (!tokens.refresh_token) return json({ ok: false, error: 'Google did not return a refresh token. Reconnect and approve access again.' }, 400);
      const record = { access_token: tokens.access_token, refresh_token: tokens.refresh_token, token_type: tokens.token_type || 'Bearer', scope: tokens.scope || SCOPES.join(' '), expires_at: Date.now() + ((tokens.expires_in || 3600) * 1000), connected_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await env.GOOGLE_TOKENS.put(TOKEN_KEY, JSON.stringify(record));
      return new Response('<!doctype html><meta charset="utf-8"><title>Google Connected</title><h1>Google is connected</h1><p>Spin Cycle AI Marketing authorization is saved.</p>', { headers: { 'content-type': 'text/html; charset=utf-8', 'set-cookie': 'sc_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0', 'cache-control': 'no-store' } });
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ ok: false, error: 'Not found' }, 404);
  }
};