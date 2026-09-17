// Spin Cycle AI Marketing — Cloudflare Pages Function
// Secure server-side foundation for Google Ads, GA4 and Search Console.
// Secrets belong in Cloudflare environment variables, never in GitHub.

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

export async function onRequestGet({ env }) {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const optional = ['GOOGLE_REFRESH_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID', 'GA4_PROPERTY_ID', 'SEARCH_CONSOLE_SITE_URL'];
  const missingRequired = required.filter(k => !env[k]);
  const configured = Object.fromEntries(optional.map(k => [k, Boolean(env[k])]));

  return json({
    ok: missingRequired.length === 0,
    service: 'Spin Cycle AI Marketing Google Backend',
    mode: 'read-only-first',
    requiredConfigured: missingRequired.length === 0,
    missingRequired,
    configured,
    security: 'Google secrets are server-side only. No credentials are returned by this endpoint.'
  }, missingRequired.length ? 503 : 200);
}
