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

const CAMPAIGN_PATHS = new Set([
  '/campaign-studio',
  '/campaign-studio/',
  '/campaign-studio.html'
]);

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return new Request(url.toString(), { method: 'GET', headers: request.headers });
}

function tabCss() {
  return `.spinCycleTabs{max-width:1600px;margin:10px auto 0;padding:0 12px;display:flex;gap:8px;flex-wrap:wrap;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.spinCycleTab{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:999px;border:1px solid #bfdbfe;background:#eff6ff;color:#075985;text-decoration:none;font-weight:900}.spinCycleTab.active{background:#075985;color:#fff;border-color:#075985}@media(max-width:700px){.spinCycleTabs{padding:0 7px}.spinCycleTab{flex:1}}`;
}

function tabs(active) {
  return `<style id="spinCycleTabsStyle">${tabCss()}</style><nav class="spinCycleTabs" aria-label="Spin Cycle sections"><a class="spinCycleTab ${active==='dashboard'?'active':''}" href="/">Dashboard</a><a class="spinCycleTab ${active==='growth'?'active':''}" href="/growth-marketing">Growth &amp; Marketing</a></nav>`;
}

function dashboardEnhancements() {
  return `${tabs('dashboard')}<style id="spinCycleSimpleUiStyle">
  .simpleSelectWrap{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .simpleSelectLabel{font-size:12px;font-weight:900;color:#164e7a}
  .simpleSelect{min-width:180px;border:1px solid #93c5fd;border-radius:999px;padding:10px 38px 10px 14px;background:#fff;color:#075985;font-weight:900;cursor:pointer}
  .periods.simpleHidden,.viewToggle.simpleHidden{display:none!important}
  @media(max-width:700px){.simpleSelect{width:100%;min-width:0}}
  </style>
  <script id="spinCycleSimpleUiScript">
  (function(){
    function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
    function makeSelect(id,labelText,options,onChange){const wrap=document.createElement('div');wrap.className='simpleSelectWrap';const label=document.createElement('label');label.className='simpleSelectLabel';label.htmlFor=id;label.textContent=labelText;const select=document.createElement('select');select.id=id;select.className='simpleSelect';options.forEach(o=>{const op=document.createElement('option');op.value=o.value;op.textContent=o.label;select.appendChild(op)});select.addEventListener('change',()=>onChange(select.value));wrap.append(label,select);return {wrap,select}}
    function setupPeriodDropdown(){const periods=document.querySelector('.periods');if(!periods||document.getElementById('periodSelect'))return;const buttons=[...periods.querySelectorAll('.period[data-period]')];if(!buttons.length)return;const ui=makeSelect('periodSelect','View',[{value:'today',label:'Today'},{value:'last_7_days',label:'Last 7 Days'},{value:'last_30_days',label:'Last 30 Days'}],value=>{const b=buttons.find(x=>x.dataset.period===value);if(b)b.click()});periods.classList.add('simpleHidden');periods.parentNode.insertBefore(ui.wrap,periods);ui.select.value='today';const today=buttons.find(x=>x.dataset.period==='today');if(today)today.click()}
    function setupCollectionsDropdown(){if(document.getElementById('collectionViewSelect'))return;const toggles=[...document.querySelectorAll('.viewToggle')];const group=toggles.find(t=>t.querySelector('[data-view="collections-summary"]'));if(!group)return;const buttons=[...group.querySelectorAll('button[data-view]')];const ui=makeSelect('collectionViewSelect','Collections View',[{value:'collections-summary',label:'Summary'},{value:'collections-graph',label:'Weekly'},{value:'collections-monthly',label:'Monthly'}],value=>{const b=buttons.find(x=>x.dataset.view===value);if(b)b.click()});group.classList.add('simpleHidden');group.parentNode.insertBefore(ui.wrap,group);ui.select.value='collections-summary';const summary=buttons.find(x=>x.dataset.view==='collections-summary');if(summary)summary.click()}
    function sourceRow(name){return [...document.querySelectorAll('.source')].find(r=>(r.querySelector('.sourceMain b')?.textContent||'').trim()===name)}
    function paintSource(name,ok,detail,reconnect){const row=sourceRow(name);if(!row)return;const state=row.querySelector('.sourceState'),time=row.querySelector('.sourceTime');if(!state)return;if(ok){state.innerHTML='<div class="connStatus good">✓ &nbsp; CONNECTED</div>';if(time)time.innerHTML='Live check passed<br>'+new Date().toLocaleString();return}if(reconnect){state.innerHTML='<button class="connBtn" type="button">↻ &nbsp; RECONNECT GOOGLE</button>';const btn=state.querySelector('button');if(btn)btn.onclick=()=>window.location.assign('/oauth/start')}else state.innerHTML='<div class="connStatus watch">◷ &nbsp; RETRYING</div>';if(time)time.innerHTML=(detail||'Connection needs attention')+'<br>Auto-checking every minute'}
    async function connectionWatch(){try{const r=await fetch('/api/system-health',{cache:'no-store'}),d=await r.json(),c=d.checks||{};paintSource('Google Ads',!!c.google_ads?.ok,c.google_ads?.detail,!c.google?.ok);paintSource('Collections Database',!!c.collections?.ok,c.collections?.detail,false);const top=document.getElementById('connection');if(top)top.textContent=c.google_ads?.ok?'Google Ads Connected':(!c.google?.ok?'Google Needs Reconnect':'Google Ads Retrying');if(typeof window.loadGoogleConnections==='function')window.loadGoogleConnections()}catch(e){paintSource('Google Ads',false,e.message,false);paintSource('Collections Database',false,e.message,false)}}
    ready(()=>{setupPeriodDropdown();setupCollectionsDropdown();connectionWatch();setInterval(connectionWatch,60000)});
  })();
  </script>`;
}

function growthEnhancements() {
  return `${tabs('growth')}<script id="growthAutoHealth">(function(){function start(){const btn=document.getElementById('refresh');if(btn)setInterval(()=>btn.click(),60000)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()})();</script>`;
}

function campaignEnhancements() {
  return `${tabs('growth')}<style id="campaignGuideStyle">
  .approvalGuide{margin-top:14px;border:2px solid #bfdbfe;border-radius:16px;padding:14px;background:#f8fbff}.approvalGuide h3{margin:0 0 8px}.approvalSteps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.approvalStep{border:1px solid #dbeafe;border-radius:12px;background:#fff;padding:10px;font-size:12px;font-weight:800;color:#475569}.approvalStep strong{display:block;color:#075985;font-size:13px;margin-bottom:3px}.approvalActions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}.approvalActions button,.approvalActions a{border:0;border-radius:11px;padding:11px 14px;font-weight:900;text-decoration:none;cursor:pointer}.approvalBack{background:#e2e8f0;color:#334155}.approvalApprove{background:#16a34a;color:#fff}.approvalAdvertise{background:#075985;color:#fff}.approvalConnect{background:#fef3c7;color:#92400e}.platformAction{border:0;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:950;cursor:pointer}.platformAction.google{background:#dcfce7;color:#166534}.platformAction.meta{background:#fef3c7;color:#92400e}.approvedBanner{background:#dcfce7;color:#166534;border-radius:12px;padding:11px 13px;font-weight:900;margin-top:12px}@media(max-width:720px){.approvalSteps{grid-template-columns:1fr 1fr}.approvalActions>*{flex:1;text-align:center}}
  </style>
  <script id="campaignGuideScript">
  (function(){
    const APPROVED='spin-cycle-approved-campaign-v1';
    function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
    function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
    function getPkg(){try{return packageData||null}catch{return null}}
    function closeModal(){const m=document.getElementById('modal');if(m)m.classList.remove('show')}
    function approve(){const p=getPkg();if(!p)return;localStorage.setItem(APPROVED,JSON.stringify({approved_at:new Date().toISOString(),campaign:p}));render('approved')}
    function facebookHelp(){alert('Facebook still needs its one-time Page authorization. The campaign is safe and approved; Facebook posting will become available after the Page connection is completed.');}
    function render(mode){
      const p=getPkg();if(!p)return;
      const body=document.getElementById('modalBody'),modal=document.getElementById('modal');if(!body||!modal)return;
      const approved=mode==='approved'||!!localStorage.getItem(APPROVED);
      const total=Number(p.dailyBudget||0)*Number(p.duration||0);
      const channels=[];
      if(p.channels?.meta)channels.push(['Facebook + Instagram Ads','One-time Facebook Page authorization required','meta']);
      if(p.channels?.google)channels.push(['Google Ads + YouTube','Google reporting is connected; verify publishing access before launch','google']);
      if(p.channels?.orgMeta)channels.push(['Facebook + Instagram Organic','One-time Facebook Page authorization required','meta']);
      if(p.channels?.orgTikTok)channels.push(['TikTok Organic','TikTok publishing connection is not wired yet','meta']);
      if(p.channels?.orgYouTube)channels.push(['YouTube Shorts','YouTube publishing connection is not wired yet','meta']);
      if(p.channels?.orgGBP)channels.push(['Google Business Profile','Verify or reconnect Google Business Profile access','google']);
      body.innerHTML=`<div class="card" style="margin-top:14px"><b>${esc(p.hook)}</b><div class="small" style="margin-top:5px">Offer: ${esc(p.offer)} • Maximum paid budget: $${Number(p.dailyBudget||0).toFixed(2)}/day × ${Number(p.duration||0)} days = $${total.toFixed(2)}</div></div>
      <div class="approvalGuide"><h3>What do I do now?</h3><div class="small">Follow these four steps. You can approve the campaign even before every channel is connected.</div><div class="approvalSteps"><div class="approvalStep"><strong>1. Review</strong>Make sure the offer, message and budget look right.</div><div class="approvalStep"><strong>2. Approve</strong>Approve this campaign package.</div><div class="approvalStep"><strong>3. Connect</strong>Connect only the channels you want to use.</div><div class="approvalStep"><strong>4. Advertise</strong>Launch only after you confirm.</div></div>${approved?'<div class="approvedBanner">✓ CAMPAIGN APPROVED — next, connect the channels you want and continue to Advertise.</div>':''}</div>
      <div class="platformList">${channels.map(x=>`<div class="platformRow"><div><b>${esc(x[0])}</b><div class="small">${esc(x[1])}</div></div>${x[2]==='google'?'<button class="platformAction google" data-google>VERIFY / RECONNECT</button>':'<button class="platformAction meta" data-meta>CONNECT</button>'}</div>`).join('')}</div>
      <div class="approvalActions"><button class="approvalBack" id="guideBack">← Back to Campaign</button>${approved?'':'<button class="approvalApprove" id="guideApprove">✓ Approve This Campaign</button>'}<a class="approvalConnect" href="/growth-marketing">Connections</a>${approved?'<button class="approvalAdvertise" id="guideAdvertise">Continue to Advertise →</button>':''}</div>
      <div class="notice ${approved?'good':'warn'}">${approved?'Your campaign is approved, but nothing has been published yet. You remain in control of the final launch.':'Nothing has been published. Review and approve first.'}</div>`;
      body.querySelectorAll('[data-google]').forEach(b=>b.onclick=()=>window.location.assign('/oauth/start'));
      body.querySelectorAll('[data-meta]').forEach(b=>b.onclick=facebookHelp);
      document.getElementById('guideBack').onclick=closeModal;
      const a=document.getElementById('guideApprove');if(a)a.onclick=approve;
      const ad=document.getElementById('guideAdvertise');if(ad)ad.onclick=()=>render('advertise');
      modal.classList.add('show');
    }
    ready(()=>{
      const preview=document.getElementById('preview'),advertise=document.getElementById('advertise');
      if(preview)preview.onclick=()=>render('preview');
      if(advertise)advertise.onclick=()=>render(localStorage.getItem(APPROVED)?'approved':'preview');
    });
  })();
  </script>`;
}

async function transformHtml(response, enhancement) {
  if (!response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  const injected = html.includes('<body>') ? html.replace('<body>', '<body>' + enhancement) : enhancement + html;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');
  return new Response(injected, { status: response.status, statusText: response.statusText, headers });
}

async function serveDashboard(request, env) {
  return transformHtml(await env.ASSETS.fetch(assetRequest(request, '/index.html')), dashboardEnhancements());
}

async function serveGrowth(request, env) {
  return transformHtml(await env.ASSETS.fetch(assetRequest(request, '/owner-hub.html')), growthEnhancements());
}

async function serveCampaign(request, env) {
  return transformHtml(await env.ASSETS.fetch(assetRequest(request, '/campaign-studio.html')), campaignEnhancements());
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
      return serveGrowth(request, env);
    }

    if (CAMPAIGN_PATHS.has(url.pathname)) {
      return serveCampaign(request, env);
    }

    return core.fetch(request, env, ctx);
  }
};
