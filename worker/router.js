import core from './index.js';

const DASHBOARD_PATHS = new Set([
  '/',
  '/spin-cycle-ai-marketing',
  '/spin-cycle-ai-marketing/',
  '/spin-cycle-ai-marketing.html'
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (DASHBOARD_PATHS.has(url.pathname)) {
      const dashboardUrl = new URL('/index.html', url.origin);
      const dashboardRequest = new Request(dashboardUrl.toString(), {
        method: 'GET',
        headers: request.headers
      });
      return env.ASSETS.fetch(dashboardRequest);
    }

    return core.fetch(request, env, ctx);
  }
};
