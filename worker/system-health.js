const COLLECTIONS_API = 'https://eajtunubzthudvqciesa.supabase.co/functions/v1/spin-cycle-data';

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text.slice(0, 300) }; }
}

async function checkCore(core, path, request, env, ctx) {
  try {
    const url = new URL(request.url);
    url.pathname = path;
    url.search = '';
    const response = await core.fetch(new Request(url.toString(), { method: 'GET', headers: { accept: 'application/json' } }), env, ctx);
    const data = await readJson(response);
    return { ok: response.ok && data?.ok !== false, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, error: error?.message || String(error) };
  }
}

async function checkCollections() {
  try {
    const response = await fetch(COLLECTIONS_API, { headers: { accept: 'application/json' } });
    const data = await readJson(response);
    const collections = Array.isArray(data?.collections) ? data.collections : [];
    return {
      ok: response.ok && data?.ok !== false,
      status: response.status,
      count: collections.length,
      monthly_goal: Number(data?.monthly_goal || 0),
      message: response.ok && data?.ok !== false ? 'Collections storage is responding.' : (data?.error || 'Collections storage returned an error.')
    };
  } catch (error) {
    return { ok: false, status: 0, count: 0, monthly_goal: 0, message: error?.message || String(error) };
  }
}

export async function systemHealth(core, request, env, ctx) {
  const [worker, google, dashboard, discover, collections] = await Promise.all([
    checkCore(core, '/api/health', request, env, ctx),
    checkCore(core, '/api/google/status', request, env, ctx),
    checkCore(core, '/api/dashboard', request, env, ctx),
    checkCore(core, '/api/google/discover', request, env, ctx),
    checkCollections()
  ]);

  const googleConnected = Boolean(google.ok && google.data?.connected);
  const adsWorking = Boolean(dashboard.ok && dashboard.data?.periods);
  const ownerStorage = Boolean(env.GOOGLE_TOKENS);
  const bp = discover.data?.business_profile || {};
  const bpAccounts = Array.isArray(bp.accounts) ? bp.accounts : [];
  const businessProfileWorking = Boolean(discover.ok && bp.ok && bpAccounts.length > 0);

  const checks = {
    worker: {
      ok: worker.ok,
      label: 'App server',
      detail: worker.ok ? 'Working' : (worker.error || worker.data?.error || 'Needs attention')
    },
    google: {
      ok: googleConnected,
      label: 'Google connection',
      detail: googleConnected ? 'Connected' : (google.data?.error || 'Reconnect Google')
    },
    google_ads: {
      ok: adsWorking,
      label: 'Google Ads data',
      detail: adsWorking ? 'Today / 7 Days / 30 Days data is responding' : (dashboard.data?.error || dashboard.error || 'Google Ads data needs attention')
    },
    business_profile: {
      ok: businessProfileWorking,
      label: 'Google Business Profile',
      detail: businessProfileWorking
        ? `Connected • ${bpAccounts.length} accessible account${bpAccounts.length === 1 ? '' : 's'}`
        : (bp.error || discover.data?.error || 'Reconnect Google and approve Business Profile access')
    },
    collections: {
      ok: collections.ok,
      label: 'Collections & revenue data',
      detail: collections.ok ? `Working • ${collections.count} saved entries` : collections.message
    },
    owner_storage: {
      ok: ownerStorage,
      label: 'Owner app storage',
      detail: ownerStorage ? 'Working' : 'Storage binding is missing'
    }
  };

  const allOk = Object.values(checks).every(item => item.ok);
  const needsGoogle = !checks.google.ok || !checks.google_ads.ok;
  const needsBusinessProfile = !checks.business_profile.ok;

  return new Response(JSON.stringify({
    ok: allOk,
    generated_at: new Date().toISOString(),
    overall: allOk ? 'working' : 'needs_attention',
    next_action: needsGoogle
      ? 'Reconnect Google first.'
      : (needsBusinessProfile
        ? 'Reconnect Google Business Profile and approve access.'
        : (!checks.collections.ok ? 'Check collections storage.' : 'Connections are healthy.')),
    reconnect_google_url: '/oauth/start',
    checks
  }, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
