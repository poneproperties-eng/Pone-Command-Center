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
      const target = new URL('/index.html', url.origin);
      target.searchParams.set('v', '20261004-restore');
      return Response.redirect(target.toString(), 302);
    }

    return core.fetch(request, env, ctx);
  }
};
