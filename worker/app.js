import router from './router.js';

const DASHBOARD_PATHS = new Set([
  '/',
  '/spin-cycle-ai-marketing',
  '/spin-cycle-ai-marketing/',
  '/spin-cycle-ai-marketing.html'
]);

const OLD_READY = "ready(()=>{setupPeriodDropdown();setupCollectionsDropdown();connectionWatch();nextBestAction();setInterval(()=>{connectionWatch();nextBestAction()},60000)});";
const SAFE_READY = "ready(()=>{setupPeriodDropdown();setupCollectionsDropdown();connectionWatch();setInterval(connectionWatch,60000)});";

async function patchDashboard(response){
  if(!response.ok)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;

  let html=await response.text();
  html=html.replace(OLD_READY,SAFE_READY);

  const loader='<script src="/dashboard-decision.js?v=2" defer></script>';
  if(!html.includes('/dashboard-decision.js')){
    html=html.includes('</body>')?html.replace('</body>',loader+'</body>'):html+loader;
  }

  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const response=await router.fetch(request,env,ctx);
    if(DASHBOARD_PATHS.has(url.pathname))return patchDashboard(response);
    return response;
  }
};
