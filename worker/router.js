import core from './index.js';
import { systemHealth } from './system-health.js';

const DASHBOARD_PATHS = new Set([
  '/',
  '/spin-cycle-ai-marketing',
  '/spin-cycle-ai-marketing/',
  '/spin-cycle-ai-marketing.html'
]);

const GROWTH_PATHS = new Set([
  '/owner',
  '/owner/',
  '/owner-hub',
  '/owner-hub/',
  '/growth-marketing',
  '/growth-marketing/'
]);

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return new Request(url.toString(), { method: 'GET', headers: request.headers });
}

function dashboardTabs() {
  return `<style id="spinCycleTabsStyle">.spinCycleTabs{max-width:1600px;margin:10px auto 0;padding:0 12px;display:flex;gap:8px;flex-wrap:wrap}.spinCycleTab{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:999px;border:1px solid #bfdbfe;background:#eff6ff;color:#075985;text-decoration:none;font-weight:900;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.spinCycleTab.active{background:#075985;color:#fff;border-color:#075985}@media(max-width:700px){.spinCycleTabs{padding:0 7px}.spinCycleTab{flex:1}}</style><nav class="spinCycleTabs" aria-label="Spin Cycle sections"><a class="spinCycleTab active" href="/">Dashboard</a><a class="spinCycleTab" href="/growth-marketing">Growth &amp; Marketing</a></nav>`;
}

async function serveDashboard(request, env) {
  const response = await env.ASSETS.fetch(assetRequest(request, '/index.html'));
  if (!response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  const injected = html.includes('</body>') ? html.replace('</body>', dashboardTabs() + '</body>') : dashboardTabs() + html;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');
  return new Response(injected, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/system-health') {
      return systemHealth(core, request, env, ctx);
    }

    if (DASHBOARD_PATHS.has(url.pathname)) {
      return serveDashboard(request, env);
    }

    if (GROWTH_PATHS.has(url.pathname)) {
      return env.ASSETS.fetch(assetRequest(request, '/owner-hub.html'));
    }

    return core.fetch(request, env, ctx);
  }
};
