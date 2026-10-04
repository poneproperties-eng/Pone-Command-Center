import core from './index.js';
import { systemHealth } from './system-health.js';

const DASHBOARD_PATHS = new Set([
  '/',
  '/spin-cycle-ai-marketing',
  '/spin-cycle-ai-marketing/',
  '/spin-cycle-ai-marketing.html'
]);

const OWNER_HUB_PATHS = new Set([
  '/owner',
  '/owner/',
  '/owner-hub',
  '/owner-hub/'
]);

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return new Request(url.toString(), { method: 'GET', headers: request.headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/system-health') {
      return systemHealth(core, request, env, ctx);
    }

    if (DASHBOARD_PATHS.has(url.pathname)) {
      return env.ASSETS.fetch(assetRequest(request, '/index.html'));
    }

    if (OWNER_HUB_PATHS.has(url.pathname)) {
      return env.ASSETS.fetch(assetRequest(request, '/owner-hub.html'));
    }

    return core.fetch(request, env, ctx);
  }
};
