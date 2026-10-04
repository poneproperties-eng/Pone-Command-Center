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

function dashboardEnhancements() {
  return `<style id="spinCycleSimpleUiStyle">
  .spinCycleTabs{max-width:1600px;margin:10px auto 0;padding:0 12px;display:flex;gap:8px;flex-wrap:wrap;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
  .spinCycleTab{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:999px;border:1px solid #bfdbfe;background:#eff6ff;color:#075985;text-decoration:none;font-weight:900}
  .spinCycleTab.active{background:#075985;color:#fff;border-color:#075985}
  .simpleSelectWrap{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .simpleSelectLabel{font-size:12px;font-weight:900;color:#164e7a}
  .simpleSelect{min-width:180px;border:1px solid #93c5fd;border-radius:999px;padding:10px 38px 10px 14px;background:#fff;color:#075985;font-weight:900;cursor:pointer}
  .periods.simpleHidden,.viewToggle.simpleHidden{display:none!important}
  .connectionWatch{font-size:11px;color:#64748b;margin-left:6px}
  @media(max-width:700px){.spinCycleTabs{padding:0 7px}.spinCycleTab{flex:1}.simpleSelect{width:100%;min-width:0}}
  </style>
  <nav class="spinCycleTabs" aria-label="Spin Cycle sections"><a class="spinCycleTab active" href="/">Dashboard</a><a class="spinCycleTab" href="/growth-marketing">Growth &amp; Marketing</a></nav>
  <script id="spinCycleSimpleUiScript">
  (function(){
    function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
    function makeSelect(id,labelText,options,onChange){
      const wrap=document.createElement('div');wrap.className='simpleSelectWrap';
      const label=document.createElement('label');label.className='simpleSelectLabel';label.htmlFor=id;label.textContent=labelText;
      const select=document.createElement('select');select.id=id;select.className='simpleSelect';
      options.forEach(o=>{const op=document.createElement('option');op.value=o.value;op.textContent=o.label;select.appendChild(op)});
      select.addEventListener('change',()=>onChange(select.value));wrap.append(label,select);return {wrap,select};
    }
    function setupPeriodDropdown(){
      const periods=document.querySelector('.periods');if(!periods||document.getElementById('periodSelect'))return;
      const buttons=[...periods.querySelectorAll('.period[data-period]')];if(!buttons.length)return;
      const ui=makeSelect('periodSelect','View',[
        {value:'today',label:'Today'},
        {value:'last_7_days',label:'Last 7 Days'},
        {value:'last_30_days',label:'Last 30 Days'}
      ],value=>{const b=buttons.find(x=>x.dataset.period===value);if(b)b.click()});
      periods.classList.add('simpleHidden');periods.parentNode.insertBefore(ui.wrap,periods);
      ui.select.value='today';const today=buttons.find(x=>x.dataset.period==='today');if(today)today.click();
    }
    function setupCollectionsDropdown(){
      if(document.getElementById('collectionViewSelect'))return;
      const toggles=[...document.querySelectorAll('.viewToggle')];
      const group=toggles.find(t=>t.querySelector('[data-view="collections-summary"]'));if(!group)return;
      const buttons=[...group.querySelectorAll('button[data-view]')];
      const ui=makeSelect('collectionViewSelect','Collections View',[
        {value:'collections-summary',label:'Summary'},
        {value:'collections-graph',label:'Weekly'},
        {value:'collections-monthly',label:'Monthly'}
      ],value=>{const b=buttons.find(x=>x.dataset.view===value);if(b)b.click()});
      group.classList.add('simpleHidden');group.parentNode.insertBefore(ui.wrap,group);
      ui.select.value='collections-summary';const summary=buttons.find(x=>x.dataset.view==='collections-summary');if(summary)summary.click();
    }
    function sourceRow(name){return [...document.querySelectorAll('.source')].find(r=>(r.querySelector('.sourceMain b')?.textContent||'').trim()===name)}
    function paintSource(name,ok,detail,reconnect){
      const row=sourceRow(name);if(!row)return;const state=row.querySelector('.sourceState'),time=row.querySelector('.sourceTime');if(!state)return;
      if(ok){state.innerHTML='<div class="connStatus good">✓ &nbsp; CONNECTED</div>';if(time)time.innerHTML='Live check passed<br>'+new Date().toLocaleString();return}
      if(reconnect){state.innerHTML='<button class="connBtn" type="button">↻ &nbsp; RECONNECT GOOGLE</button>';const btn=state.querySelector('button');if(btn)btn.onclick=()=>window.location.assign('/oauth/start')}
      else state.innerHTML='<div class="connStatus watch">◷ &nbsp; RETRYING</div>';
      if(time)time.innerHTML=(detail||'Connection needs attention')+'<br>Auto-checking every minute';
    }
    async function connectionWatch(){
      try{
        const r=await fetch('/api/system-health',{cache:'no-store'}),d=await r.json(),c=d.checks||{};
        paintSource('Google Ads',!!c.google_ads?.ok,c.google_ads?.detail,!c.google?.ok);
        paintSource('Collections Database',!!c.collections?.ok,c.collections?.detail,false);
        const top=document.getElementById('connection');if(top){top.textContent=c.google_ads?.ok?'Google Ads Connected':(!c.google?.ok?'Google Needs Reconnect':'Google Ads Retrying')}
        if(typeof window.loadGoogleConnections==='function')window.loadGoogleConnections();
      }catch(e){paintSource('Google Ads',false,e.message,false);paintSource('Collections Database',false,e.message,false)}
    }
    ready(()=>{setupPeriodDropdown();setupCollectionsDropdown();connectionWatch();setInterval(connectionWatch,60000)});
  })();
  </script>`;
}

async function serveDashboard(request, env) {
  const response = await env.ASSETS.fetch(assetRequest(request, '/index.html'));
  if (!response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  const enhancement = dashboardEnhancements();
  const injected = html.includes('<body>') ? html.replace('<body>', '<body>' + enhancement) : enhancement + html;
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
