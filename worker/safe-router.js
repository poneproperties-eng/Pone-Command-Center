import core from './index.js';
import { systemHealth } from './system-health.js';
import { weeklyMarketing } from './weekly-marketing.js';

const DASHBOARD_PATHS=new Set(['/','/spin-cycle-ai-marketing','/spin-cycle-ai-marketing/','/spin-cycle-ai-marketing.html']);
const GROWTH_PATHS=new Set(['/owner','/owner/','/owner-hub','/owner-hub/','/growth-marketing','/growth-marketing/']);
const CAMPAIGN_PATHS=new Set(['/campaign-studio','/campaign-studio/','/campaign-studio.html']);

function assetRequest(request,path){var url=new URL(request.url);url.pathname=path;url.search='';return new Request(url.toString(),{method:'GET',headers:request.headers});}

function nav(active){
  return '<style>.spinCycleTabs{max-width:1600px;margin:10px auto 0;padding:0 12px;display:flex;gap:8px;flex-wrap:wrap;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.spinCycleTab{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:999px;border:1px solid #bfdbfe;background:#eff6ff;color:#075985;text-decoration:none;font-weight:900}.spinCycleTab.active{background:#075985;color:#fff;border-color:#075985}@media(max-width:700px){.spinCycleTabs{padding:0 7px}.spinCycleTab{flex:1}}</style><nav class="spinCycleTabs"><a class="spinCycleTab '+(active==='dashboard'?'active':'')+'" href="/">Dashboard</a><a class="spinCycleTab '+(active==='growth'?'active':'')+'" href="/growth-marketing">Growth &amp; Marketing</a></nav>';
}

function dashboardBlock(){
  var css='<link rel="stylesheet" href="/dashboard-theme.css?v=3"><style id="safeDashboardStyle">.simpleSelectWrap{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.simpleSelectLabel{font-size:12px;font-weight:900;color:#164e7a}.simpleSelect{min-width:180px;border:1px solid #93c5fd;border-radius:999px;padding:10px 38px 10px 14px;background:#fff;color:#075985;font-weight:900}.periods.simpleHidden,.viewToggle.simpleHidden{display:none!important}.ownerDecisionWrap{max-width:1600px;margin:10px auto 14px;padding:0 12px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.ownerDecision{background:linear-gradient(135deg,#082f49,#075985);color:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 30px #0c4a6e22}.decisionTop{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}.decisionEyebrow{font-size:12px;font-weight:950;letter-spacing:.08em;color:#bae6fd}.decisionTitle{font-size:28px;font-weight:950;line-height:1.05;margin-top:5px}.decisionReason{margin-top:8px;color:#e0f2fe;max-width:940px;line-height:1.45}.decisionMetrics{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.decisionMetric{background:#ffffff18;border:1px solid #ffffff25;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:850}.decisionBtn{display:inline-flex;align-items:center;justify-content:center;background:#fff;color:#075985;text-decoration:none;border-radius:12px;padding:12px 15px;font-weight:950;white-space:nowrap}.decisionReminder{margin-top:12px;border-radius:12px;padding:10px 12px;background:#ffffff12;color:#e0f2fe;font-size:13px}.decisionSource{margin-top:8px;color:#bae6fd;font-size:11px}.compDash{background:#fff;border:1px solid #bfdbfe;border-radius:16px;padding:15px;margin-top:12px;color:#0f172a}.compDashHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap}.compDashHead h2{margin:0;font-size:21px}.compDashHead p{margin:4px 0 0;color:#64748b;font-size:13px}.compDashGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.compDashCard{border:1px solid #dbeafe;background:#f8fbff;border-radius:13px;padding:12px}.compDashCard b{display:block;color:#0f3f66;margin-bottom:4px}.compDashCard p{margin:0 0 9px;color:#64748b;font-size:12px;line-height:1.4}.compDashActions{display:flex;gap:6px}.compMini{flex:1;text-align:center;text-decoration:none;border-radius:9px;padding:8px;background:#e0f2fe;color:#075985;font-size:11px;font-weight:950}.compMini.action{background:#16a34a;color:#fff}@media(max-width:800px){.compDashGrid{grid-template-columns:1fr}.decisionTitle{font-size:23px}.decisionBtn{width:100%}}@media(max-width:700px){.simpleSelect{width:100%;min-width:0}.ownerDecisionWrap{padding:0 7px}}</style>';
  var html='<div class="ownerDecisionWrap"><section class="ownerDecision"><div class="decisionTop"><div><div class="decisionEyebrow">NEXT BEST ACTION</div><div class="decisionTitle" id="decisionTitle">Checking your numbers…</div><div class="decisionReason" id="decisionReason">Looking at ad activity and actual Wash & Fold revenue before recommending anything.</div></div><a class="decisionBtn" id="decisionBtn" href="/growth-marketing">OPEN ACTION PAGE →</a></div><div class="decisionMetrics" id="decisionMetrics"></div><div class="decisionReminder" id="decisionReminder">If ads are gathering useful data and revenue is holding up, the better move may be to wait.</div><div class="decisionSource">Decision uses Google Ads activity + saved collections. Google tracked actions are a marketing signal, not completed laundry orders.</div></section><section class="compDash"><div class="compDashHead"><div><h2>Competitor Watch</h2><p>See what works, then make Spin Cycle better.</p></div><a class="compMini" style="flex:0 0 auto;padding:9px 12px" href="/competitor-watch.html">FULL COMPETITOR INTELLIGENCE</a></div><div class="compDashGrid"><div class="compDashCard"><b>Splash Laundry</b><p>Watch local trust, turnaround promises, reviews and service positioning.</p><div class="compDashActions"><a class="compMini" href="https://www.splashlaundry.com/services" target="_blank" rel="noopener">OPEN SITE</a><a class="compMini action" href="/competitor-watch.html">TAKE ACTION</a></div></div><div class="compDashCard"><b>HappyNest</b><p>Watch recurring pickup, preferences, convenience messaging and customer communication.</p><div class="compDashActions"><a class="compMini" href="https://www.happynest.com/laundry-service" target="_blank" rel="noopener">OPEN SITE</a><a class="compMini action" href="/competitor-watch.html">TAKE ACTION</a></div></div><div class="compDashCard"><b>Laundromax</b><p>Watch pickup/delivery positioning, order tracking, customization and ordering simplicity.</p><div class="compDashActions"><a class="compMini" href="https://laundromax.com/delivery/" target="_blank" rel="noopener">OPEN SITE</a><a class="compMini action" href="/competitor-watch.html">TAKE ACTION</a></div></div></div></section></div>';
  return nav('dashboard')+css+html+'<script src="/dashboard-ui.js?v=1" defer></script><script src="/dashboard-decision.js?v=5" defer></script>';
}

function growthBlock(){return '<link rel="stylesheet" href="/growth-theme.css?v=2"><script src="/conversion-diagnosis.js?v=2" defer></script>';}
function campaignBlock(){return nav('growth')+'<link rel="stylesheet" href="/campaign-theme.css?v=1"><script src="/campaign-approval.js?v=2" defer></script><script src="/campaign-preview-master-style.js?v=3" defer></script>';}

const PWA_HEAD='<link rel="manifest" href="/manifest.json"><link rel="apple-touch-icon" href="/icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="Spin Cycle">';
const PWA_SCRIPT='<script id="spinCyclePwa">if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(function(e){console.error("Spin Cycle service worker registration failed",e);});});}</script>';

async function transform(response,insert,pwa){
  if(!response.ok)return response;var type=response.headers.get('content-type')||'';if(!type.includes('text/html'))return response;
  var html=await response.text();
  if(pwa&&html.includes('</head>')&&!html.includes('rel="manifest"'))html=html.replace('</head>',PWA_HEAD+'</head>');
  html=html.includes('<body>')?html.replace('<body>','<body>'+insert+(pwa?PWA_SCRIPT:'')):insert+(pwa?PWA_SCRIPT:'')+html;
  var headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');return new Response(html,{status:response.status,statusText:response.statusText,headers:headers});
}

async function serveAsset(request,env,path,insert,pwa){var response=await env.ASSETS.fetch(assetRequest(request,path));return insert?transform(response,insert,pwa):response;}

export default {
  async fetch(request,env,ctx){
    var url=new URL(request.url);
    if(url.pathname==='/api/system-health')return systemHealth(core,request,env,ctx);
    if(url.pathname==='/api/marketing-weekly')return weeklyMarketing(core,request,env,ctx);
    if(DASHBOARD_PATHS.has(url.pathname))return serveAsset(request,env,'/index.html',dashboardBlock(),true);
    if(GROWTH_PATHS.has(url.pathname))return serveAsset(request,env,'/owner-hub.html',growthBlock(),false);
    if(CAMPAIGN_PATHS.has(url.pathname))return serveAsset(request,env,'/campaign-studio.html',campaignBlock(),false);
    return core.fetch(request,env,ctx);
  }
};