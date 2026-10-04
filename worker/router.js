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
  return `${tabs('dashboard')}
  <style id="spinCycleSimpleUiStyle">
  .simpleSelectWrap{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.simpleSelectLabel{font-size:12px;font-weight:900;color:#164e7a}.simpleSelect{min-width:180px;border:1px solid #93c5fd;border-radius:999px;padding:10px 38px 10px 14px;background:#fff;color:#075985;font-weight:900;cursor:pointer}.periods.simpleHidden,.viewToggle.simpleHidden{display:none!important}
  .ownerDecisionWrap{max-width:1600px;margin:10px auto 14px;padding:0 12px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.ownerDecision{background:linear-gradient(135deg,#082f49,#075985);color:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 30px #0c4a6e22}.decisionTop{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}.decisionEyebrow{font-size:12px;font-weight:950;letter-spacing:.08em;color:#bae6fd}.decisionTitle{font-size:28px;font-weight:950;line-height:1.05;margin-top:5px}.decisionReason{margin-top:8px;color:#e0f2fe;max-width:900px;line-height:1.45}.decisionMetrics{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.decisionMetric{background:#ffffff18;border:1px solid #ffffff25;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:850}.decisionBtn{display:inline-flex;align-items:center;justify-content:center;background:#fff;color:#075985;text-decoration:none;border-radius:12px;padding:12px 15px;font-weight:950;white-space:nowrap}.decisionReminder{margin-top:12px;border-radius:12px;padding:10px 12px;background:#ffffff12;color:#e0f2fe;font-size:13px}.compDash{background:#fff;border:1px solid #bfdbfe;border-radius:16px;padding:15px;margin-top:12px;color:#0f172a}.compDashHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap}.compDashHead h2{margin:0;font-size:21px}.compDashHead p{margin:4px 0 0;color:#64748b;font-size:13px}.compDashGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.compDashCard{border:1px solid #dbeafe;background:#f8fbff;border-radius:13px;padding:12px}.compDashCard b{display:block;color:#0f3f66;margin-bottom:4px}.compDashCard p{margin:0 0 9px;color:#64748b;font-size:12px;line-height:1.4}.compDashActions{display:flex;gap:6px}.compMini{flex:1;text-align:center;text-decoration:none;border-radius:9px;padding:8px;background:#e0f2fe;color:#075985;font-size:11px;font-weight:950}.compMini.action{background:#16a34a;color:#fff}.decisionLoading{opacity:.8}
  @media(max-width:800px){.compDashGrid{grid-template-columns:1fr}.decisionTitle{font-size:23px}.decisionBtn{width:100%}}@media(max-width:700px){.simpleSelect{width:100%;min-width:0}.ownerDecisionWrap{padding:0 7px}}
  </style>
  <div class="ownerDecisionWrap" id="ownerDecisionWrap">
    <section class="ownerDecision">
      <div class="decisionTop"><div><div class="decisionEyebrow">NEXT BEST ACTION</div><div class="decisionTitle decisionLoading" id="decisionTitle">Checking your numbers…</div><div class="decisionReason" id="decisionReason">Looking at your current Google Ads activity before recommending anything.</div></div><a class="decisionBtn" id="decisionBtn" href="/growth-marketing">OPEN ACTION PAGE →</a></div>
      <div class="decisionMetrics" id="decisionMetrics"></div><div class="decisionReminder" id="decisionReminder">The goal is not to keep changing ads. If a campaign is actively gathering data, the better move may be to wait.</div>
    </section>
    <section class="compDash"><div class="compDashHead"><div><h2>Competitor Watch</h2><p>Use competitors as intelligence. See what works, then make Spin Cycle better.</p></div><a class="compMini" style="flex:0 0 auto;padding:9px 12px" href="/competitor-watch.html">FULL COMPETITOR INTELLIGENCE</a></div><div class="compDashGrid">
      <div class="compDashCard"><b>Splash Laundry</b><p>Watch local trust, turnaround promises, reviews and service positioning.</p><div class="compDashActions"><a class="compMini" href="https://www.splashlaundry.com/services" target="_blank" rel="noopener">OPEN SITE</a><a class="compMini action" href="/competitor-watch.html">TAKE ACTION</a></div></div>
      <div class="compDashCard"><b>HappyNest</b><p>Watch recurring pickup, preferences, convenience messaging and customer communication.</p><div class="compDashActions"><a class="compMini" href="https://www.happynest.com/laundry-service" target="_blank" rel="noopener">OPEN SITE</a><a class="compMini action" href="/competitor-watch.html">TAKE ACTION</a></div></div>
      <div class="compDashCard"><b>Laundromax</b><p>Watch pickup/delivery positioning, order tracking, customization and ordering simplicity.</p><div class="compDashActions"><a class="compMini" href="https://laundromax.com/delivery/" target="_blank" rel="noopener">OPEN SITE</a><a class="compMini action" href="/competitor-watch.html">TAKE ACTION</a></div></div>
    </div></section>
  </div>
  <script id="spinCycleSimpleUiScript">
  (function(){
    function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
    function makeSelect(id,labelText,options,onChange){const wrap=document.createElement('div');wrap.className='simpleSelectWrap';const label=document.createElement('label');label.className='simpleSelectLabel';label.htmlFor=id;label.textContent=labelText;const select=document.createElement('select');select.id=id;select.className='simpleSelect';options.forEach(o=>{const op=document.createElement('option');op.value=o.value;op.textContent=o.label;select.appendChild(op)});select.addEventListener('change',()=>onChange(select.value));wrap.append(label,select);return {wrap,select}}
    function setupPeriodDropdown(){const periods=document.querySelector('.periods');if(!periods||document.getElementById('periodSelect'))return;const buttons=[...periods.querySelectorAll('.period[data-period]')];if(!buttons.length)return;const ui=makeSelect('periodSelect','View',[{value:'today',label:'Today'},{value:'last_7_days',label:'Last 7 Days'},{value:'last_30_days',label:'Last 30 Days'}],value=>{const b=buttons.find(x=>x.dataset.period===value);if(b)b.click()});periods.classList.add('simpleHidden');periods.parentNode.insertBefore(ui.wrap,periods);ui.select.value='today';const today=buttons.find(x=>x.dataset.period==='today');if(today)today.click()}
    function setupCollectionsDropdown(){if(document.getElementById('collectionViewSelect'))return;const toggles=[...document.querySelectorAll('.viewToggle')];const group=toggles.find(t=>t.querySelector('[data-view="collections-summary"]'));if(!group)return;const buttons=[...group.querySelectorAll('button[data-view]')];const ui=makeSelect('collectionViewSelect','Collections View',[{value:'collections-summary',label:'Summary'},{value:'collections-graph',label:'Weekly'},{value:'collections-monthly',label:'Monthly'}],value=>{const b=buttons.find(x=>x.dataset.view===value);if(b)b.click()});group.classList.add('simpleHidden');group.parentNode.insertBefore(ui.wrap,group);ui.select.value='collections-summary';const summary=buttons.find(x=>x.dataset.view==='collections-summary');if(summary)summary.click()}
    function sourceRow(name){return [...document.querySelectorAll('.source')].find(r=>(r.querySelector('.sourceMain b')?.textContent||'').trim()===name)}
    function paintSource(name,ok,detail,reconnect){const row=sourceRow(name);if(!row)return;const state=row.querySelector('.sourceState'),time=row.querySelector('.sourceTime');if(!state)return;if(ok){state.innerHTML='<div class="connStatus good">✓ &nbsp; CONNECTED</div>';if(time)time.innerHTML='Live check passed<br>'+new Date().toLocaleString();return}if(reconnect){state.innerHTML='<button class="connBtn" type="button">↻ &nbsp; RECONNECT GOOGLE</button>';const btn=state.querySelector('button');if(btn)btn.onclick=()=>window.location.assign('/oauth/start')}else state.innerHTML='<div class="connStatus watch">◷ &nbsp; RETRYING</div>';if(time)time.innerHTML=(detail||'Connection needs attention')+'<br>Auto-checking every minute'}
    function money(v){return '$'+Number(v||0).toFixed(2)}
    function setDecision(title,reason,reminder,metrics,href,label){const t=document.getElementById('decisionTitle'),r=document.getElementById('decisionReason'),rm=document.getElementById('decisionReminder'),m=document.getElementById('decisionMetrics'),b=document.getElementById('decisionBtn');if(t){t.textContent=title;t.classList.remove('decisionLoading')}if(r)r.textContent=reason;if(rm)rm.textContent=reminder;if(m)m.innerHTML=(metrics||[]).map(x=>'<span class="decisionMetric">'+x+'</span>').join('');if(b){b.href=href||'/growth-marketing';b.textContent=label||'OPEN ACTION PAGE →'}}
    async function nextBestAction(){try{const [dr,hr]=await Promise.all([fetch('/api/dashboard',{cache:'no-store'}),fetch('/api/system-health',{cache:'no-store'})]);const d=await dr.json(),h=await hr.json(),hc=h.checks||{};if(!hc.google?.ok||!hc.google_ads?.ok||!d?.periods){setDecision('RECONNECT GOOGLE FIRST','I cannot safely tell you whether to wait or create new ads until the Google Ads data is live.','Reconnect first. Do not make marketing decisions from incomplete data.',[],'/oauth/start','RECONNECT GOOGLE →');return}const p7=d.periods.last_7_days||{},pt=d.periods.today||{},all7=p7.all_campaigns||{},allT=pt.all_campaigns||{},spend7=Number(all7.spend||0),spendToday=Number(allT.spend||0),clicks7=Number(all7.clicks||0),conv7=Number(all7.conversions||0),cpa=Number(all7.cost_per_conversion||0),campaigns=Object.values(p7.campaigns||{}),enabled=campaigns.filter(c=>c.status==='ENABLED').length;const metrics=['7-day spend '+money(spend7),'7-day clicks '+clicks7,'tracked conversions '+conv7];if(conv7>0)metrics.push('cost / conversion '+money(cpa));if(enabled)metrics.push(enabled+' enabled campaign'+(enabled===1?'':'s'));
      if(spend7<1){setDecision('CREATE A NEW CAMPAIGN','There is no meaningful Google Ads spend in the last 7 days, so there is nothing currently gathering enough paid data.','Go to Growth & Marketing and create a campaign. After launch, come back here and let the data build before changing it again.',metrics,'/growth-marketing','CREATE CAMPAIGN →');return}
      if(spendToday>0&&(spend7<150||clicks7<25)){setDecision('WAIT — LET THE ADS GATHER DATA','Your ads are spending today, but the last 7 days still have limited data. Changing the campaign too quickly can make it harder to tell what is working.','Wait about 2–3 days before making a major change unless there is an obvious problem. Check this Dashboard again first.',metrics,'/','STAY ON DASHBOARD');return}
      if(spend7>=150&&conv7===0){setDecision('TAKE ACTION — REFRESH THE CREATIVE','There is enough recent spend to deserve attention, but Google is showing zero tracked conversions in the last 7 days.','Do not just raise the budget. Create a stronger graphic/message or verify conversion tracking and the landing experience.',metrics,'/growth-marketing','CREATE BETTER ADS →');return}
      if(conv7>0&&cpa>0&&cpa<=20){setDecision('KEEP RUNNING — DO NOT CHANGE IT YET','The current ads are producing tracked conversions at a reasonable recent cost. There is no need to create a new paid campaign just because the app is open.','Let the winning campaign continue. Review again in a few days; create a new variation only when performance weakens or the creative gets stale.',metrics,'/','KEEP WATCHING');return}
      if(conv7>0&&cpa>20){setDecision('REVIEW & IMPROVE — DO NOT PANIC','The ads are producing tracked conversions, but the recent cost per conversion is high enough to review the creative, offer and targeting.','Create a new variation before making a large budget change. Compare the new creative against the current ad instead of replacing everything at once.',metrics,'/growth-marketing','CREATE A VARIATION →');return}
      if(spendToday===0&&spend7>0){setDecision('CHECK THE CAMPAIGN BEFORE CREATING A NEW ONE','There was ad spend during the last 7 days, but no spend is showing today.','Check campaign status, schedule and connection first. Do not create a duplicate campaign until you know why today is quiet.',metrics,'/growth-marketing','CHECK / TAKE ACTION →');return}
      setDecision('KEEP WATCHING','Your campaign has recent activity. There is not enough evidence to recommend a major change right now.','Give the campaign time, then use this Dashboard to decide whether the next move is wait, refresh creative or create something new.',metrics,'/','STAY ON DASHBOARD');
    }catch(e){setDecision('CHECK CONNECTIONS','I could not read the live ad data needed to make a recommendation.',e.message||'Try again shortly.',['Live recommendation unavailable'],'/growth-marketing','OPEN ACTION PAGE →')}}
    async function connectionWatch(){try{const r=await fetch('/api/system-health',{cache:'no-store'}),d=await r.json(),c=d.checks||{};paintSource('Google Ads',!!c.google_ads?.ok,c.google_ads?.detail,!c.google?.ok);paintSource('Collections Database',!!c.collections?.ok,c.collections?.detail,false);const top=document.getElementById('connection');if(top)top.textContent=c.google_ads?.ok?'Google Ads Connected':(!c.google?.ok?'Google Needs Reconnect':'Google Ads Retrying');if(typeof window.loadGoogleConnections==='function')window.loadGoogleConnections()}catch(e){paintSource('Google Ads',false,e.message,false);paintSource('Collections Database',false,e.message,false)}}
    ready(()=>{setupPeriodDropdown();setupCollectionsDropdown();connectionWatch();nextBestAction();setInterval(()=>{connectionWatch();nextBestAction()},60000)});
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
    function render(mode){const p=getPkg();if(!p)return;const body=document.getElementById('modalBody'),modal=document.getElementById('modal');if(!body||!modal)return;const approved=mode==='approved'||!!localStorage.getItem(APPROVED);const total=Number(p.dailyBudget||0)*Number(p.duration||0);const channels=[];if(p.channels?.meta)channels.push(['Facebook + Instagram Ads','One-time Facebook Page authorization required','meta']);if(p.channels?.google)channels.push(['Google Ads + YouTube','Google reporting is connected; verify publishing access before launch','google']);if(p.channels?.orgMeta)channels.push(['Facebook + Instagram Organic','One-time Facebook Page authorization required','meta']);if(p.channels?.orgTikTok)channels.push(['TikTok Organic','TikTok publishing connection is not wired yet','meta']);if(p.channels?.orgYouTube)channels.push(['YouTube Shorts','YouTube publishing connection is not wired yet','meta']);if(p.channels?.orgGBP)channels.push(['Google Business Profile','Verify or reconnect Google Business Profile access','google']);body.innerHTML=`<div class="card" style="margin-top:14px"><b>${esc(p.hook)}</b><div class="small" style="margin-top:5px">Offer: ${esc(p.offer)} • Maximum paid budget: $${Number(p.dailyBudget||0).toFixed(2)}/day × ${Number(p.duration||0)} days = $${total.toFixed(2)}</div></div><div class="approvalGuide"><h3>What do I do now?</h3><div class="small">Follow these four steps. You can approve the campaign even before every channel is connected.</div><div class="approvalSteps"><div class="approvalStep"><strong>1. Review</strong>Make sure the offer, message and budget look right.</div><div class="approvalStep"><strong>2. Approve</strong>Approve this campaign package.</div><div class="approvalStep"><strong>3. Connect</strong>Connect only the channels you want to use.</div><div class="approvalStep"><strong>4. Advertise</strong>Launch only after you confirm.</div></div>${approved?'<div class="approvedBanner">✓ CAMPAIGN APPROVED — next, connect the channels you want and continue to Advertise.</div>':''}</div><div class="platformList">${channels.map(x=>`<div class="platformRow"><div><b>${esc(x[0])}</b><div class="small">${esc(x[1])}</div></div>${x[2]==='google'?'<button class="platformAction google" data-google>VERIFY / RECONNECT</button>':'<button class="platformAction meta" data-meta>CONNECT</button>'}</div>`).join('')}</div><div class="approvalActions"><button class="approvalBack" id="guideBack">← Back to Campaign</button>${approved?'':'<button class="approvalApprove" id="guideApprove">✓ Approve This Campaign</button>'}<a class="approvalConnect" href="/growth-marketing">Connections</a>${approved?'<button class="approvalAdvertise" id="guideAdvertise">Continue to Advertise →</button>':''}</div><div class="notice ${approved?'good':'warn'}">${approved?'Your campaign is approved, but nothing has been published yet. You remain in control of the final launch.':'Nothing has been published. Review and approve first.'}</div>`;body.querySelectorAll('[data-google]').forEach(b=>b.onclick=()=>window.location.assign('/oauth/start'));body.querySelectorAll('[data-meta]').forEach(b=>b.onclick=facebookHelp);document.getElementById('guideBack').onclick=closeModal;const a=document.getElementById('guideApprove');if(a)a.onclick=approve;const ad=document.getElementById('guideAdvertise');if(ad)ad.onclick=()=>render('advertise');modal.classList.add('show')}
    ready(()=>{const preview=document.getElementById('preview'),advertise=document.getElementById('advertise');if(preview)preview.onclick=()=>render('preview');if(advertise)advertise.onclick=()=>render(localStorage.getItem(APPROVED)?'approved':'preview')});
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

async function serveDashboard(request, env) { return transformHtml(await env.ASSETS.fetch(assetRequest(request, '/index.html')), dashboardEnhancements()); }
async function serveGrowth(request, env) { return transformHtml(await env.ASSETS.fetch(assetRequest(request, '/owner-hub.html')), growthEnhancements()); }
async function serveCampaign(request, env) { return transformHtml(await env.ASSETS.fetch(assetRequest(request, '/campaign-studio.html')), campaignEnhancements()); }

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/system-health') return systemHealth(core, request, env, ctx);
    if (DASHBOARD_PATHS.has(url.pathname)) return serveDashboard(request, env);
    if (GROWTH_PATHS.has(url.pathname)) return serveGrowth(request, env);
    if (CAMPAIGN_PATHS.has(url.pathname)) return serveCampaign(request, env);
    return core.fetch(request, env, ctx);
  }
};