(function(){
  'use strict';

  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function pct(now,prev){now=Number(now||0);prev=Number(prev||0);return prev>0?((now-prev)/prev*100):null;}
  function fmtPct(v){return v==null?'Not enough data':(v>=0?'+':'')+v.toFixed(0)+'%';}
  function money(v){return '$'+Number(v||0).toFixed(2);}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function addStyle(){
    if(document.getElementById('conversionDiagnosisStyle'))return;
    var s=document.createElement('style');s.id='conversionDiagnosisStyle';s.textContent='\
      .conversionDiag{background:#fff;border:2px solid #bfdbfe;border-radius:18px;padding:16px;margin-top:12px;box-shadow:0 8px 24px #0c4a6e0b}\
      .conversionDiagHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.conversionDiagHead h2{margin:0}.conversionDiagHead p{margin:4px 0 0;color:#64748b;font-size:13px;max-width:780px}\
      .focusBadge{background:#e0f2fe;color:#075985;border-radius:999px;padding:8px 11px;font-size:11px;font-weight:950}\
      .conversionGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.conversionCard{border:1px solid #dbeafe;background:#f8fbff;border-radius:15px;padding:14px}.conversionCard h3{margin:0 0 8px;color:#0f3f66}.diagTitleRow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:8px}.diagTitleRow h3{margin:0}.diagSignal{display:inline-block;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;margin-bottom:8px}.diagTitleRow .diagSignal{margin-bottom:0}.diagGood{background:#39f06f;color:#000;border:1px solid #0da83c}.diagHold{background:#fef3c7;color:#92400e}.diagGather{background:#ff9f1a;color:#000;border:1px solid #d87500}.diagBad{background:#ff4d4d;color:#000;border:1px solid #c41414}.diagInfo{background:#e0f2fe;color:#075985}.diagReason{color:#334155;line-height:1.45;font-size:13px}.diagAction{margin-top:9px;padding:10px 11px;border-radius:11px;background:#fff;border:1px solid #dbeafe;color:#0f3f66;font-size:13px;font-weight:850}.diagMetrics{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.diagMetric{background:#fff;border:1px solid #dbeafe;border-radius:999px;padding:6px 8px;font-size:11px;color:#475569;font-weight:800}.diagFoot{margin-top:12px;color:#64748b;font-size:12px}.diagLink{display:inline-flex;margin-top:10px;text-decoration:none;background:#075985;color:#fff;border-radius:10px;padding:9px 12px;font-weight:900;font-size:12px}@media(max-width:800px){.conversionGrid{grid-template-columns:1fr}}\
    ';document.head.appendChild(s);
  }

  function ensurePanel(){
    var existing=document.getElementById('conversionDiagnosis');if(existing)return existing;
    var health=document.querySelector('.health');if(!health)return null;
    var section=document.createElement('section');section.id='conversionDiagnosis';section.className='conversionDiag';
    section.innerHTML='<div class="conversionDiagHead"><div><h2>Conversion Diagnosis</h2><p>The app diagnoses Self-Service separately from Wash & Fold / PUD. Completed weeks drive decisions; the unfinished current week is information only.</p></div><span class="focusBadge">FOCUS: W&F / PUD GROWTH FIRST</span></div><div class="conversionGrid"><div class="conversionCard" id="selfServiceDiag"><h3>Self-Service</h3><span class="diagSignal diagInfo">CHECKING DATA</span><div class="diagReason">Loading completed weekly history…</div></div><div class="conversionCard" id="washFoldDiag"><h3>Wash & Fold / PUD</h3><span class="diagSignal diagInfo">CHECKING DATA</span><div class="diagReason">Loading completed weekly history…</div></div></div><div class="diagFoot">The app will not claim a retention problem until repeat-customer/order-level data is actually connected. Google tracked actions are supporting signals, not completed laundry orders.</div>';
    health.insertAdjacentElement('afterend',section);return section;
  }

  function renderCard(id,title,signal,klass,reason,action,metrics,link){
    var el=document.getElementById(id);if(!el)return;
    var gathering=signal==='STILL GATHERING DATA';
    var html=gathering?'<div class="diagTitleRow"><h3>'+esc(title)+'</h3><span class="diagSignal diagGather">'+esc(signal)+'</span></div>':'<h3>'+esc(title)+'</h3><span class="diagSignal '+klass+'">'+esc(signal)+'</span>';
    html+='<div class="diagReason">'+esc(reason)+'</div><div class="diagAction"><b>What to do:</b> '+esc(action)+'</div><div class="diagMetrics">';
    (metrics||[]).forEach(function(x){html+='<span class="diagMetric">'+esc(x)+'</span>';});
    html+='</div>';
    if(link)html+='<a class="diagLink" href="'+esc(link.href)+'">'+esc(link.label)+'</a>';
    el.innerHTML=html;
  }

  async function load(){
    ensurePanel();
    try{
      var responses=await Promise.all([fetch('/api/marketing-weekly',{cache:'no-store'}),fetch('/api/dashboard',{cache:'no-store'})]);
      var weekly=await responses[0].json();var dash=await responses[1].json();
      var history=Array.isArray(weekly.history)?weekly.history:[];
      var currentEnd=weekly.current&&weekly.current.week_end;
      var completed=history.filter(function(x){return !currentEnd||x.week_end!==currentEnd;});
      var latest=completed.length?completed[completed.length-1]:null;
      var prev=completed.length>1?completed[completed.length-2]:null;

      if(!latest||!prev){
        var m=['Completed comparable weeks '+completed.length];
        renderCard('selfServiceDiag','Self-Service','STILL GATHERING DATA','diagHold','There are not yet two completed comparable weeks. The app will not call a conversion problem from a partial week.','Keep normal operations running. Use this time to cross-sell Wash & Fold to customers already inside the laundromat.',m,null);
        renderCard('washFoldDiag','Wash & Fold / PUD','STILL GATHERING DATA','diagHold','There are not yet two completed comparable weeks, so there is not enough reliable information to identify the leak.','Keep the current campaign steady. Do not change ads from an unfinished-week drop.',m,null);
        return;
      }

      var ssNow=Number(latest.self_service||0),ssPrev=Number(prev.self_service||0),ssChange=pct(ssNow,ssPrev);
      var wfNow=Number(latest.wash_fold||0),wfPrev=Number(prev.wash_fold||0),wfChange=pct(wfNow,wfPrev);
      var clickNow=Number(latest.clicks_7d||0),clickPrev=Number(prev.clicks_7d||0),clickChange=pct(clickNow,clickPrev);
      var actionNow=Number(latest.tracked_actions_7d||0),spendNow=Number(latest.ad_spend_7d||0),spendPrev=Number(prev.ad_spend_7d||0),spendChange=pct(spendNow,spendPrev);

      if(ssChange==null){
        renderCard('selfServiceDiag','Self-Service','STILL GATHERING DATA','diagHold','The prior completed week does not have enough Self-Service revenue to calculate a reliable change.','Keep collecting completed weekly revenue before making a Self-Service change.',['Latest '+money(ssNow),'Prior '+money(ssPrev)],null);
      }else if(ssChange>=-10){
        renderCard('selfServiceDiag','Self-Service','GOOD FOR NOW','diagGood','Completed-week Self-Service revenue is stable or improving. This side of the business does not need a major marketing reset.','Protect the strong Self-Service business and use the in-store traffic to cross-sell Wash & Fold: signage at washers/folding tables, receipt messaging, and attendant mentions.',['Completed revenue '+money(ssNow),'Prior '+money(ssPrev),'Change '+fmtPct(ssChange)],null);
      }else{
        renderCard('selfServiceDiag','Self-Service','TRAFFIC / REPEAT VISIT CHECK','diagBad','Completed-week Self-Service revenue is down enough to deserve attention, but ad clicks alone cannot tell us whether the cause is fewer store visits or fewer repeat visits.','Do not change Wash & Fold ads because of this. Review store traffic, FasCard activity/turns, loyalty usage, and local Self-Service promotions.',['Completed revenue '+money(ssNow),'Prior '+money(ssPrev),'Change '+fmtPct(ssChange)],null);
      }

      var wfMetrics=['Completed W&F '+money(wfNow),'Prior '+money(wfPrev),'W&F change '+fmtPct(wfChange),'Clicks '+clickNow+' ('+fmtPct(clickChange)+')','Ad spend '+money(spendNow)+' ('+fmtPct(spendChange)+')','Google tracked actions '+actionNow];

      if(wfChange==null){
        renderCard('washFoldDiag','Wash & Fold / PUD','STILL GATHERING DATA','diagHold','There is not enough completed Wash & Fold revenue history to calculate a reliable conversion trend.','Keep the current campaign steady and let another full week complete.',wfMetrics,null);
      }else if(wfChange>=5){
        renderCard('washFoldDiag','Wash & Fold / PUD','GOOD FOR NOW','diagGood','Completed-week Wash & Fold revenue is improving. Do not disrupt a campaign that may be working.','Keep the current ads and landing pages steady. Continue using nearly 300 5-star reviews, your phone number, and the correct service page as trust proof.',wfMetrics,null);
      }else if(wfChange<=-15 && clickChange!=null && clickChange<=-20){
        renderCard('washFoldDiag','Wash & Fold / PUD','TRAFFIC PROBLEM','diagBad','Completed Wash & Fold revenue is down and qualified ad traffic is also down. The first leak appears to be getting enough people into the service funnel.','Focus the next test on reach and message strength, not price cuts: stronger local trust, nearly 300 5-star reviews, convenience, and Free Pickup for PUD.',wfMetrics,{href:'/campaign-studio.html',label:'OPEN CAMPAIGN STUDIO'});
      }else if(wfChange<=-15 && actionNow===0 && (clickChange==null||clickChange>-20)){
        renderCard('washFoldDiag','Wash & Fold / PUD','LANDING PAGE / CTA PROBLEM','diagBad','Traffic is not collapsing, but completed Wash & Fold revenue is down and Google shows no tracked actions. The likely leak is after the click.','Keep the ad test controlled. Strengthen the CTA, make the phone/order step obvious, and send each ad directly to the correct Wash & Fold or PUD page.',wfMetrics,{href:'/campaign-studio.html',label:'FIX CUSTOMER PATH'});
      }else if(wfChange<=-15 && actionNow>0){
        renderCard('washFoldDiag','Wash & Fold / PUD','SALES / ORDER CONVERSION CHECK','diagBad','Google is seeing customer actions, but completed Wash & Fold revenue is still down. That means people may be engaging without enough completed paid orders.','Check calls, scheduled orders, first-order completion and staff follow-up. Do not call this a retention problem yet because repeat-order data is not connected.',wfMetrics,null);
      }else{
        renderCard('washFoldDiag','Wash & Fold / PUD','ON HOLD — KEEP RUNNING','diagHold','Completed-week data is mixed and does not identify one clear conversion leak yet.','Do not make a major reset. Keep collecting another completed week and let the app narrow the diagnosis.',wfMetrics,null);
      }
    }catch(e){
      renderCard('selfServiceDiag','Self-Service','DATA CHECK NEEDED','diagInfo','The app could not load enough data to diagnose Self-Service right now.','Check the Dashboard connections and weekly history.',[e.message||'Data unavailable'],null);
      renderCard('washFoldDiag','Wash & Fold / PUD','DATA CHECK NEEDED','diagInfo','The app could not load enough data to diagnose Wash & Fold right now.','Check the Dashboard connections and weekly history.',[e.message||'Data unavailable'],null);
    }
  }

  ready(function(){addStyle();ensurePanel();load();setInterval(load,60000);});
})();